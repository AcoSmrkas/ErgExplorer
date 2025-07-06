// Address cache using generic cache utility
import { getAddressBalance } from "$lib/utils/api.js";
import { createCache, validators } from "$lib/utils/cache.js";

// Create address cache service
const addressCacheService = createCache({
  fetcher: getAddressBalance,
  validator: validators.nonEmptyString,
  name: 'address'
});

// Export the cache store for reactive usage
export const addressCache = addressCacheService.store;

// Export the main cache function with original name for backward compatibility
export const getCachedAddressBalance = addressCacheService.get;

// Export other useful functions
export const clearExpiredAddressCache = addressCacheService.clearExpired;
export const preloadAddressData = addressCacheService.preload;
export const getAddressCacheStats = addressCacheService.getStats;
