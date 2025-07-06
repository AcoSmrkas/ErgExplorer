// Global server-side data loading for all pages
import { cache } from "$lib/utils/cache.js";
import { API_ENDPOINTS } from "$lib/utils/constants.js";

// Load current prices for token calculations (used across multiple pages)
async function loadCurrentPrices() {
  try {
    const prices = { ERG: 0 };

    // Get token prices from Spectrum
    const [ergResponse, marketsResponse, poolsResponse] = await Promise.all([
      fetch(`${API_ENDPOINTS.ERGEXPLORER}tokens/getErgPrice`),
      fetch(`${API_ENDPOINTS.SPECTRUM}price-tracking/markets`),
      fetch(`${API_ENDPOINTS.SPECTRUM}amm/pools/stats`),
    ]);

    const ergData = await ergResponse.json();
    const marketsData = await marketsResponse.json();
    const poolsData = await poolsResponse.json();

    if (ergData.items?.[0]) {
      prices["ERG"] = parseFloat(ergData.items[0].value);
      // Also store the full ERG price data for components that need percentage change
      prices["ERG_FULL"] = {
        value: ergData.items[0].value,
        difference: ergData.items[0].difference,
        timestamp: ergData.items[0].timestamp,
      };
    }

    // Process prices like the original
    for (const pairData of marketsData) {
      if (pairData.baseSymbol === "ERG" && !prices[pairData.quoteId]) {
        // Check if pool has enough liquidity
        const hasLiquidity = poolsData.some(
          (poolData) =>
            poolData.lockedX.id === pairData.baseId &&
            poolData.lockedY.id === pairData.quoteId &&
            poolData.lockedX.amount / Math.pow(10, 9) >= 1000,
        );

        if (hasLiquidity) {
          const price = prices["ERG"] / pairData.lastPrice;
          prices[pairData.quoteId] = price;
        }
      }
    }

    return prices;
  } catch (error) {
    console.warn("Failed to load current prices:", error);
    return { ERG: 0 };
  }
}

// Load token icons with 24h cache
async function loadTokenIcons() {
  const cacheKey = "token-icons";

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${API_ENDPOINTS.ERGEXPLORER}tokens/getTokenIcons`,
    );
    const data = await response.json();

    const tokenIcons = {};
    if (data.items) {
      console.log("Loaded", data.items.length, "token icons from API");
      for (const item of data.items) {
        tokenIcons[item.id] = item.iconurl;
      }
    }

    // Cache for 24 hours
    cache.set(cacheKey, tokenIcons, 24 * 60 * 60 * 1000);
    return tokenIcons;
  } catch (error) {
    console.warn("Failed to load token icons:", error);
    return {};
  }
}

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
  try {
    // Load global data that all pages need
    const [currentPrices, tokenIcons] = await Promise.all([
      loadCurrentPrices(),
      loadTokenIcons(),
    ]);

    return {
      currentPrices,
      tokenIcons,
    };
  } catch (err) {
    console.error("Failed to load global data:", err);
    // Don't throw error here, just return empty data
    // Individual pages can still function without prices
    return {
      currentPrices: { ERG: 0 },
      tokenIcons: {},
    };
  }
}
