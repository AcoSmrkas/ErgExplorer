// Token cache using generic cache utility
import { getTokensByIds } from "$lib/utils/api.js";
import { createCache, validators, keyExtractors } from "$lib/utils/cache.js";

// Custom fetcher that handles both single tokens and arrays
async function tokenFetcher(tokenIds) {
  // Handle both single ID and array of IDs
  const ids = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
  
  try {
    const response = await getTokensByIds(ids);
    const tokens = response?.items || [];
    return Array.isArray(tokenIds) ? tokens : tokens[0] || null;
  } catch (error) {
    console.warn("Failed to fetch tokens by IDs:", error);
    return Array.isArray(tokenIds) ? [] : null;
  }
}

// Create token cache service
const tokenCacheService = createCache({
  fetcher: tokenFetcher,
  validator: (value) => {
    // Accept both single string and array of strings
    return typeof value === "string" || validators.arrayOfStrings(value);
  },
  keyExtractor: keyExtractors.tokenId,
  name: 'token'
});

// Export the cache store for reactive usage
export const tokenCache = tokenCacheService.store;

// Export functions with original names for backward compatibility
export const getCachedTokens = tokenCacheService.getMany;
export const getCachedToken = tokenCacheService.get;

// Export other useful functions
export const clearExpiredCache = tokenCacheService.clearExpired;
export const preloadTokenData = tokenCacheService.preload;
export const getTokenCacheStats = tokenCacheService.getStats;
