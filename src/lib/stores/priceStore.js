import { writable } from 'svelte/store';

// Centralized price store for all token prices including ERG
export const priceStore = writable({});

// Individual stores for convenience
export const ergPrice = writable(null);
export const currentPrices = writable({});

// Subscribe to main store and update individual stores
priceStore.subscribe(prices => {
	// Update ERG price - format as object with 'value' property for StatsOverview component
	if (prices.ERG) {
		ergPrice.set({ value: prices.ERG });
	}
	
	// Update current prices (excluding ERG for token-specific prices)
	const tokenPrices = { ...prices };
	
	currentPrices.set(tokenPrices);
});

// Update all prices
export function updatePrices(prices) {
	console.log(prices)
	priceStore.set(prices);
}

// Update specific price
export function updatePrice(tokenId, price) {
	priceStore.update(prices => ({
		...prices,
		[tokenId]: price
	}));
}

// Get current price for a specific token
export function getPrice(tokenId) {
	let price = null;
	priceStore.subscribe(prices => {
		price = prices[tokenId] || null;
	})();
	return price;
}

// Get all current prices
export function getAllPrices() {
	let prices = {};
	priceStore.subscribe(p => prices = p)();
	return prices;
}