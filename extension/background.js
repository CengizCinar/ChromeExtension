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
  
  // Yeni fetchProductData fonksiyonu backend API’ye istek yapar
  async function fetchProductData(asin) {
    try {
      const response = await fetch("http://localhost:8000/product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ asin })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching product data:", error);
      return { success: false, error: "Error fetching product data" };
    }
  }
  
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
          if (!data || data === "Not found") {
            console.warn("Product not found");
            sendResponse({ success: false, error: "Product details not found" });
          } else {
            console.log("Sending successful response");
            sendResponse(data);
          }
        } catch (error) {
          console.error("Error processing request:", error);
          sendResponse({ success: false, error: "An error occurred" });
        }
      };
      processRequest();
      return true;
    }
  });
  
  chrome.storage.onChanged.addListener((changes, namespace) => {
    console.group("Storage Changes");
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(`Storage key "${key}" in "${namespace}" changed:`, `Old:`, oldValue, `New:`, newValue);
    }
    console.groupEnd();
  });
  