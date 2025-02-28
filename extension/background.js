import { getCachedOrFetch } from './cacheService.js';

// utility functions (örn. doubleEncode, reverseString vs.) korunabilir; tasarım değişmedi.
const utilityFunctions = {
    doubleEncode: (string) => btoa(btoa(string)),
    doubleBase64Decode: (string) => atob(atob(string)),
    reverseString: (string) => string.split('').reverse().join(''),
    convertToBase36: (number) => parseInt(number).toString(36),
    getRandomNumber: (max) => Math.floor(Math.random() * max),
    getCurrentTimestamp: () => Date.now()
  };
  
  // Box dimensions & hesaplama fonksiyonu (tasarım korunuyor)
  const BOX_DIMENSIONS = {
    height: 55,
    length: 55,
    width: 45
  };
  const BOX_VOLUME = BOX_DIMENSIONS.height * BOX_DIMENSIONS.length * BOX_DIMENSIONS.width; // 136125 cm³
  const BOX_MAX_WEIGHT = 23000;
  const BOX_COST = 165;
  
  function calculateBoxCapacity(dimensions, weight) {
    if (!dimensions || !dimensions.height || !dimensions.length || !dimensions.width || !weight) {
      return null;
    }
    const productVolume = dimensions.height * dimensions.length * dimensions.width;
    const volumeBasedCapacity = Math.floor(BOX_VOLUME / productVolume);
    const weightBasedCapacity = Math.floor(BOX_MAX_WEIGHT / weight);
    const actualCapacity = Math.min(volumeBasedCapacity, weightBasedCapacity);
    const unitCost = BOX_COST / actualCapacity;
    return {
      capacity: actualCapacity,
      unitCost: unitCost
    };
  }
  
  // fetchProductData fonksiyonu - 12 saatlik cache kullanıyor
  async function fetchProductData(asin) {
    console.group(`Product Data Request: ${asin}`);
    console.log(`Processing request for ASIN: ${asin}`);
    
    try {
      // getCachedOrFetch fonksiyonu ile veriyi al (12 saatlik önbellek)
      const data = await getCachedOrFetch(`product_${asin}`, async () => {
        console.log(`Cache miss for ASIN: ${asin} - Fetching from API...`);
        const response = await fetch("http://localhost:8000/product", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ asin })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.detail || "API request failed");
        }

        const responseData = await response.json();
        console.log("Fresh API Response:", responseData);
        return responseData;
      });
      
      console.log(`Request for ASIN: ${asin} completed successfully`);
      console.groupEnd();
      return data;
    } catch (error) {
      console.error(`Error processing ASIN: ${asin}`, error);
      console.groupEnd();
      throw error;
    }
  }
  
  // Message listener - hata yönetimi iyileştirildi
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.group("Message Received");
    console.log("Message:", message);
    console.log("Sender:", sender);
    console.groupEnd();
  
    if (message.action === "fetchPrices") {
      console.group("Fetch Prices Request");
      console.log("ASIN:", message.asin);
      
      const processRequest = async () => {
        try {
          const data = await fetchProductData(message.asin);
          if (!data || data.success === false) {
            console.warn("Product not found or error in response");
            sendResponse({ success: false, error: data.error || "Product details not found" });
          } else {
            console.log("Sending successful response");
            sendResponse(data);
          }
        } catch (error) {
          console.error("Error processing request:", error);
          sendResponse({ 
            success: false, 
            error: error.message || "An error occurred while fetching product data" 
          });
        }
      };

      processRequest();
      return true; // Async response için gerekli
    }
  });
  
  // Storage değişikliklerini izle - Debug için
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.group("Storage Changes");
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      // Sadece önbellek ile ilgili değişiklikleri göster
      if (key.startsWith('product_')) {
        const asin = key.replace('product_', '');
        console.log(`Cache for ASIN ${asin} updated:`);
        
        if (newValue) {
          const expiryDate = new Date(newValue.expiresAt);
          console.log(`- New cache expires at: ${expiryDate.toLocaleString()}`);
        } else {
          console.log(`- Cache entry removed`);
        }
      } else {
        console.log(`Storage key "${key}" in "${namespace}" changed.`);
      }
    }
    console.groupEnd();
  });