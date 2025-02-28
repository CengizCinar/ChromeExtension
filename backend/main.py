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
        print(f"ASIN için istek alındı: {product_req.asin}")
        
        # Sadece aktif satıcıları almak için offers=20 ve stats=90 için istatistikler
        # İkinci scriptten alınan parametreler: stats ve history
        products = api.query(product_req.asin, history=True, buybox=True, offers=100, stats=90, stock=True)
        
        if not products:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
            
        product = products[0]
        print(f"Ürün bulundu: {product.get('title', 'Başlık yok')}")
        
        # Debug: Tüm product verilerini kontrol edelim
        print("Product data keys:", product.keys())
        if "data" in product:
            print("Data keys:", product["data"].keys())

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

        # Buybox fiyatı ve kargo - yeni format
        current_buybox_price = None
        current_buybox_shipping = 0
        
        # Debug: Buybox verilerini kontrol edelim
        if "data" in product:
            print("Mevcut data içeriği:", product["data"])
            
            # Önce stats'tan deneyelim
            stats = product.get('stats', {})
            if stats:
                bb_price = stats.get('buyBoxPrice', -1)
                if bb_price != -1:
                    current_buybox_price = bb_price / 100
                    print(f"Stats'tan alınan buybox fiyatı: {current_buybox_price}")

            # Eğer stats'tan alamazsak csv'den deneyelim
            if current_buybox_price is None and "csv" in product:
                csv_data = product["csv"]
                if csv_data and len(csv_data) > 18:
                    buybox_data = csv_data[18]
                    if isinstance(buybox_data, list) and len(buybox_data) >= 3:
                        price = buybox_data[-2]  # Son fiyat
                        shipping = buybox_data[-1]  # Son kargo
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

        # ----- YENİ EKLENEN KISIM - FBA/FBM SATICI BILGILERI -----
        # İkinci scriptten alınan satıcı bilgisi toplama mantığı
        
        # 1. FBA/FBM Durumu | Seller Adı | Stock
        seller_info = []
        offers = product.get('offers', [])
        live_offers = []
        
        # Aktif satıcıları bul - ikinci scriptten alınan live_offers mantığı
        live_offers_order = product.get('liveOffersOrder', [])
        
        # Tüm satıcıları işle
        for idx in range(len(offers)):
            offer = offers[idx]
            
            # Satıcı aktif mi kontrol et
            is_active = idx in live_offers_order or offer.get('lastSeen', 0) > 0
            
            if is_active:
                seller_id = offer.get('sellerId', 'Unknown')
                seller_name = "Amazon" if seller_id == "ATVPDKIKX0DER" else offer.get('sellerName', seller_id)
                
                # FBA/FBM durumunu belirle
                fulfillment_type = 'FBA' if offer.get('isPrime', False) else 'FBM'
                
                # Stok bilgisini al
                stock = 'N/A'
                if 'stockCSV' in offer and offer['stockCSV']:
                    stock_data = offer['stockCSV']
                    if stock_data and len(stock_data) > 0:
                        last_stock = stock_data[-1]
                        if last_stock != -1:
                            stock = last_stock
                
                # Satıcı bilgilerini ekle
                seller_info.append({
                    'fulfillmentType': fulfillment_type,
                    'sellerName': seller_name,
                    'sellerId': seller_id,
                    'stock': stock,
                    'lastSeen': offer.get('lastSeen', 0)
                })
        
        # Son görülme tarihine göre sırala
        seller_info.sort(key=lambda x: x['lastSeen'], reverse=True)
        # En fazla 10 satıcı göster
        seller_info = seller_info[:10]
        # lastSeen alanını kaldır
        for seller in seller_info:
            del seller['lastSeen']
            
        # ----- YENİ EKLENEN KISIM - BUYBOX WONRATE BILGILERI -----
        # İkinci scriptten alınan buybox kazanma oranı hesaplama
        
        # 2. 90 günlük Buybox WonRate | Seller Adı | Seller ID
        buybox_stats = []
        stats = product.get('stats', {})
        
        # BuyBox istatistiklerini al
        if stats and 'buyBoxStats' in stats:
            buybox_stats_data = stats.get('buyBoxStats', {})
            
            for seller_id, seller_stats in buybox_stats_data.items():
                seller_name = "Amazon" if seller_id == "ATVPDKIKX0DER" else next(
                    (seller['sellerName'] for seller in seller_info if seller['sellerId'] == seller_id), 
                    seller_id
                )
                
                buybox_won_rate = seller_stats.get('percentageWon', 0)
                
                # BuyBox istatistiklerini ekle
                buybox_stats.append({
                    'sellerId': seller_id,
                    'sellerName': seller_name,
                    'wonRate': buybox_won_rate
                })
            
            # BuyBox kazanma oranına göre sırala
            buybox_stats.sort(key=lambda x: x['wonRate'], reverse=True)
        
        # Alternatif yöntem - Eğer stats verileri yoksa
        if not buybox_stats and 'buyBoxSellerIdHistory' in product:
            buybox_history = product['buyBoxSellerIdHistory']
            if buybox_history:
                # Son 90 günlük veriyi al
                last_90_days = buybox_history[-90:] if len(buybox_history) > 90 else buybox_history
                
                # Satıcı bazında kazanma sayılarını hesapla
                seller_wins = {}
                total_records = len(last_90_days)
                
                for seller_id in last_90_days:
                    if seller_id != -1:  # -1, veri olmayan durumu gösterir
                        seller_wins[seller_id] = seller_wins.get(seller_id, 0) + 1
                
                # Kazanma oranlarını hesapla
                for seller_id, wins in seller_wins.items():
                    seller_name = "Amazon" if seller_id == "ATVPDKIKX0DER" else next(
                        (seller['sellerName'] for seller in seller_info if seller['sellerId'] == seller_id), 
                        seller_id
                    )
                    
                    buybox_stats.append({
                        'sellerId': seller_id,
                        'sellerName': seller_name,
                        'wonRate': (wins / total_records) * 100
                    })
                
                # BuyBox kazanma oranına göre sırala
                buybox_stats.sort(key=lambda x: x['wonRate'], reverse=True)

        # Response'a yeni verileri ekle
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
            "sellerInfo": seller_info,         # FBA/FBM Durumu | Seller Adı | Stock
            "buyboxStats": buybox_stats        # 90 günlük Buybox WonRate | Seller Adı | Seller ID
        }
        
        print(f"Yanıt hazırlandı: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"Hata oluştu: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)