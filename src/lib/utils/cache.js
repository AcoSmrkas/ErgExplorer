/**
 * Generic cache utility factory for creating typed cache services
 * Reduces code duplication across address, token, and box caches
 */
import { writable } from "svelte/store";

/**
 * Creates a cache service with the specified configuration
 * @param {Object} config - Cache configuration
 * @param {Function} config.fetcher - Function to fetch data when not cached
 * @param {number} config.cacheDuration - Cache duration in milliseconds (default: 5 minutes)
 * @param {Function} config.keyExtractor - Function to extract cache key from item (optional)
 * @param {Function} config.validator - Function to validate input (optional)
 * @param {boolean} config.useStore - Whether to use Svelte store for cache (default: true)
 * @returns {Object} Cache service with get, clear, and preload methods
 */
export function createCache(config) {
  const {
    fetcher,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    keyExtractor = null,
    validator = null,
    useStore = true,
    name = 'cache'
  } = config;

  // Create cache storage
  const cacheMap = new Map();
  const pendingRequests = new Map();
  
  // Optional Svelte store for reactive cache
  const store = useStore ? writable(new Map()) : null;

  /**
   * Get cache contents (for Svelte store)
   */
  function getCache() {
    if (store) {
      let cache;
      store.subscribe(value => cache = value)();
      return cache;
    }
    return cacheMap;
  }

  /**
   * Update cache storage
   */
  function updateCache(updater) {
    if (store) {
      store.update(updater);
    } else {
      const newCache = updater(cacheMap);
      cacheMap.clear();
      for (const [key, value] of newCache.entries()) {
        cacheMap.set(key, value);
      }
    }
  }

  /**
   * Get single item from cache or fetch if not cached
   */
  async function get(key) {
    // Validate input if validator provided
    if (validator && !validator(key)) {
      return null;
    }

    const cache = getCache();
    const now = Date.now();
    const cached = cache.get(key);

    // Return cached data if still valid
    if (cached && now - cached.timestamp < cacheDuration) {
      return cached.data;
    }

    // Check if there's already a pending request
    if (pendingRequests.has(key)) {
      try {
        return await pendingRequests.get(key);
      } catch (error) {
        console.warn(`Failed to wait for pending ${name} request:`, error);
        return null;
      }
    }

    // Create new request
    const requestPromise = fetchAndCache(key);
    pendingRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      pendingRequests.delete(key);
      return result;
    } catch (error) {
      console.warn(`Failed to fetch ${name}:`, error);
      pendingRequests.delete(key);
      return null;
    }
  }

  /**
   * Get multiple items from cache or fetch if not cached
   */
  async function getMany(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    const cache = getCache();
    const now = Date.now();
    const uncachedKeys = [];
    const results = [];

    // Check cache for each key
    for (const key of keys) {
      const cached = cache.get(key);
      if (cached && now - cached.timestamp < cacheDuration) {
        results.push(cached.data);
      } else {
        uncachedKeys.push(key);
      }
    }

    // Fetch uncached items
    if (uncachedKeys.length > 0) {
      const newKeys = uncachedKeys.filter(key => !pendingRequests.has(key));

      if (newKeys.length > 0) {
        const requestPromise = fetchAndCacheMany(newKeys);
        
        // Mark these keys as pending
        newKeys.forEach(key => pendingRequests.set(key, requestPromise));

        try {
          const fetchedItems = await requestPromise;
          results.push(...fetchedItems);

          // Clear pending requests
          newKeys.forEach(key => pendingRequests.delete(key));
        } catch (error) {
          console.warn(`Failed to fetch ${name} items:`, error);
          newKeys.forEach(key => pendingRequests.delete(key));
        }
      } else {
        // Wait for existing pending requests
        const pendingPromises = uncachedKeys
          .filter(key => pendingRequests.has(key))
          .map(key => pendingRequests.get(key));

        if (pendingPromises.length > 0) {
          try {
            const pendingResults = await Promise.all(pendingPromises);
            results.push(...pendingResults.flat());
          } catch (error) {
            console.warn(`Failed to wait for pending ${name} requests:`, error);
          }
        }
      }
    }

    return results;
  }

  /**
   * Internal function to fetch and cache single item
   */
  async function fetchAndCache(key) {
    try {
      const data = await fetcher(key);

      // Update cache
      updateCache(cache => {
        const newCache = new Map(cache);
        newCache.set(key, {
          data,
          timestamp: Date.now()
        });
        return newCache;
      });

      return data;
    } catch (error) {
      console.warn(`Failed to fetch ${name} for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Internal function to fetch and cache multiple items
   */
  async function fetchAndCacheMany(keys) {
    try {
      const items = await fetcher(keys);
      
      // Update cache
      updateCache(cache => {
        const newCache = new Map(cache);
        const timestamp = Date.now();

        // Handle both single items and arrays
        const itemsArray = Array.isArray(items) ? items : [items];
        
        itemsArray.forEach(item => {
          const key = keyExtractor ? keyExtractor(item) : item.id;
          if (key) {
            newCache.set(key, {
              data: item,
              timestamp
            });
          }
        });

        return newCache;
      });

      return Array.isArray(items) ? items : [items];
    } catch (error) {
      console.warn(`Failed to fetch ${name} for keys:`, keys, error);
      return [];
    }
  }

  /**
   * Preload multiple items into cache
   */
  async function preload(keys, batchSize = 5) {
    if (!Array.isArray(keys) || keys.length === 0) return;

    const cache = getCache();
    const now = Date.now();
    
    // Filter out already cached keys
    const uncachedKeys = keys.filter(key => {
      const cached = cache.get(key);
      return !cached || now - cached.timestamp >= cacheDuration;
    });

    if (uncachedKeys.length === 0) return;

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < uncachedKeys.length; i += batchSize) {
      const batch = uncachedKeys.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(key => fetchAndCache(key))
      );
    }
  }

  /**
   * Clear expired cache entries
   */
  function clearExpired() {
    const now = Date.now();
    updateCache(cache => {
      const newCache = new Map();

      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp < cacheDuration) {
          newCache.set(key, value);
        }
      }

      return newCache;
    });
  }

  /**
   * Clear all cache entries
   */
  function clear() {
    updateCache(() => new Map());
    pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  function getStats() {
    const cache = getCache();
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [, value] of cache.entries()) {
      if (now - value.timestamp < cacheDuration) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: cache.size,
      valid,
      expired,
      pending: pendingRequests.size
    };
  }

  // Set up periodic cleanup if in browser
  if (typeof window !== "undefined") {
    setInterval(clearExpired, cacheDuration);
  }

  // Return cache service interface
  return {
    get,
    getMany,
    preload,
    clear,
    clearExpired,
    getStats,
    // Expose store for Svelte reactivity
    store
  };
}

/**
 * Common validators for different data types
 */
export const validators = {
  nonEmptyString: (value) => typeof value === "string" && value.trim() !== "",
  arrayOfStrings: (value) => Array.isArray(value) && value.every(v => typeof v === "string"),
  validBoxId: (value) => typeof value === "string" && value.length > 0
};

/**
 * Common key extractors for different data types
 */
export const keyExtractors = {
  id: (item) => item.id,
  tokenId: (item) => item.id || item.tokenId,
  address: (item) => item.address
};

// Legacy simple cache (keeping for backward compatibility)
class SimpleCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs = 24 * 60 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

// Global simple cache instance (legacy)
export const cache = new SimpleCache();