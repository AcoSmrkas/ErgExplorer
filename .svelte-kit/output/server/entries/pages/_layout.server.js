import "../../chunks/index2.js";
class Cache {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  set(key, value, ttlMs = 24 * 60 * 60 * 1e3) {
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
const cache = new Cache();
const API_HOSTS = {
  ERGEXPLORER: "https://api.ergexplorer.com/",
  ERGOPLATFORM: "https://api.ergoplatform.com/api/v1/",
  ERGOPLATFORM_BASE: "https://api.ergoplatform.com/",
  SPECTRUM: "https://api.spectrum.fi/v1/",
  MEWFINANCE: "https://api.mewfinance.com/"
};
async function loadCurrentPrices() {
  try {
    const prices = { ERG: 0 };
    const ergResponse = await fetch(
      `${API_HOSTS.ERGEXPLORER}tokens/getErgPrice`
    );
    const ergData = await ergResponse.json();
    if (ergData.items?.[0]) {
      prices["ERG"] = parseFloat(ergData.items[0].value);
      prices["ERG_FULL"] = {
        value: ergData.items[0].value,
        difference: ergData.items[0].difference,
        timestamp: ergData.items[0].timestamp
      };
    }
    const [marketsResponse, poolsResponse] = await Promise.all([
      fetch(`${API_HOSTS.SPECTRUM}price-tracking/markets`),
      fetch(`${API_HOSTS.SPECTRUM}amm/pools/stats`)
    ]);
    const marketsData = await marketsResponse.json();
    const poolsData = await poolsResponse.json();
    for (const pairData of marketsData) {
      if (pairData.baseSymbol === "ERG" && !prices[pairData.quoteId]) {
        const hasLiquidity = poolsData.some(
          (poolData) => poolData.lockedX.id === pairData.baseId && poolData.lockedY.id === pairData.quoteId && poolData.lockedX.amount / Math.pow(10, 9) >= 1e3
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
async function loadTokenIcons() {
  const cacheKey = "token-icons";
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(
      `${API_HOSTS.ERGEXPLORER}tokens/getTokenIcons`
    );
    const data = await response.json();
    const tokenIcons = {};
    if (data.items) {
      console.log("Loaded", data.items.length, "token icons from API");
      for (const item of data.items) {
        tokenIcons[item.id] = item.iconurl;
      }
    }
    cache.set(cacheKey, tokenIcons, 24 * 60 * 60 * 1e3);
    return tokenIcons;
  } catch (error) {
    console.warn("Failed to load token icons:", error);
    return {};
  }
}
async function load() {
  try {
    const [currentPrices, tokenIcons] = await Promise.all([
      loadCurrentPrices(),
      loadTokenIcons()
    ]);
    return {
      currentPrices,
      tokenIcons
    };
  } catch (err) {
    console.error("Failed to load global data:", err);
    return {
      currentPrices: { ERG: 0 },
      tokenIcons: {}
    };
  }
}
export {
  load
};
