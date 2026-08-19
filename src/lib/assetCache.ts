/**
 * Persistent Asset Cache Layer (IndexedDB with in-memory ObjectURL memoization)
 * Caches static game images, covers, thumbnails and audio files locally so returning
 * users do not need to download assets again.
 */

const DB_NAME = 'lt_casino_assets_v2';
const DB_VERSION = 1;
const STORE_IMAGES = 'images';
const STORE_AUDIO = 'audio';

// In-memory cache for created Object URLs to prevent creating duplicate blob URLs
const objectUrlMemoryCache = new Map<string, string>();
// Tracking pending fetches to avoid duplicate simultaneous requests
const pendingFetches = new Map<string, Promise<string>>();

interface CachedAssetRecord {
  url: string;
  blob: Blob;
  mimeType: string;
  size: number;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and returns the IndexedDB instance with error handling
 */
function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_IMAGES)) {
          db.createObjectStore(STORE_IMAGES, { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains(STORE_AUDIO)) {
          db.createObjectStore(STORE_AUDIO, { keyPath: 'url' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        console.warn('IndexedDB opening error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      console.warn('Failed to open IndexedDB:', err);
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Retrieve cached blob from IndexedDB
 */
async function getAssetFromStore(storeName: string, url: string): Promise<CachedAssetRecord | null> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(url);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save asset blob to IndexedDB
 */
async function saveAssetToStore(storeName: string, record: CachedAssetRecord): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fail silently without blocking UI
  }
}

/**
 * Fetch asset, cache it in IndexedDB, and return an Object URL
 */
async function fetchAndCacheAsset(url: string, storeName: string): Promise<string> {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return url;
  }

  const normalizedUrl = url.trim();

  // 1. Check in-memory Object URL cache
  const memoryHit = objectUrlMemoryCache.get(normalizedUrl);
  if (memoryHit) {
    return memoryHit;
  }

  // 2. Check pending network/db requests to prevent duplicate work
  if (pendingFetches.has(normalizedUrl)) {
    return pendingFetches.get(normalizedUrl)!;
  }

  const fetchPromise = (async () => {
    try {
      // 3. Check IndexedDB
      const cached = await getAssetFromStore(storeName, normalizedUrl);
      if (cached && cached.blob) {
        const objectUrl = URL.createObjectURL(cached.blob);
        objectUrlMemoryCache.set(normalizedUrl, objectUrl);
        return objectUrl;
      }

      // 4. If not in cache, fetch over network
      const response = await fetch(normalizedUrl, { mode: 'cors' });
      if (!response.ok) {
        return normalizedUrl;
      }

      const blob = await response.blob();
      const record: CachedAssetRecord = {
        url: normalizedUrl,
        blob,
        mimeType: blob.type || (storeName === STORE_AUDIO ? 'audio/mpeg' : 'image/jpeg'),
        size: blob.size,
        timestamp: Date.now(),
      };

      // Store in IndexedDB
      await saveAssetToStore(storeName, record);

      // Create Object URL and cache in memory
      const objectUrl = URL.createObjectURL(blob);
      objectUrlMemoryCache.set(normalizedUrl, objectUrl);
      return objectUrl;
    } catch (e) {
      // Fallback gracefully to original URL
      return normalizedUrl;
    } finally {
      pendingFetches.delete(normalizedUrl);
    }
  })();

  pendingFetches.set(normalizedUrl, fetchPromise);
  return fetchPromise;
}

/**
 * Get or cache an image URL
 */
export async function getCachedImageUrl(url?: string): Promise<string> {
  if (!url) return '';
  return fetchAndCacheAsset(url, STORE_IMAGES);
}

/**
 * Get or cache an audio track URL
 */
export async function getCachedAudioUrl(url?: string): Promise<string> {
  if (!url) return '';
  return fetchAndCacheAsset(url, STORE_AUDIO);
}

/**
 * Preload an array of asset URLs in the background without blocking the UI
 */
export async function preloadAssets(urls: (string | undefined)[], type: 'image' | 'audio' = 'image'): Promise<void> {
  const storeName = type === 'audio' ? STORE_AUDIO : STORE_IMAGES;
  const validUrls = urls.filter((u): u is string => Boolean(u && typeof u === 'string' && u.trim().length > 0));

  // Process in small batches of 3 to avoid saturating network
  const batchSize = 3;
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    await Promise.allSettled(batch.map((url) => fetchAndCacheAsset(url, storeName)));
  }
}

/**
 * Clear all cached assets from IndexedDB and free ObjectURLs
 */
export async function clearAssetCache(): Promise<void> {
  // Revoke memory URLs
  objectUrlMemoryCache.forEach((objectUrl) => {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {}
  });
  objectUrlMemoryCache.clear();
  pendingFetches.clear();

  try {
    const db = await getDB();
    const tx = db.transaction([STORE_IMAGES, STORE_AUDIO], 'readwrite');
    tx.objectStore(STORE_IMAGES).clear();
    tx.objectStore(STORE_AUDIO).clear();
  } catch (err) {
    console.warn('Failed to clear asset cache stores:', err);
  }
}

/**
 * Get statistical information about the local asset cache
 */
export async function getAssetCacheStats(): Promise<{ totalImages: number; totalAudio: number; estimatedSizeMB: string }> {
  try {
    const db = await getDB();
    const countItems = (storeName: string): Promise<{ count: number; size: number }> => {
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.openCursor();
        let count = 0;
        let size = 0;

        req.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            count++;
            size += (cursor.value as CachedAssetRecord).size || 0;
            cursor.continue();
          } else {
            resolve({ count, size });
          }
        };
        req.onerror = () => resolve({ count: 0, size: 0 });
      });
    };

    const images = await countItems(STORE_IMAGES);
    const audio = await countItems(STORE_AUDIO);
    const totalBytes = images.size + audio.size;
    const mb = (totalBytes / (1024 * 1024)).toFixed(2);

    return {
      totalImages: images.count,
      totalAudio: audio.count,
      estimatedSizeMB: `${mb} MB`,
    };
  } catch {
    return {
      totalImages: 0,
      totalAudio: 0,
      estimatedSizeMB: '0.00 MB',
    };
  }
}
