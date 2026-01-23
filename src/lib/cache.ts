/**
 * Client-side caching utilities using IndexedDB and Memory Cache
 */

const CACHE_VERSION = 1;
const CACHE_NAME = "afterstill-cache-v1";
const DB_NAME = "afterstill-db";
const STORE_NAME = "cache-store";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Memory cache for frequently accessed data
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    // 5 minutes default
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

export const memoryCache = new MemoryCache();

/**
 * IndexedDB cache for persistent storage
 */
class IndexedDBCache {
  private db: IDBDatabase | null = null;

  async init() {
    if (typeof window === "undefined") return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, CACHE_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl: number = 24 * 60 * 60 * 1000) {
    // 24 hours default
    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const entry: CacheEntry<T> & { key: string } = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
    };

    return new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as
          | (CacheEntry<T> & { key: string })
          | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        const isExpired = Date.now() - entry.timestamp > entry.ttl;

        if (isExpired) {
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => resolve(null);
    });
  }

  async delete(key: string) {
    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear() {
    if (!this.db) await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBCache = new IndexedDBCache();

/**
 * Hybrid cache - tries memory first, then IndexedDB
 */
export async function getCached<T>(key: string): Promise<T | null> {
  // Try memory cache first
  const memoryData = memoryCache.get<T>(key);
  if (memoryData !== null) return memoryData;

  // Fallback to IndexedDB
  const dbData = await indexedDBCache.get<T>(key);
  if (dbData !== null) {
    // Populate memory cache
    memoryCache.set(key, dbData);
  }

  return dbData;
}

/**
 * Set data in both caches
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttl?: number
): Promise<void> {
  memoryCache.set(key, data, ttl);
  await indexedDBCache.set(key, data, ttl);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  memoryCache.clear();
  await indexedDBCache.clear();

  // Also clear service worker cache if available
  if (typeof window !== "undefined" && "caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

/**
 * Prefetch and cache data
 */
export async function prefetchAndCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  await setCached(key, data, ttl);

  return data;
}
