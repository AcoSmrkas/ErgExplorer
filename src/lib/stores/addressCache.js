// Global address cache store
import { writable } from "svelte/store";
import { getAddressBalance } from "$lib/utils/api.js";

// Create writable store for address cache
export const addressCache = writable(new Map());

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store for pending requests to avoid duplicate API calls
const pendingRequests = new Map();

// Function to get address balance with caching
export async function getCachedAddressBalance(address) {
  if (!address || typeof address !== "string") {
    return null;
  }

  let cache;
  addressCache.subscribe((value) => (cache = value))();

  const now = Date.now();
  const cached = cache.get(address);

  // Check if we have valid cached data
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Check if there's already a pending request
  if (pendingRequests.has(address)) {
    try {
      return await pendingRequests.get(address);
    } catch (error) {
      console.warn("Failed to wait for pending address request:", error);
      return null;
    }
  }

  // Create new request
  const requestPromise = fetchAndCacheAddressBalance(address);
  pendingRequests.set(address, requestPromise);

  try {
    const balance = await requestPromise;
    pendingRequests.delete(address);
    return balance;
  } catch (error) {
    console.warn("Failed to fetch address balance:", error);
    pendingRequests.delete(address);
    return null;
  }
}

// Internal function to fetch and cache address balance
async function fetchAndCacheAddressBalance(address) {
  try {
    const balance = await getAddressBalance(address);

    // Update cache
    addressCache.update((cache) => {
      const newCache = new Map(cache);
      const timestamp = Date.now();

      newCache.set(address, {
        data: balance,
        timestamp: timestamp,
      });

      return newCache;
    });

    return balance;
  } catch (error) {
    console.warn("Failed to fetch address balance:", error);
    return null;
  }
}

// Function to clear expired cache entries
export function clearExpiredAddressCache() {
  const now = Date.now();
  addressCache.update((cache) => {
    const newCache = new Map();

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp < CACHE_DURATION) {
        newCache.set(key, value);
      }
    }

    return newCache;
  });
}

// Clear expired cache every 5 minutes
if (typeof window !== "undefined") {
  setInterval(clearExpiredAddressCache, CACHE_DURATION);
}
