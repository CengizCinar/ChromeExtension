const asinRegex = /\/dp\/([A-Z0-9]{10})/;

// CSS değişkenlerini tanımla
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  /* Container stilleri */
  #productAssistantContainer {
    width: 100%;
    border: 2px solid #ffd700;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background: white;
    margin-bottom: 15px;
    overflow: hidden;
    max-height: 600px;
    overflow-y: auto;
  }

  .extension-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 15px;
    background: #ffd700;
    color: #2c3e50;
    border-bottom: 1px solid #e0e4e8;
    position: sticky;
    top: 0;
    z-index: 2;
  }

  .extension-content {
    padding: 6px;
  }

  .extension-section {
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 8px;
    margin-bottom: 10px;
  }

  .extension-section-title {
    font-weight: 700;
    font-size: 16px;
    color: #2c3e50;
    margin-bottom: 10px;
    text-align: center;
    padding-bottom: 6px;
    border-bottom: 1px solid #e0e4e8;
  }

  .extension-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    font-size: 12px;
    table-layout: fixed;
  }

  .extension-table th,
  .extension-table td {
    padding: 4px 6px;
    border: 1px solid #e0e4e8;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .extension-table th {
    background: #f4f4f4;
    font-weight: 600;
    color: #34495e;
    text-align: center;
  }
  
  /* Sağa hizalı hücreler */
  .extension-table td.right-align {
    text-align: right;
  }
  
  /* Merkeze hizalı hücreler */
  .extension-table td.center-align {
    text-align: center;
  }
  
  /* FBA/FBM hücreleri için stil */
  .extension-table td.fulfillment-type {
    text-align: center;
    font-weight: bold;
    border-radius: 3px;
    padding: 2px 4px;
  }
  
  /* FBA ve FBM için özel renkler */
  .fba-cell {
    background-color: #e8f5e9 !important;
    color: #2e7d32 !important;
  }
  
  .fbm-cell {
    background-color: #fff9c4 !important;
    color: #f57f17 !important;
  }
  
  /* Sütun genişliklerini ayarla */
  .extension-table.offers-table th:nth-child(1), 
  .extension-table.offers-table td:nth-child(1) {
    width: 20%; /* Seller sütunu */
  }
  
  .extension-table.offers-table th:nth-child(2), 
  .extension-table.offers-table td:nth-child(2) {
    width: 20%; /* Stock sütunu */
  }
  
  .extension-table.offers-table th:nth-child(3), 
  .extension-table.offers-table td:nth-child(3) {
    width: 60%; /* Price sütunu */
  }

  .extension-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid #e0e4e8;
    font-size: 12px;
  }

  .extension-info-row:last-child {
    border-bottom: none;
  }

  .extension-info-label {
    color: #34495e;
    font-weight: 600;
    font-size: 12px;
  }

  .extension-info-value {
    color: #1a6bb0;
    font-size: 12px;
  }

  .extension-input {
    width: 100%;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
  }

  .extension-result {
    background: #e8f5e9;
    padding: 6px;
    border-radius: 4px;
    text-align: center;
    font-size: 12px;
  }

  .extension-result.disabled {
    background: #f8f9fa;
  }
  
  /* Profit Calculator için grid layout */
  .profit-calculator-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .profit-calculator-grid .extension-info-row {
    padding: 4px 0;
  }
  
  /* FBA ve Ref Fee bilgileri için daha kompakt görünüm */
  .fee-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #e0e4e8;
    font-size: 10px;
    color: #666;
  }
