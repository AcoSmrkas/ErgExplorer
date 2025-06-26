export const FEE_ADDRESS = '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';
export const DONATION_ADDRESS = '9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk';

export const API_ENDPOINTS = {
	ERGEXPLORER: 'https://api.ergexplorer.com/',
	ERGOPLATFORM: 'https://api.ergoplatform.com/api/v1/',
	ERGOPLATFORM_BASE: 'https://api.ergoplatform.com/',
	SPECTRUM: 'https://api.spectrum.fi/v1/',
	MEWFINANCE: 'https://api.mewfinance.com/',
	SOCKET: 'https://socket.ergexplorer.com'
};

export function getApiHost() {
	if (typeof window !== 'undefined') {
		if (window.location.host === 'dev.ergexplorer.com') {
			return 'https://devapi.ergexplorer.com/';
		}
	}
	return API_ENDPOINTS.ERGEXPLORER;
}

class ApiError extends Error {
	constructor(message, status, response) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.response = response;
	}
}

async function apiRequest(url, options = {}) {
	try {
		const response = await fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...options
		});

		if (!response.ok) {
			throw new ApiError(
				`API request failed: ${response.statusText}`,
				response.status,
				response
			);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(`Network error: ${error.message}`, 0, null);
	}
}

export async function getBlocks(params = {}) {
	const {
		limit = 20,
		offset = 0,
		sortBy = 'height',
		sortDirection = 'desc'
	} = params;

	const url = `${API_ENDPOINTS.ERGOPLATFORM}blocks?limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
	return apiRequest(url);
}

export async function getBlock(id) {
	const url = `${API_ENDPOINTS.ERGOPLATFORM}blocks/${id}`;
	return apiRequest(url);
}

export async function getMempool(params = {}) {
	const { limit = 20, offset = 0 } = params;
	const url = `${API_ENDPOINTS.ERGOPLATFORM}mempool/transactions?limit=${limit}&offset=${offset}`;
	return apiRequest(url);
}

export async function getTransaction(id) {
	const url = `${API_ENDPOINTS.ERGOPLATFORM}transactions/${id}`;
	return apiRequest(url);
}

export async function getAddress(address, params = {}) {
	const { limit = 20, offset = 0 } = params;
	const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}?limit=${limit}&offset=${offset}`;
	return apiRequest(url);
}

export async function getAddressTransactions(address, params = {}) {
	const { limit = 20, offset = 0 } = params;
	const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}/transactions?limit=${limit}&offset=${offset}`;
	return apiRequest(url);
}

export async function getTokens(params = {}) {
	const { limit = 50, offset = 0 } = params;
	const url = `${API_ENDPOINTS.ERGEXPLORER}tokens?limit=${limit}&offset=${offset}`;
	return apiRequest(url);
}

export async function getToken(tokenId) {
	const url = `${API_ENDPOINTS.ERGEXPLORER}tokens/${tokenId}`;
	return apiRequest(url);
}

export async function getBox(boxId) {
	const url = `${API_ENDPOINTS.ERGOPLATFORM}boxes/${boxId}`;
	return apiRequest(url);
}

export async function getPrices() {
	try {
		const url = `${getApiHost()}tokens/getErgPrice`;
		const data = await apiRequest(url);
		return data.items?.[0] || null;
	} catch (error) {
		console.warn('Failed to fetch prices:', error);
		return null;
	}
}

export async function getNetworkStats() {
	try {
		const url = `${API_ENDPOINTS.ERGOPLATFORM}networkState`;
		return apiRequest(url);
	} catch (error) {
		console.warn('Failed to fetch network stats:', error);
		return null;
	}
}

export async function getProtocolInfo() {
	try {
		const url = `https://api.ergoplatform.com/info`;
		return apiRequest(url);
	} catch (error) {
		console.warn('Failed to fetch protocol info:', error);
		return null;
	}
}

export async function getStats() {
	try {
		const url = `https://api.ergoplatform.com/stats`;
		return apiRequest(url);
	} catch (error) {
		console.warn('Failed to fetch stats:', error);
		return null;
	}
}

export async function getTopVolumeTokens() {
	try {
		const url = `https://api.mewfinance.com/dex/getTop10Volume`;
		return apiRequest(url);
	} catch (error) {
		console.warn('Failed to fetch top volume tokens:', error);
		return null;
	}
}

export async function getPriceHistory() {
	try {
		const url = `${getApiHost()}tokens/getPriceHistory?cache`;
		const nowTime = Date.now();
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				'from': nowTime,
				'milestones': 'true',
				'period': '30d'
			})
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.warn('Failed to fetch price history:', error);
		return null;
	}
}

export async function getWhaleTxs() {
	try {
		const url = `${getApiHost()}transactions/getWhaleTxs`;
		return apiRequest(url);
	} catch (error) {
		console.warn('Failed to fetch whale transactions:', error);
		return null;
	}
}

export async function getTokensByIds(tokenIds) {
	try {
		const url = `${getApiHost()}tokens/byId`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				ids: tokenIds
			})
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.warn('Failed to fetch tokens by IDs:', error);
		return null;
	}
}

export async function getAddressBalance(address) {
	try {
		const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}/balance/total`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		console.warn('Failed to fetch address balance:', error);
		return null;
	}
}

export function getBlockUrl(blockId) {
	return `/blocks/${blockId}`;
}

export function getTransactionUrl(txId) {
	return `/transactions/${txId}`;
}

export function getAddressUrl(address) {
	return `/addresses/${address}`;
}

export function getTokenUrl(tokenId) {
	return `/tokens/${tokenId}`;
}

export function getBoxUrl(boxId) {
	return `/boxes/${boxId}`;
}