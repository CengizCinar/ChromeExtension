// NodeCache yerine basit bir Map kullanacağız (browser'da NodeCache kullanamayız)
const cache = new Map();
const DEFAULT_TTL = 300000; // 5 dakika (milisaniye cinsinden)

export async function getCachedOrFetch(key, fetchFn) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now < cached.expiry) {
    console.log(`[CacheService] Cache hit for key: ${key}`);
    return cached.data;
  }

  console.log(`[CacheService] Cache miss for key: ${key}, fetching data...`);
  const freshData = await fetchFn();
  
  cache.set(key, {
    data: freshData,
    expiry: now + DEFAULT_TTL
  });

  return freshData;
}

export function setCache(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    data: value,
    expiry: Date.now() + ttl
  });
}

export function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }
  return null;
} 