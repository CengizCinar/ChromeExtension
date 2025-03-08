const asinRegex = /\/dp\/([A-Z0-9]{10})/;

function createPriceContainer() {
  const container = document.createElement('div');
  container.style.padding = '8px 15px';
  container.style.margin = '10px 0';
  container.style.border = '3px solid #ffd700';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  container.style.fontSize = '16px';
  container.style.lineHeight = '1.4';
  container.style.background = '#fff';
  return container;
}

function displayPrices(container, data) {
  console.log('Full response data:', data);
  
  if (!data.success) {
    container.innerHTML = `<div style="color: red; text-align: center;">${data.error}</div>`;
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
    rawBuyboxPrice
  } = data;

  let defaultSalePrice = '';
  if (rawBuyboxPrice !== null && rawBuyboxPrice !== undefined) {
    defaultSalePrice = rawBuyboxPrice.toFixed(2);
  } else if (buyboxPrice && buyboxPrice !== 'No buybox price available') {
    defaultSalePrice = buyboxPrice.replace(' €', '');
  }

  console.log('Default sale price:', defaultSalePrice);
  console.log('Parsed data:', {
    allEans,
    manufacturer,
    dimensions,
    returnRate,
    shippingCost,
    origin,
    boxCapacity,
    pickAndPackFee,
    referralFeePercentage,
    buyboxPrice
  });

  const getReturnRateText = (rate) => {
    if (rate === null) return 'Uncertain';
    if (rate === 1) return 'Low';
    if (rate === 2) return 'High';
    return 'Uncertain';
  };

  container.innerHTML = `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 10px;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e0e4e8;
      ">
        <img src="${chrome.runtime.getURL('icons/icon.svg')}" 
             style="width: 40px; height: 40px; object-fit: contain;"
             onerror="this.style.display='none'"
        >
        <span style="font-weight: 700; font-size: 22px; color: #2c3e50;">DETAILS</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${dimensions && dimensions.height && dimensions.length && dimensions.width ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Dimensions</span>
          <span style="color: #1a6bb0; font-size: 14px;">${dimensions.height}x${dimensions.length}x${dimensions.width} cm</span>
        </div>
        ` : ''}

        ${dimensions && dimensions.weight ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Weight</span>
          <span style="color: #1a6bb0; font-size: 14px;">${dimensions.weight} g</span>
        </div>
        ` : ''}

        ${boxCapacity ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Box Capacity</span>
          <span style="color: #1a6bb0; font-size: 14px;">${boxCapacity.capacity} pcs - ${boxCapacity.unitCost.toFixed(2)}€</span>
        </div>
        ` : ''}

        ${allEans && allEans.length > 0 ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">EAN</span>
          <span style="color: #1a6bb0; font-size: 14px;">${allEans[0]}</span>
        </div>
        ` : ''}

        ${manufacturer ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Manufacturer</span>
          <span style="color: #1a6bb0; font-size: 14px;">${manufacturer}</span>
        </div>
        ` : ''}

        ${origin ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Origin</span>
          <span style="color: #1a6bb0; font-size: 14px;">${origin}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Return Rate</span>
          <span style="color: #1a6bb0; font-size: 14px;">${getReturnRateText(returnRate)}</span>
        </div>

        ${shippingCost ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #34495e; font-weight: 600; font-size: 14px;">Shipping Cost</span>
          <span style="color: #1a6bb0; font-size: 14px;">${shippingCost}</span>
        </div>
        ` : ''}

        <div style="
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e0e4e8;
        ">
          <div style="font-weight: 700; font-size: 18px; color: #2c3e50; margin-bottom: 12px; text-align: center;">
            PROFIT CALCULATOR
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div>
              <label style="display: block; color: #34495e; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                Cost Price
              </label>
              <input 
                type="number" 
                id="costPrice" 
                step="0.01" 
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  font-size: 14px;
                  box-sizing: border-box;
                "
                ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}
              >
            </div>
            <div>
              <label style="display: block; color: #34495e; font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                Sale Price
              </label>
              <input 
                type="number" 
                id="salePrice" 
                step="0.01" 
                value="${defaultSalePrice}"
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  font-size: 14px;
                  box-sizing: border-box;
                "
                ${!pickAndPackFee || referralFeePercentage === null ? 'disabled' : ''}
              >
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="
              background: ${!pickAndPackFee || referralFeePercentage === null ? '#f8f9fa' : '#e8f5e9'};
              padding: 8px;
              border-radius: 4px;
              text-align: center;
            ">
              <div style="color: #34495e; font-weight: 600; font-size: 14px;">Profit</div>
              <div id="profitResult" style="color: #2e7d32; font-size: 16px; font-weight: bold;">
                ${!pickAndPackFee || referralFeePercentage === null ? 'No Data' : '€ 0.00'}
              </div>
            </div>
            <div style="
              background: ${!pickAndPackFee || referralFeePercentage === null ? '#f8f9fa' : '#e8f5e9'};
              padding: 8px;
              border-radius: 4px;
              text-align: center;
            ">
              <div style="color: #34495e; font-weight: 600; font-size: 14px;">ROI</div>
              <div id="roiResult" style="color: #2e7d32; font-size: 16px; font-weight: bold;">
                ${!pickAndPackFee || referralFeePercentage === null ? 'No Data' : '0.00%'}
              </div>
            </div>
          </div>

          <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px dashed #e0e4e8;
            font-size: 10px;
            color: #666;
          ">
            <span>FBA Fee: € ${(pickAndPackFee / 100).toFixed(2)}</span>
            <span style="color: #ccc">•</span>
            <span>Ref. Fee: ${referralFeePercentage.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  `;

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

  // Yeni tablolar için stil
  const tableStyle = `
    width: 100%;
    margin-top: 15px;
    border-collapse: collapse;
    background: white;
    font-size: 14px;
  `;

  const cellStyle = `
    padding: 8px;
    border: 1px solid #e0e4e8;
    text-align: left;
  `;

  const headerStyle = `
    background: #f4f4f4;
    font-weight: 600;
    color: #34495e;
  `;

  let fbaSellerCount = 0;
  let totalFbaStock = 0;

  if (data.sellerInfo && data.sellerInfo.length > 0) {
    // Sort by totalPriceFloat to ensure price ordering is correct
    if (data.sellerInfo[0].totalPriceFloat !== undefined) {
      data.sellerInfo.sort((a, b) => a.totalPriceFloat - b.totalPriceFloat);
    }
    
    const fbaSellers = data.sellerInfo.filter(seller => seller.fulfillmentType === 'FBA');
    fbaSellerCount = fbaSellers.length;
    totalFbaStock = fbaSellers.reduce((sum, seller) => {
      if (seller.stock !== 'N/A') {
        return sum + seller.stock;
      } else {
        return sum;
      }
    }, 0);
  }

  // Seller Info Table
  const sellerInfoDiv = document.createElement('div');
  sellerInfoDiv.innerHTML = `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e0e4e8;
    ">
      <div style="font-weight: 700; font-size: 18px; color: #2c3e50; margin-bottom: 12px; text-align: center;">
        SELLER INFORMATION (SORTED BY PRICE)
      </div>
      <div style="overflow-x: auto;">
        <table style="${tableStyle}">
          <tr>
            <th style="${cellStyle} ${headerStyle}">FBA/FBM</th>
            <th style="${cellStyle} ${headerStyle}">Seller ID</th>
            <th style="${cellStyle} ${headerStyle}">Total Price</th>
            <th style="${cellStyle} ${headerStyle}">Stock</th>
          </tr>
          ${data.sellerInfo && data.sellerInfo.length > 0 ? 
            data.sellerInfo.map(seller => `
              <tr>
                <td style="${cellStyle}; background-color: ${seller.colorStyle.backgroundColor}; color: ${seller.colorStyle.color}; font-weight: bold;">${seller.fulfillmentType}</td>
                <td style="${cellStyle}"><a href="${seller.amazonUrl}" target="_blank" style="color: #1a6bb0; text-decoration: underline;">${seller.sellerId}</a></td>
                <td style="${cellStyle}">${seller.totalPrice}</td>
                <td style="${cellStyle}">${seller.stock === 'N/A' ? 'N/A' : seller.stock.toLocaleString()}</td>
              </tr>
            `).join('') : 
            `<tr><td colspan="4" style="${cellStyle} text-align: center;">No seller information available</td></tr>`
          }
        </table>
      </div>
      <div style="margin-top: 10px; font-size: 14px; color: #34495e; display: flex; justify-content: space-between;">
        <span>FBA Seller: ${fbaSellerCount}</span>
        <span>FBA Stock: ${totalFbaStock.toLocaleString()}</span>
      </div>
    </div>
  `;

  // Buybox Stats Table
  const buyboxStatsDiv = document.createElement('div');
  buyboxStatsDiv.innerHTML = `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 0 10px;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #e0e4e8;
    ">
      <div style="font-weight: 700; font-size: 18px; color: #2c3e50; margin-bottom: 12px; text-align: center;">
        BUYBOX STATISTICS
      </div>
      <div style="overflow-x: auto;">
        <table style="${tableStyle}">
          <tr>
            <th style="${cellStyle} ${headerStyle}">90Day Won%</th>
            <th style="${cellStyle} ${headerStyle}">Seller ID</th>
            <th style="${cellStyle} ${headerStyle}">FBA/FBM</th>
          </tr>
          ${data.buyboxStats && data.buyboxStats.length > 0 ? 
            data.buyboxStats.map(stat => `
              <tr>
                <td style="${cellStyle}">${stat.wonRate}</td>
                <td style="${cellStyle}"><a href="${stat.amazonUrl}" target="_blank" style="color: #1a6bb0; text-decoration: underline;">${stat.sellerId}</a></td>
                <td style="${cellStyle}; background-color: ${stat.colorStyle.backgroundColor}; color: ${stat.colorStyle.color}; font-weight: bold;">${stat.fulfillmentType}</td>
              </tr>
            `).join('') : 
            `<tr><td colspan="3" style="${cellStyle} text-align: center;">No buybox statistics available</td></tr>`
          }
        </table>
      </div>
    </div>
  `;

  // Container'a scroll özelliği ekle
  container.style.maxHeight = '600px';  // veya istediğiniz yükseklik
  container.style.overflowY = 'auto';
  
  // Yeni tabloları mevcut içeriğin sonuna ekle
  container.innerHTML = container.innerHTML + sellerInfoDiv.innerHTML + buyboxStatsDiv.innerHTML;
}

async function init() {
  const match = window.location.pathname.match(asinRegex);
  
  if (match && match[1]) {
    const asin = match[1];
    
    const priceContainer = createPriceContainer();
    priceContainer.innerHTML = '<div style="text-align: center;">⚡</div>';
    
    const rightCol = document.querySelector('#rightCol');
    
    if (rightCol) {
      rightCol.insertBefore(priceContainer, rightCol.firstChild);
    } else {
      const offerDisplayGroup = document.getElementById('offerDisplayGroup') || 
                              document.getElementById('buyBox') ||
                              document.querySelector('.a-box-group');
      
      if (offerDisplayGroup) {
        offerDisplayGroup.parentNode.insertBefore(priceContainer, offerDisplayGroup);
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

      displayPrices(priceContainer, response);
    } catch (error) {
      priceContainer.innerHTML = '<div style="text-align: center;">⚠️</div>';
    }
  }
}

init();

function updatePopup(data) {
  const popup = document.getElementById('asinPopup');
  if (!popup) return;

  if (data.manufacturer) {
    const manufacturerInfo = `${data.manufacturer}${data.origin ? ` (${data.origin})` : ''}`;
    addRow(popup, 'Manufacturer', manufacturerInfo);
  }
}
