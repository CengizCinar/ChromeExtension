// cacheService.js - Chrome Extension için 12 saatlik önbellek (cache) sistemi

// Önbellek süresi (12 saat - milisaniye cinsinden)
const CACHE_DURATION = 12 * 60 * 60 * 1000;

/**
 * Verilen anahtarla önbellekte veri arar, eğer yoksa veya süresi dolmuşsa
 * fetchFunction ile yeni veri alır ve önbelleğe kaydeder.
 * 
 * @param {string} key - Önbellek anahtarı
 * @param {Function} fetchFunction - Veri bulunamazsa çağrılacak async fonksiyon
 * @returns {Promise<any>} - Önbellekten veya fetchFunction'dan elde edilen veri
 */
export async function getCachedOrFetch(key, fetchFunction) {
  console.group('Cache Check');
  console.log(`Checking cache for key: ${key}`);
  
  try {
    // Chrome storage'dan veriyi al
    const result = await chrome.storage.local.get(key);
    const cacheEntry = result[key];
    
    // Eğer önbellekte veri varsa ve süresi dolmamışsa
    if (cacheEntry && cacheEntry.expiresAt > Date.now()) {
      console.log(`Cache hit for ${key}! Data expires at: ${new Date(cacheEntry.expiresAt).toLocaleString()}`);
      console.log(`Remaining cache time: ${Math.round((cacheEntry.expiresAt - Date.now()) / (60 * 1000))} minutes`);
      console.groupEnd();
      return cacheEntry.data;
    }
    
    // Veri yoksa veya süresi dolmuşsa fetchFunction ile yeni veri al
    console.log(`Cache miss for ${key}. Fetching fresh data...`);
    const freshData = await fetchFunction();
    
    // Yeni veriyi önbelleğe kaydet
    const now = Date.now();
    const newCacheEntry = {
      data: freshData,
      timestamp: now,
      expiresAt: now + CACHE_DURATION
    };
    
    await chrome.storage.local.set({ [key]: newCacheEntry });
    console.log(`Data cached for ${key}. Will expire at: ${new Date(newCacheEntry.expiresAt).toLocaleString()}`);
    console.groupEnd();
    return freshData;
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    console.groupEnd();
    throw error;
  }
}

/**
 * Önbelleği tamamen temizler
 * @returns {Promise<void>}
 */
export async function clearCache() {
  try {
    await chrome.storage.local.clear();
    console.log('Cache cleared successfully!');
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
}

/**
 * Belirli bir anahtarı önbellekten siler
 * @param {string} key - Silinecek önbellek anahtarı
 * @returns {Promise<void>}
 */
export async function removeFromCache(key) {
  try {
    await chrome.storage.local.remove(key);
    console.log(`Removed ${key} from cache`);
  } catch (error) {
    console.error(`Error removing ${key} from cache:`, error);
    throw error;
  }
}

/**
 * Önbellekteki tüm verileri listeler (debug için)
 * @returns {Promise<Object>} - Önbellekteki tüm veriler
 */
export async function listCache() {
  try {
    const allCache = await chrome.storage.local.get(null);
    console.log('Current cache contents:', allCache);
    return allCache;
  } catch (error) {
    console.error('Error listing cache:', error);
    throw error;
  }
}