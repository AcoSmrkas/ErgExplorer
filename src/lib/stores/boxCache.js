// Box data caching service
import { getBox } from "$lib/utils/api.js";

// In-memory cache for box data
const boxCache = new Map();

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Get cached box data or fetch from API
export async function getCachedBoxData(boxId) {
  if (!boxId) return null;

  const now = Date.now();
  const cached = boxCache.get(boxId);

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Fetch fresh data from API
    const boxData = await getBox(boxId);

    // Cache the result
    boxCache.set(boxId, {
      data: boxData,
      timestamp: now,
    });

    return boxData;
  } catch (error) {
    console.warn(`Failed to fetch box data for ${boxId}:`, error);

    // Return cached data even if expired, or null if no cache
    return cached?.data || null;
  }
}

// Preload box data for a list of box IDs
export async function preloadBoxData(boxIds) {
  if (!Array.isArray(boxIds) || boxIds.length === 0) return;

  // Filter out already cached box IDs
  const now = Date.now();
  const uncachedBoxIds = boxIds.filter((boxId) => {
    const cached = boxCache.get(boxId);
    return !cached || now - cached.timestamp >= CACHE_DURATION;
  });

  if (uncachedBoxIds.length === 0) return;

  // Fetch data for uncached boxes (limit concurrent requests)
  const batchSize = 5;
  for (let i = 0; i < uncachedBoxIds.length; i += batchSize) {
    const batch = uncachedBoxIds.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (boxId) => {
        try {
          const boxData = await getBox(boxId);
          boxCache.set(boxId, {
            data: boxData,
            timestamp: now,
          });
        } catch (error) {
          console.warn(`Failed to preload box data for ${boxId}:`, error);
        }
      }),
    );
  }
}

// Clear expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [boxId, cached] of boxCache.entries()) {
    if (now - cached.timestamp >= CACHE_DURATION) {
      boxCache.delete(boxId);
    }
  }
}, CACHE_DURATION); // Clean up every cache duration interval
