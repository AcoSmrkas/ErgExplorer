// Box cache using generic cache utility
import { getBox } from "$lib/utils/api.js";
import { createCache, validators } from "$lib/utils/cache.js";

// Custom fetcher with fallback to expired cache on error
async function boxFetcher(boxId) {
  try {
    const boxData = await getBox(boxId);
    return boxData;
  } catch (error) {
    console.warn(`Failed to fetch box data for ${boxId}:`, error);
    throw error; // Let cache handle fallback
  }
}

// Create box cache service (using Map instead of Svelte store for performance)
const boxCacheService = createCache({
  fetcher: boxFetcher,
  validator: validators.validBoxId,
  useStore: false, // Use plain Map for better performance
  name: 'box'
});

// Export main functions with original names for backward compatibility
export const getCachedBoxData = boxCacheService.get;
export const preloadBoxData = boxCacheService.preload;

// Export additional utility functions
export const clearExpiredBoxCache = boxCacheService.clearExpired;
export const getBoxCacheStats = boxCacheService.getStats;
