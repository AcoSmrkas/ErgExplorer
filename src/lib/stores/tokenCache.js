// Global token cache store
import { writable } from 'svelte/store';
import { getTokensByIds } from '$lib/utils/api.js';

// Create writable store for token cache
export const tokenCache = writable(new Map());

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Store for pending requests to avoid duplicate API calls
const pendingRequests = new Map();

// Function to get token data with caching
export async function getCachedTokens(tokenIds) {
	if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
		return [];
	}

	let cache;
	tokenCache.subscribe(value => cache = value)();

	const now = Date.now();
	const uncachedIds = [];
	const results = [];

	// Check cache for each token
	for (const tokenId of tokenIds) {
		const cached = cache.get(tokenId);
		if (cached && (now - cached.timestamp) < CACHE_DURATION) {
			// Use cached data
			results.push(cached.data);
		} else {
			// Need to fetch this token
			uncachedIds.push(tokenId);
		}
	}

	// If we have uncached tokens, fetch them
	if (uncachedIds.length > 0) {
		// Check if there's already a pending request for any of these tokens
		const newIds = uncachedIds.filter(id => !pendingRequests.has(id));
		
		if (newIds.length > 0) {
			// Create a promise for these tokens
			const requestPromise = fetchAndCacheTokens(newIds);
			
			// Mark these IDs as pending
			newIds.forEach(id => pendingRequests.set(id, requestPromise));
			
			try {
				const fetchedTokens = await requestPromise;
				results.push(...fetchedTokens);
				
				// Clear pending requests
				newIds.forEach(id => pendingRequests.delete(id));
			} catch (error) {
				console.warn('Failed to fetch tokens:', error);
				// Clear pending requests on error
				newIds.forEach(id => pendingRequests.delete(id));
			}
		} else {
			// Wait for existing pending requests
			const pendingPromises = uncachedIds
				.filter(id => pendingRequests.has(id))
				.map(id => pendingRequests.get(id));
			
			if (pendingPromises.length > 0) {
				try {
					const pendingResults = await Promise.all(pendingPromises);
					results.push(...pendingResults.flat());
				} catch (error) {
					console.warn('Failed to wait for pending token requests:', error);
				}
			}
		}
	}

	return results;
}

// Function to get a single token by ID
export async function getCachedToken(tokenId) {
	const tokens = await getCachedTokens([tokenId]);
	return tokens[0] || null;
}

// Internal function to fetch and cache tokens
async function fetchAndCacheTokens(tokenIds) {
	try {
		const response = await getTokensByIds(tokenIds);
		const tokens = response?.items || [];

		// Update cache
		tokenCache.update(cache => {
			const newCache = new Map(cache);
			const timestamp = Date.now();
			
			tokens.forEach(token => {
				// Use id field from API response, not tokenId
				const tokenId = token.id || token.tokenId;
				if (tokenId) {
					newCache.set(tokenId, {
						data: token,
						timestamp: timestamp
					});
				}
			});
			
			return newCache;
		});

		return tokens;
	} catch (error) {
		console.warn('Failed to fetch tokens by IDs:', error);
		return [];
	}
}

// Function to clear expired cache entries
export function clearExpiredCache() {
	const now = Date.now();
	tokenCache.update(cache => {
		const newCache = new Map();
		
		for (const [key, value] of cache.entries()) {
			if ((now - value.timestamp) < CACHE_DURATION) {
				newCache.set(key, value);
			}
		}
		
		return newCache;
	});
}

// Clear expired cache every 5 minutes
if (typeof window !== 'undefined') {
	setInterval(clearExpiredCache, CACHE_DURATION);
}