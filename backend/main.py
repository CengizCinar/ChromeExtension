from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import keepa
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API anahtarı
KEEPA_API_KEY = os.getenv("KEEPA_API_KEY", "2nc6nr6ui11o4q099eb0cp8eovroo96jo9daer4v3jkcf94ejuqjqpodbkbtkqes")

try:
    api = keepa.Keepa(KEEPA_API_KEY)
except Exception as e:
    print(f"Keepa API bağlantı hatası: {str(e)}")
    raise

class ProductRequest(BaseModel):
    asin: str

@app.get("/")
async def root():
    return {"status": "API çalışıyor", "version": "1.0"}

@app.post("/product")
async def get_product(product_req: ProductRequest):
    try:
        asin = product_req.asin
        print(f"ASIN: {asin}")
        
        # Keepa API'den ürün verilerini al
        products = api.query(
            asin,
            stats=90,
            offers=100,
            history=True,
            rating=True,
            buybox=True,
            stock=True
        )
        
        if not products:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
            
        product = products[0]
        print("Product data received from Keepa API")

        # Satıcı bilgilerini al
        seller_info = []
        offers = product.get('offers', [])
        
        # Aktif satıcıları bul
        for idx in product.get('liveOffersOrder', []):
            if idx < len(offers):
                offer = offers[idx]
                seller_id = offer.get('sellerId', 'Unknown')
                fulfillment_type = 'FBA' if offer.get('isPrime', False) else 'FBM'
                total_price = None
                
                if 'offerCSV' in offer:
                    csv_data = offer['offerCSV']
                    if csv_data and len(csv_data) >= 3:
                        price = csv_data[-2]
                        shipping = csv_data[-1]
                        if price != -1:
                            total_price = (price + (shipping if shipping != -1 else 0)) / 100
                
                stock = 'N/A'
                if 'stockCSV' in offer:
                    stock_data = offer['stockCSV']
                    if stock_data and len(stock_data) > 0:
                        last_stock = stock_data[-1]
                        if last_stock != -1:
                            stock = last_stock
                
                amazon_url = f"https://www.amazon.com/sp?seller={seller_id}"
                color_style = {
                    "backgroundColor": "#4CAF50" if fulfillment_type == 'FBA' else "#FFF59D",
                    "color": "#FFFFFF" if fulfillment_type == 'FBA' else "#000000"
                }
                
                if total_price is not None:
                    seller_info.append({
                        'fulfillmentType': fulfillment_type,
                        'sellerId': seller_id,
                        'amazonUrl': amazon_url,
                        'totalPrice': f"{total_price:.2f} €",
                        'stock': stock,
                        'colorStyle': color_style,
                        'lastSeen': offer.get('lastSeen', 0),
                        'totalPriceFloat': total_price  # Sayısal değeri ekliyoruz
                    })

        # TotalPrice'a göre en düşükten en yükseğe sırala
        seller_info.sort(key=lambda x: x['totalPriceFloat'])

        # Gereksiz alanları kaldır
        for seller in seller_info:
            del seller['totalPriceFloat']

        # BuyBox istatistiklerini al
        buybox_stats = []
        stats = product.get('stats', {})
        
        if stats and 'buyBoxStats' in stats:
            buybox_stats_data = stats.get('buyBoxStats', {})
            
            for seller_id, seller_stats in buybox_stats_data.items():
                amazon_url = f"https://www.amazon.com/sp?seller={seller_id}"
                won_rate = seller_stats.get('percentageWon', 0)
                # 1'den küçük tüm değerler için <1% göster
                if won_rate < 1:
                    formatted_rate = "<1"
                else:
                    formatted_rate = str(round(won_rate))  # Tam sayıya yuvarla
                
                is_fba = seller_stats.get('isFBA', False)
                
                buybox_stats.append({
                    'sellerId': seller_id,
                    'amazonUrl': amazon_url,
                    'wonRate': f"{formatted_rate}%",  # Formatlı değeri kullan
                    'fulfillmentType': 'FBA' if is_fba else 'FBM',
                    'colorStyle': {
                        "backgroundColor": "#4CAF50" if is_fba else "#FFF59D",
                        "color": "#FFFFFF" if is_fba else "#000000"
                    }
                })
            
            buybox_stats.sort(key=lambda x: float(x['wonRate'].replace('<','0').replace('%', '')), reverse=True)
        
        # Dimensions (mm -> cm dönüşümü)
        dimensions = {
            "height": round(product.get("packageHeight", 0) / 10) if product.get("packageHeight") else None,
            "length": round(product.get("packageLength", 0) / 10) if product.get("packageLength") else None,
            "width": round(product.get("packageWidth", 0) / 10) if product.get("packageWidth") else None,
            "weight": product.get("packageWeight", None)
        }

        # Box capacity hesaplaması
        BOX_DIMENSIONS = {"height": 55, "length": 55, "width": 45}
        BOX_VOLUME = BOX_DIMENSIONS["height"] * BOX_DIMENSIONS["length"] * BOX_DIMENSIONS["width"]
        BOX_MAX_WEIGHT = 23000
        BOX_COST = 165

        def calculate_box_capacity(dimensions, weight):
            if not dimensions or not dimensions["height"] or not dimensions["length"] or not dimensions["width"] or not weight:
                return None
            product_volume = dimensions["height"] * dimensions["length"] * dimensions["width"]
            volume_based_capacity = BOX_VOLUME // product_volume
            weight_based_capacity = BOX_MAX_WEIGHT // weight
            actual_capacity = min(volume_based_capacity, weight_based_capacity)
            unit_cost = BOX_COST / actual_capacity if actual_capacity else None
            return {"capacity": actual_capacity, "unitCost": unit_cost}
        
        box_capacity = calculate_box_capacity(dimensions, dimensions["weight"])

        # Buybox fiyatı ve kargo
        current_buybox_price = None
        current_buybox_shipping = 0
        
        if "data" in product:
            print("Mevcut data içeriği:", product["data"])
            stats = product.get('stats', {})
            if stats:
                bb_price = stats.get('buyBoxPrice', -1)
                if bb_price != -1:
                    current_buybox_price = bb_price / 100
                    print(f"Stats'tan alınan buybox fiyatı: {current_buybox_price}")

            if current_buybox_price is None and "csv" in product:
                csv_data = product["csv"]
                if csv_data and len(csv_data) > 18:
                    buybox_data = csv_data[18]
                    if isinstance(buybox_data, list) and len(buybox_data) >= 3:
                        price = buybox_data[-2]
                        shipping = buybox_data[-1]
                        if price != -1:
                            current_buybox_price = price / 100
                            current_buybox_shipping = shipping / 100 if shipping != -1 else 0
                            print(f"CSV'den alınan buybox fiyatı: {current_buybox_price}")
                            print(f"CSV'den alınan kargo: {current_buybox_shipping}")

        buybox_price = f"{current_buybox_price:.2f} €" if current_buybox_price is not None else "No buybox price available"
        buybox_shipping = f"{current_buybox_shipping:.2f} €"
        total_buybox_price = f"{(current_buybox_price + current_buybox_shipping):.2f} €" if current_buybox_price is not None else "No buybox price available"

        # FBA ve referral fee bilgileri
        pick_and_pack_fee = product.get("fbaFees", {}).get("pickAndPackFee", None)
        referral_fee_percentage = product.get("referralFeePercentage", None)

        # Return rate
        return_rate = product.get("returnRate", None)
        
        # EAN listesi
        all_eans = product.get("eanList", [])

        # Manufacturer
        manufacturer = product.get("manufacturer", None)

        # Shipping cost hesaplama
        def calculate_shipping_cost(weight):
            if not weight:
                return "N/A"
            shipping_rates = [
                {"maxWeight": 150, "price": 1.50},
                {"maxWeight": 300, "price": 2.00},
                {"maxWeight": 500, "price": 3.00},
                {"maxWeight": 750, "price": 4.00},
                {"maxWeight": 1000, "price": 5.00}
            ]
            for rate in shipping_rates:
                if weight <= rate["maxWeight"]:
                    return f"{rate['price']:.2f} €"
            return "5.00 €"
        
        shipping_cost = calculate_shipping_cost(dimensions["weight"])

        # Response
        response_data = {
            "success": True,
            "allEans": all_eans,
            "manufacturer": manufacturer,
            "dimensions": dimensions,
            "returnRate": return_rate,
            "shippingCost": shipping_cost,
            "boxCapacity": box_capacity,
            "pickAndPackFee": pick_and_pack_fee,
            "referralFeePercentage": referral_fee_percentage,
            "buyboxPrice": buybox_price,
            "buyboxShipping": buybox_shipping,
            "totalBuyboxPrice": total_buybox_price,
            "rawBuyboxPrice": current_buybox_price,
            "sellerInfo": seller_info,
            "buyboxStats": buybox_stats
        }
        
        print(f"Yanıt hazırlandı: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"Hata oluştu: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)