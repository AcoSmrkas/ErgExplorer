// Simple in-memory cache with TTL support
class Cache {
	constructor() {
		this.store = new Map();
	}

	set(key, value, ttlMs = 24 * 60 * 60 * 1000) { // Default 24h TTL
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

// Global cache instance
export const cache = new Cache();