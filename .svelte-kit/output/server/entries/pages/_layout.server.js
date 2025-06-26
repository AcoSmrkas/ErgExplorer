import "../../chunks/index2.js";
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
    const ergResponse = await fetch(`${API_HOSTS.ERGEXPLORER}tokens/getErgPrice`);
    const ergData = await ergResponse.json();
    if (ergData.items?.[0]) {
      prices["ERG"] = parseFloat(ergData.items[0].value);
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
async function load() {
  try {
    const currentPrices = await loadCurrentPrices();
    return {
      currentPrices
    };
  } catch (err) {
    console.error("Failed to load global data:", err);
    return {
      currentPrices: { ERG: 0 }
    };
  }
}
export {
  load
};
