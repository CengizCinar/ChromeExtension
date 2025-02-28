const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 43200, checkperiod: 43210 });
// stdTTL: 43200 -> 12 saat
// checkperiod: 43210 -> Cache temizliği için biraz daha uzun bir süre

async function getCachedOrFetch(key, fetchFn) {
  const cachedData = myCache.get(key);
  if (cachedData) {
    console.log(`[CacheService] Cache hit for key: ${key}`);
    return cachedData;
  }

  console.log(`[CacheService] Cache miss for key: ${key}, fetching data...`);
  const freshData = await fetchFn();
  myCache.set(key, freshData);
  return freshData;
}

function setCache(key, value, ttl = 43200) {
  myCache.set(key, value, ttl);
}

function getCache(key) {
  return myCache.get(key);
}

module.exports = {
  getCachedOrFetch,
  setCache,
  getCache
};
