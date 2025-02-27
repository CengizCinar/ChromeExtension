from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import keepa  # Keepa Python wrapper (git üzerinden yüklenebilir)
import os

app = FastAPI()

# API anahtarınızı ortam değişkeninden okuyun veya buraya sabit değer atayın.
KEEPA_API_KEY = os.getenv("KEEPA_API_KEY", "Y2nc6nr6ui11o4q099eb0cp8eovroo96jo9daer4v3jkcf94ejuqjqpodbkbtkqes")
api = keepa.Keepa(KEEPA_API_KEY)

class ProductRequest(BaseModel):
    asin: str

@app.post("/product")
async def get_product(product_req: ProductRequest):
    try:
        # Keepa wrapper aracılığıyla ürün verilerini çekiyoruz
        product_data = api.product(product_req.asin)
        if not product_data or not product_data.get("products"):
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        product = product_data["products"][0]

        # Dimensions (mm -> cm dönüşümü)
        dimensions = {
            "height": round(product.get("packageHeight", 0) / 10) if product.get("packageHeight") else None,
            "length": round(product.get("packageLength", 0) / 10) if product.get("packageLength") else None,
            "width": round(product.get("packageWidth", 0) / 10) if product.get("packageWidth") else None,
            "weight": product.get("packageWeight", None)
        }

        # Box capacity hesaplaması
        BOX_DIMENSIONS = {"height": 55, "length": 55, "width": 45}
        BOX_VOLUME = BOX_DIMENSIONS["height"] * BOX_DIMENSIONS["length"] * BOX_DIMENSIONS["width"]  # 136125 cm³
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

        # Buybox fiyatı ve kargo: CSV verisinden ayrıştırma
        current_buybox_price = None
        current_buybox_shipping = 0
        if "csv" in product and len(product["csv"]) > 18 and isinstance(product["csv"][18], list):
            buybox_data = product["csv"][18]
            for i in range(len(buybox_data) - 3, -1, -3):
                price = buybox_data[i+1]
                shipping = buybox_data[i+2]
                if price != -1:
                    current_buybox_price = price / 100
                    current_buybox_shipping = shipping / 100 if shipping != -1 else 0
                    break

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

        # Manufacturer ve origin (origin için deepseek entegrasyonu eklenmedi; isterseniz burada ekleyebilirsiniz)
        manufacturer = product.get("manufacturer", None)
        origin = None

        # Shipping cost hesaplama (örnek: ağırlığa göre)
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

        response_data = {
            "success": True,
            "allEans": all_eans,
            "manufacturer": manufacturer,
            "dimensions": dimensions,
            "returnRate": return_rate,
            "shippingCost": shipping_cost,
            "origin": origin,
            "boxCapacity": box_capacity,
            "pickAndPackFee": pick_and_pack_fee,
            "referralFeePercentage": referral_fee_percentage,
            "buyboxPrice": buybox_price,
            "buyboxShipping": buybox_shipping,
            "totalBuyboxPrice": total_buybox_price,
            "rawBuyboxPrice": current_buybox_price
        }
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
