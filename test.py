import keepa
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from matplotlib.dates import DateFormatter
import json
from datetime import datetime

def analyze_product(asin, access_key):
    try:
        # Sonuç verilerini tutacak dictionary
        result_data = {
            "timestamp": datetime.now().isoformat(),
            "asin": asin,
            "product_info": {},
            "buy_box_analysis": {
                "current_price": None,
                "seller_stats": []
            },
            "sales_rank_stats": {},
            "buy_box_price_stats": {},
            "fba_sellers": [],
            "sales_rank_history": {
                "dates": [],
                "values": []
            },
            "buy_box_history": {
                "dates": [],
                "values": []
            }
        }
        
        # API bağlantısı
        api = keepa.Keepa(access_key)
        
        # Ürün verilerini çek (offers ve stats parametreleri ile)
        print(f"ASIN {asin} için veriler çekiliyor...")
        products = api.query(asin, offers=100, stats=90, history=True, buybox=True, stock=True)
        product = products[0]
        
        print(f"\nÜrün Başlığı: {product.get('title', 'N/A')}")
        
        # Kategori ve Sales Rank Bilgisi
        category_tree = product.get('categoryTree', [])
        if category_tree:
            root_category = category_tree[0]
            category_id = root_category.get('catId')
            category_name = root_category.get('name')
            
            # Mevcut sales rank'i al
            current_sales_rank = None
            if 'data' in product and 'df_SALES' in product['data']:
                df_sales = product['data']['df_SALES']
                if not df_sales.empty:
                    # En son sales rank değerini al
                    current_sales_rank = df_sales['value'].iloc[-1]
                    if current_sales_rank == -1:  # Geçersiz değer kontrolü
                        current_sales_rank = None
            
            # Kategori detaylarını al
            try:
                category_info = api.category_lookup(category_id)
                if category_info and str(category_id) in category_info:
                    cat_details = category_info[str(category_id)]
                    highest_rank = cat_details.get('highestRank', 0)
                    lowest_rank = cat_details.get('lowestRank', 1)
                    product_count = cat_details.get('productCount', 0)
                    
                    print("\nKategori ve Sales Rank Bilgisi:")
                    print("=" * 50)
                    print(f"Ana Kategori: {category_name}")
                    print(f"Kategorideki Toplam Ürün: {product_count:,}")
                    print(f"Kategori En İyi Rank: {lowest_rank:,}")
                    print(f"Kategori En Kötü Rank: {highest_rank:,}")
                    
                    if current_sales_rank and highest_rank > 0:
                        # Sales rank yüzdesini hesapla (düşük rank daha iyi olduğu için tersini alıyoruz)
                        rank_percentage = ((highest_rank - current_sales_rank) / (highest_rank - lowest_rank)) * 100
                        print(f"\nMevcut Sales Rank: {int(current_sales_rank):,}")
                        print(f"Kategorideki Sales Rank Yüzdesi: %{rank_percentage:.2f}")
                        print(f"Not: Bu ürün kategorisindeki ürünlerin %{rank_percentage:.2f}'inden daha iyi performans gösteriyor.")
                        
                        # JSON'a ekle
                        result_data["product_info"].update({
                            "category": category_tree,
                            "category_name": category_name,
                            "category_id": category_id,
                            "total_products": product_count,
                            "current_sales_rank": int(current_sales_rank),
                            "sales_rank_percentage": rank_percentage,
                            "category_best_rank": lowest_rank,
                            "category_worst_rank": highest_rank
                        })
                    else:
                        print("\nMevcut sales rank bilgisi bulunamadı.")
            except Exception as e:
                print(f"\nKategori detayları alınırken hata oluştu: {str(e)}")
        else:
            print("\nKategori bilgisi bulunamadı.")
        
        # Ürün temel bilgilerini JSON'a ekle
        result_data["product_info"].update({
            "title": product.get('title', 'N/A'),
            "brand": product.get('brand', 'N/A'),
            "url": f"https://www.amazon.com/dp/{asin}"
        })
        
        # 1. Buy Box Analizi
        print("\nBuy Box Analizi:")
        print("=" * 50)
        stats = product.get('stats', {})
        if stats:
            bb_price = stats.get('buyBoxPrice', -1) / 100 if stats.get('buyBoxPrice', -1) != -1 else 'N/A'
            print(f"Güncel Buy Box Fiyatı: ${bb_price}")
            
            # Buy Box fiyatını JSON'a ekle
            result_data["buy_box_analysis"]["current_price"] = bb_price
            
            buybox_stats = stats.get('buyBoxStats', {})
            if buybox_stats:
                print("\nSon 90 Gün Buy Box Kazanma Oranları:")
                for seller_id, stats in buybox_stats.items():
                    seller_name = "Amazon" if seller_id == "ATVPDKIKX0DER" else seller_id
                    print(f"Satıcı: {seller_name}")
                    print(f"Kazanma Oranı: {stats.get('percentageWon', 0):.1f}%")
                    print(f"Ortalama Fiyat: ${stats.get('avgPrice', 0)/100:.2f}")
                    print(f"FBA: {stats.get('isFBA', False)}")
                    print("-" * 30)
                    
                    # Satıcı istatistiklerini JSON'a ekle
                    result_data["buy_box_analysis"]["seller_stats"].append({
                        "seller_id": seller_id,
                        "seller_name": seller_name,
                        "win_rate": stats.get('percentageWon', 0),
                        "avg_price": stats.get('avgPrice', 0)/100,
                        "is_fba": stats.get('isFBA', False)
                    })
        
        # 2. Sales Rank ve Buy Box Fiyat Grafikleri
        print("\nSales Rank ve Buy Box verilerini işleniyor...")
        
        # Sales Rank DataFrame'e çevir
        df_sales = product['data']['df_SALES']
        print(f"Toplam sales rank veri noktası: {len(df_sales)}")
        
        # -1 değerlerini filtrele
        df_sales = df_sales[df_sales['value'] != -1]
        print(f"Geçerli sales rank veri noktası: {len(df_sales)}")
        
        # Buy Box fiyat verilerini DataFrame'e çevir
        df_buybox = product['data']['df_BUY_BOX_SHIPPING']
        df_buybox = df_buybox[df_buybox['value'] != -1]
        
        # Tüm sales rank ve buy box verilerini JSON'a ekle
        result_data["sales_rank_history"]["dates"] = [d.strftime('%Y-%m-%d %H:%M:%S') for d in df_sales.index]
        result_data["sales_rank_history"]["values"] = df_sales['value'].tolist()
        
        result_data["buy_box_history"]["dates"] = [d.strftime('%Y-%m-%d %H:%M:%S') for d in df_buybox.index]
        result_data["buy_box_history"]["values"] = df_buybox['value'].tolist()
        
        if len(df_sales) > 0:
            # Farklı periyotlar için grafikleri çiz
            periods = [180, 90, 30]
            fig, axes = plt.subplots(3, 1, figsize=(15, 20))
            
            # Stil ayarları
            plt.style.use('seaborn-v0_8-whitegrid')
            
            for i, period in enumerate(periods):
                cutoff_date = datetime.now() - timedelta(days=period)
                
                # Sales Rank verilerini filtrele
                period_sales = df_sales[df_sales.index > cutoff_date]
                
                # Buy Box verilerini filtrele
                period_buybox = df_buybox[df_buybox.index > cutoff_date]
                
                if not period_sales.empty:
                    # Sol Y ekseni - Sales Rank
                    ax1 = axes[i]
                    ax1.step(period_sales.index, period_sales['value'], where='post', color='#4CAF50', label='Sales Rank', alpha=0.8)
                    ax1.set_xlabel('Tarih', fontsize=10, labelpad=10)
                    ax1.set_ylabel('Sales Rank', color='#4CAF50', fontsize=10, labelpad=10)
                    ax1.tick_params(axis='y', labelcolor='#4CAF50', labelsize=8)
                    
                    # Grid ayarları
                    ax1.grid(True, which='major', linestyle='-', alpha=0.2)
                    ax1.grid(True, which='minor', linestyle=':', alpha=0.2)
                    ax1.set_axisbelow(True)  # Grid çizgilerini arkaya al
                    
                    # Ortalama sales rank'i göster
                    avg_rank = period_sales['value'].mean()
                    ax1.axhline(y=avg_rank, color='red', linestyle='--', alpha=0.5,
                              label=f'Ort. Rank: {int(avg_rank):,}')
                    
                    # Y ekseni değerlerini düzenle
                    ax1.set_ylim(0, period_sales['value'].max() * 1.1)
                    
                    # Sağ Y ekseni - Buy Box Fiyatı
                    ax2 = ax1.twinx()
                    if not period_buybox.empty:
                        ax2.plot(period_buybox.index, period_buybox['value'], color='#E91E63', 
                               label='Buy Box Fiyatı', linewidth=2)
                        ax2.set_ylabel('Buy Box Fiyatı ($)', color='#E91E63', fontsize=10, labelpad=10)
                        ax2.tick_params(axis='y', labelcolor='#E91E63', labelsize=8)
                        
                        # Sabit fiyat aralığı
                        ax2.set_ylim(0, 25)  # $0-$25 arası
                        
                        # Y ekseni çizgilerini sağa al
                        ax2.spines['right'].set_position(('outward', 10))
                    
                    # Başlık ve lejant
                    axes[i].set_title(f'Son {period} Gün Sales Rank ve Buy Box Fiyatı', 
                                    pad=20, fontsize=12, fontweight='bold')
                    
                    # Lejantları birleştir
                    lines1, labels1 = ax1.get_legend_handles_labels()
                    lines2, labels2 = ax2.get_legend_handles_labels()
                    ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper right',
                             bbox_to_anchor=(1, -0.15), ncol=3, fontsize=9)
                    
                    # Tarih formatını ayarla
                    date_formatter = DateFormatter('%Y-%m-%d')
                    ax1.xaxis.set_major_formatter(date_formatter)
                    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right', fontsize=8)
                    
                    # İstatistikleri yazdır ve JSON'a ekle
                    period_stats = {
                        "sales_rank": {
                            "min": int(period_sales['value'].min()),
                            "max": int(period_sales['value'].max()),
                            "avg": int(period_sales['value'].mean())
                        }
                    }
                    
                    if not period_buybox.empty:
                        period_stats["buy_box"] = {
                            "min": float(period_buybox['value'].min()),
                            "max": float(period_buybox['value'].max()),
                            "avg": float(period_buybox['value'].mean())
                        }
                    
                    result_data["sales_rank_stats"][f"{period}_days"] = period_stats
                    
                    print(f"\nSon {period} gün istatistikleri:")
                    print(f"Minimum Rank: {int(period_sales['value'].min()):,}")
                    print(f"Maksimum Rank: {int(period_sales['value'].max()):,}")
                    print(f"Ortalama Rank: {int(period_sales['value'].mean()):,}")
                    if not period_buybox.empty:
                        print(f"Minimum Fiyat: ${period_buybox['value'].min():.2f}")
                        print(f"Maksimum Fiyat: ${period_buybox['value'].max():.2f}")
                        print(f"Ortalama Fiyat: ${period_buybox['value'].mean():.2f}")
            
            # Alt grafiklerin arasındaki boşluğu ayarla
            plt.subplots_adjust(hspace=0.4)
            
            # Grafiği kaydet
            plt.savefig(f'{asin}_sales_rank_analysis.png', bbox_inches='tight', dpi=300)
            print("\nSales rank ve Buy Box grafikleri kaydedildi:", f'{asin}_sales_rank_analysis.png')
        else:
            print("\nUYARI: Geçerli sales rank verisi bulunamadı!")
        
        # 3. FBA Satıcı Stok Bilgileri
        print("\nFBA Satıcı Stok ve Fiyat Bilgileri:")
        print("=" * 50)
        
        offers = product.get('offers', [])
        live_offers = []
        
        # Aktif satıcıları bul
        for idx in product.get('liveOffersOrder', []):
            if idx < len(offers):
                offer = offers[idx]
                # Sadece FBA satıcıları al
                if offer.get('isPrime', False):
                    # Fiyat bilgisini offerCSV'den al
                    if 'offerCSV' in offer:
                        csv_data = offer['offerCSV']
                        if csv_data and len(csv_data) > 0:
                            # Her 3 değer bir grup oluşturur: [zaman, fiyat, kargo]
                            latest_price_data = csv_data[-3:]
                            if len(latest_price_data) == 3:
                                offer['current_price'] = latest_price_data[1]
                                offer['current_shipping'] = latest_price_data[2]
                    live_offers.append(offer)
        
        # Fiyata göre sırala
        live_offers.sort(key=lambda x: (x.get('current_price', 0) + x.get('current_shipping', 0)) / 100)
        
        print(f"\nAktif FBA Satıcı Sayısı: {len(live_offers)}")
        
        # FBA Satıcı bilgilerini JSON'a ekle
        for offer in live_offers:
            seller_id = offer.get('sellerId', 'Unknown')
            seller_name = "Amazon" if seller_id == "ATVPDKIKX0DER" else seller_id
            
            price = offer.get('current_price', 0)
            shipping = offer.get('current_shipping', 0)
            total_price = (price + shipping) / 100
            
            stock = 'N/A'
            if 'stockCSV' in offer:
                stock_data = offer['stockCSV']
                if stock_data and len(stock_data) > 0:
                    last_stock = stock_data[-1]
                    if last_stock != -1:
                        stock = last_stock
            
            condition_map = {
                0: "New",
                1: "Used - Like New",
                2: "Used - Very Good",
                3: "Used - Good",
                4: "Used - Acceptable",
                5: "Collectible - Like New",
                6: "Collectible - Very Good",
                7: "Collectible - Good",
                8: "Collectible - Acceptable",
                9: "Club",
                10: "Better",
                11: "New OEM",
                12: "Refurbished",
                13: "Open Box",
                14: "Any",
                15: "New - For Parts",
                16: "Used - For Parts",
                17: "New - With Defects",
                18: "Used - With Defects"
            }
            condition = condition_map.get(offer.get('condition', -1), 'Unknown')
            
            # Satıcı bilgilerini JSON'a ekle
            result_data["fba_sellers"].append({
                "seller_id": seller_id,
                "seller_name": seller_name,
                "stock": stock,
                "total_price": total_price,
                "condition": condition
            })
            
            print(f"\nSatıcı: {seller_name}")
            print(f"Stok: {stock}")
            print(f"Toplam Fiyat: ${total_price:.2f}")
            print(f"Condition: {condition}")
            print("-" * 30)
        
        print(f"\nToplam Aktif FBA Satıcı: {len(live_offers)}")
        
        # JSON dosyasını kaydet
        json_filename = f'{asin}_analysis.json'
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, indent=2, ensure_ascii=False)
        print(f"\nAnaliz verileri JSON formatında kaydedildi: {json_filename}")
        
    except Exception as e:
        print(f"Hata oluştu: {str(e)}")
        import traceback
        print("\nHata detayı:")
        print(traceback.format_exc())

# Kullanım
asin = 'B00DUCW9AE'
access_key = '2nc6nr6ui11o4q099eb0cp8eovroo96jo9daer4v3jkcf94ejuqjqpodbkbtkqes'
analyze_product(asin, access_key) 