`;

document.head.appendChild(styleSheet);

function createPriceContainer() {
  const container = document.createElement('div');
  container.id = 'productAssistantContainer';
  
  // Header oluştur
  const header = document.createElement('div');
  header.className = 'extension-header';
  header.innerHTML = `
    <img src="${chrome.runtime.getURL('icons/icon.svg')}" 
         style="width: 20px; height: 20px; object-fit: contain;">
    <span style="font-weight: 700; font-size: 14px;">Product Assistant</span>
  `;
  
  // Content alanı oluştur
  const content = document.createElement('div');
  content.className = 'extension-content';
  
  container.appendChild(header);
  container.appendChild(content);
  
  return container;
}

function displayPrices(container, data) {
  const content = container.querySelector('.extension-content');
  
  if (!data.success) {
    content.innerHTML = `<div style="color: red; text-align: center;">${data.error}</div>`;
    return;
  }

  const { 
    allEans,
    manufacturer,
    dimensions,
    returnRate,
    shippingCost,
    origin,
    boxCapacity,
    pickAndPackFee,
    referralFeePercentage,
    buyboxPrice,
    buyboxShipping,
    totalBuyboxPrice,
    rawBuyboxPrice,
    sellerInfo,
    buyboxStats
  } = data;

  let defaultSalePrice = '';
  if (rawBuyboxPrice !== null && rawBuyboxPrice !== undefined) {
    defaultSalePrice = rawBuyboxPrice.toFixed(2);
  } else if (buyboxPrice && buyboxPrice !== 'No buybox price available') {
    defaultSalePrice = buyboxPrice.replace(' €', '');
  }

  const getReturnRateText = (rate) => {
    if (rate === null) return 'Uncertain';
    if (rate === 1) return 'Low';
    if (rate === 2) return 'High';
    return 'Uncertain';
  };

  // Details section
  let detailsHtml = `
    <div class="extension-section">
      <div class="extension-section-title">DETAILS</div>
      <div class="extension-info-content">
  `;

  if (dimensions && dimensions.height && dimensions.length && dimensions.width) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Dimensions</span>
        <span class="extension-info-value">${dimensions.height}x${dimensions.length}x${dimensions.width} cm</span>
      </div>
    `;
  }

  if (dimensions && dimensions.weight) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Weight</span>
        <span class="extension-info-value">${dimensions.weight} g</span>
      </div>
    `;
  }

  if (boxCapacity) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Box Capacity</span>
        <span class="extension-info-value">${boxCapacity.capacity} pcs - ${boxCapacity.unitCost.toFixed(2)}€</span>
      </div>
    `;
  }

  if (allEans && allEans.length > 0) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">EAN</span>
        <span class="extension-info-value">${allEans[0]}</span>
      </div>
    `;
  }

  if (manufacturer) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Manufacturer</span>
        <span class="extension-info-value">${manufacturer}</span>
      </div>
    `;
  }

  if (origin) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Origin</span>
        <span class="extension-info-value">${origin}</span>
      </div>
    `;
  }

  detailsHtml += `
    <div class="extension-info-row">
      <span class="extension-info-label">Return Rate</span>
      <span class="extension-info-value">${getReturnRateText(returnRate)}</span>
    </div>
  `;

  if (shippingCost) {
    detailsHtml += `
      <div class="extension-info-row">
        <span class="extension-info-label">Shipping Cost</span>
        <span class="extension-info-value">${shippingCost}</span>
      </div>
    `;
  }

  detailsHtml += `</div></div>`;

  // Profit Calculator section
  const calculatorHtml = `
    <div class="extension-section">
      <div class="extension-section-title">PROFIT CALCULATOR</div>
      <div class="profit-calculator-grid">
        <div>
          <label class="extension-info-label">Cost Price</label>
          <input 
            type="number" 
            id="costPrice" 
            step="0.01" 
            class="extension-input"
            ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}
          >
        </div>
        <div>
          <label class="extension-info-label">Sale Price</label>
          <input 
            type="number" 
            id="salePrice" 
            step="0.01" 
            value="${defaultSalePrice}"
            class="extension-input"
            ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}
          >
        </div>
        <div class="extension-result ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}">
          <div class="extension-info-label">Profit</div>
          <div id="profitResult">${!pickAndPackFee || referralFeePercentage === null ? 'No Data' : '€ 0.00'}</div>
        </div>
        <div class="extension-result ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}">
          <div class="extension-info-label">ROI</div>
          <div id="roiResult">${!pickAndPackFee || referralFeePercentage === null ? 'No Data' : '0.00%'}</div>
        </div>
      </div>
      <div class="fee-info">
        <span>FBA Fee: € ${(pickAndPackFee / 100).toFixed(2)}</span>
        <span style="color: #ccc">•</span>
        <span>Ref. Fee: ${referralFeePercentage ? referralFeePercentage.toFixed(2) : '0.00'}%</span>
      </div>
    </div>
  `;

  // Seller Info section
  let sellerInfoHtml = `
    <div class="extension-section">
      <div class="extension-section-title">OFFERS</div>
      <div style="overflow-x: hidden;">
        <table class="extension-table offers-table">
          <tr>
            <th>Seller</th>
            <th>Stock</th>
            <th>Price</th>
          </tr>
  `;

  if (sellerInfo && sellerInfo.length > 0) {
    sellerInfoHtml += sellerInfo.map(seller => {
      // Fiyatı düzenle (€ işaretini kaldır ve $ ekle)
      const priceValue = seller.totalPrice.replace(' €', '').trim();
      const cellClass = seller.fulfillmentType === 'FBA' ? 'fba-cell' : 'fbm-cell';
      
      return `
      <tr>
        <td class="fulfillment-type ${cellClass}">
          ${seller.fulfillmentType}
        </td>
        <td class="center-align">${seller.stock === 'N/A' ? 'N/A' : seller.stock.toLocaleString()}</td>
        <td class="right-align">$${priceValue}</td>
      </tr>
    `}).join('');
  } else {
    sellerInfoHtml += `<tr><td colspan="3" style="text-align: center;">No seller information available</td></tr>`;
  }

  let fbaSellerCount = 0;
  let totalFbaStock = 0;

  if (sellerInfo && sellerInfo.length > 0) {
    const fbaSellers = sellerInfo.filter(seller => seller.fulfillmentType === 'FBA');
    fbaSellerCount = fbaSellers.length;
    totalFbaStock = fbaSellers.reduce((sum, seller) => {
      if (seller.stock !== 'N/A') {
        return sum + seller.stock;
      } else {
        return sum;
      }
    }, 0);
  }

  sellerInfoHtml += `
        </table>
      </div>
      <div style="margin-top: 8px; font-size: 11px; color: #34495e; display: flex; justify-content: space-between;">
        <span>FBA Seller: ${fbaSellerCount}</span>
        <span>FBA Stock: ${totalFbaStock.toLocaleString()}</span>
      </div>
    </div>
  `;

  // Buybox Stats section
  let buyboxStatsHtml = `
    <div class="extension-section">
      <div class="extension-section-title">BUYBOX STATISTICS</div>
      <div style="overflow-x: hidden;">
        <table class="extension-table">
          <tr>
            <th>Won%</th>
            <th>Seller</th>
            <th>Type</th>
          </tr>
  `;

  if (buyboxStats && buyboxStats.length > 0) {
    buyboxStatsHtml += buyboxStats.map(stat => {
      const cellClass = stat.fulfillmentType === 'FBA' ? 'fba-cell' : 'fbm-cell';
      
      return `
      <tr>
        <td class="center-align">${stat.wonRate}</td>
        <td>
          <a href="${stat.amazonUrl}" target="_blank" style="color: #1a6bb0; text-decoration: underline;">
            ${stat.sellerId}
          </a>
        </td>
        <td class="fulfillment-type ${cellClass}">
          ${stat.fulfillmentType}
        </td>
      </tr>
    `}).join('');
  } else {
    buyboxStatsHtml += `<tr><td colspan="3" style="text-align: center;">No buybox statistics available</td></tr>`;
  }

  buyboxStatsHtml += `
        </table>
      </div>
    </div>
  `;

  // Tüm içeriği birleştir
  content.innerHTML = detailsHtml + calculatorHtml + sellerInfoHtml + buyboxStatsHtml;

  if (pickAndPackFee !== null && referralFeePercentage !== null) {
    const costInput = container.querySelector('#costPrice');
    const saleInput = container.querySelector('#salePrice');
    const profitResult = container.querySelector('#profitResult');
    const roiResult = container.querySelector('#roiResult');

    const calculateProfit = () => {
      const costPrice = parseFloat(costInput.value) || 0;
      const salePrice = parseFloat(saleInput.value) || 0;
      const fbaFeeInEuro = pickAndPackFee / 100;
      const referralFee = salePrice * (referralFeePercentage / 100);
      const totalCost = costPrice + fbaFeeInEuro + referralFee;
      const profit = salePrice - totalCost;
      const roi = costPrice > 0 ? (profit / costPrice) * 100 : 0;

      profitResult.textContent = `€ ${profit.toFixed(2)}`;
      profitResult.style.color = profit >= 0 ? '#2e7d32' : '#c62828';
      
      roiResult.textContent = `${roi.toFixed(2)}%`;
      roiResult.style.color = roi >= 0 ? '#2e7d32' : '#c62828';
    };

    costInput.addEventListener('input', calculateProfit);
    saleInput.addEventListener('input', calculateProfit);
    
    calculateProfit();
  }
}

async function init() {
  const match = window.location.pathname.match(asinRegex);
  
  if (match && match[1]) {
    const asin = match[1];
    
    // Container oluştur
    const container = createPriceContainer();
    
    // Amazon'un sağ sütununu bul
    const rightCol = document.getElementById('rightCol');
    
    if (rightCol) {
      // Container'ı sağ sütunun en üstüne ekle
      rightCol.insertBefore(container, rightCol.firstChild);
    } else {
      // Alternatif olarak diğer elementleri dene
      const offerDisplayGroup = document.getElementById('offerDisplayGroup') || 
                              document.getElementById('buyBox') ||
                              document.querySelector('.a-box-group');
      
      if (offerDisplayGroup) {
        offerDisplayGroup.parentNode.insertBefore(container, offerDisplayGroup);
      }
    }

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { 
            action: 'fetchPrices', 
            asin: asin 
          },
          response => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      displayPrices(container, response);
    } catch (error) {
      container.querySelector('.extension-content').innerHTML = '<div style="text-align: center;">⚠️</div>';
    }
  }
}

init();
