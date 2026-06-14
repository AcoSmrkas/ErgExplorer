import { AddressState, FilterState } from './state.js';

// The primary tx API (sigmaspace) can hang when it's down, so abort and fail over after this.
const TX_PRIMARY_TIMEOUT_MS = 8000;
// The fallback (ergoplatform) gets a more generous budget before giving up.
const TX_FALLBACK_TIMEOUT_MS = 20000;
// Other address data fetches (mempool, balance, unspent boxes) abort after this to avoid hanging.
const DATA_FETCH_TIMEOUT_MS = 15000;

/**
 * Fetch with an abort-based timeout that also covers reading the response body, so a host
 * that hangs (no response, or headers-then-stall) rejects instead of waiting forever.
 */
async function fetchWithTimeout(url, timeoutMs, readBody) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(url, { signal: controller.signal });
		return await readBody(response);
	} finally {
		clearTimeout(timer);
	}
}

/**
 * API client for address page data fetching
 * Wraps jQuery $.get/$.ajax and fetch calls for cleaner API
 */
export const ApiClient = {
	/**
	 * Fetch scam token list
	 */
	getScamList() {
		return new Promise((resolve, reject) => {
			$.get(ERGEXPLORER_API_HOST + 'tokens/getScam',
				(data) => resolve(data.items.map(t => t.tokenId))
			).fail(() => reject(new Error('Failed to fetch scam list')));
		});
	},

	/**
	 * Fetch user profile data
	 */
	getUser(address) {
		return new Promise((resolve, reject) => {
			$.get(ERGEXPLORER_API_HOST + 'user/getUser?address=' + address,
				(data) => resolve(data)
			).fail(() => reject(new Error('Failed to fetch user data')));
		});
	},

	/**
	 * Fetch verified address book details for the current address
	 */
	getAddressInfo() {
		return new Promise((resolve, reject) => {
			$.get(ERGEXPLORER_API_HOST + 'addressbook/getAddressInfo?address=' + AddressState.walletAddress,
				(data) => resolve(data)
			).fail(() => reject(new Error('Failed to fetch address details')));
		});
	},

	/**
	 * Get balance/summary URL
	 */
	getTxsUrl() {
		let url = API_HOST_2 + 'addresses/' + AddressState.walletAddress + '/balance/total';
		if (networkType === 'testnet') {
			url = API_HOST + 'api/v1/addresses/' + AddressState.walletAddress + '/balance/total';
		}
		return url;
	},

	/**
	 * Get unspent boxes URL
	 */
	getUnspentBoxesDataUrl(boxOffset = 0, limit = AddressState.unspentBoxesPageSize) {
		let url = API_HOST_2 + 'boxes/unspent/byAddress/' + AddressState.walletAddress;
		if (networkType === 'testnet') {
			url = API_HOST + 'api/v1/boxes/unspent/byAddress/' + AddressState.walletAddress;
		}
		return url + '?offset=' + boxOffset + '&limit=' + limit;
	},

	/**
	 * Get transactions data URL with fallback support
	 */
	getTxsDataUrl(attempt = 1) {
		// Check if using filters (from URL params, not FilterState alone)
		const hasFilters = typeof params !== 'undefined' && params['filterTxs'] === 'true';

		if (hasFilters) {
			return this._buildFilterUrl();
		}

		if (attempt === 1) {
			if (networkType === 'testnet') {
				return API_HOST + 'api/v1/addresses/' + AddressState.walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE;
			}
			// Primary: Use sigmaspace for full transaction details
			return `https://api.sigmaspace.io/api/v1/addresses/${AddressState.walletAddress}/transactions?offset=${offset}&limit=${ITEMS_PER_PAGE}`;
		}

		// Fallback: Use ergoplatform API
		return API_HOST_2 + 'addresses/' + AddressState.walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE;
	},

	/**
	 * Build filter URL with query parameters
	 */
	_buildFilterUrl() {
		let url = ERGEXPLORER_API_HOST + 'user/getUserTransactions?filterTx&address=' + AddressState.walletAddress + '&offset=' + offset + '&limit=' + ITEMS_PER_PAGE;

		if (FilterState.tokenId) url += '&tokenId=' + FilterState.tokenId;
		if (FilterState.minValue !== undefined) url += '&minValue=' + FilterState.minValue;
		if (FilterState.maxValue !== undefined) url += '&maxValue=' + FilterState.maxValue;
		if (FilterState.fromDate !== undefined) url += '&fromDate=' + FilterState.fromDate;
		if (FilterState.toDate !== undefined) url += '&toDate=' + FilterState.toDate;
		if (FilterState.txType !== 'all') url += '&txType=' + FilterState.txType;

		return url;
	},

	/**
	 * Get mempool URL
	 */
	getMempoolUrl() {
		let url = API_HOST_2 + 'mempool/transactions/byAddress/' + AddressState.walletAddress;
		if (networkType === 'testnet') {
			url = API_HOST_2 + 'api/v1/mempool/transactions/byAddress/' + AddressState.walletAddress;
		}
		return url;
	},

	/**
	 * Fetch mempool data
	 */
	async getMempoolData() {
		try {
			const data = await fetchWithTimeout(this.getMempoolUrl(), DATA_FETCH_TIMEOUT_MS, async (response) => {
				if (!response.ok) throw new Error('Mempool fetch failed');
				const arrayBuffer = await response.arrayBuffer();
				const buffer = new TextDecoder('utf-8').decode(arrayBuffer);
				return JSONbig.parse(buffer);
			});

			AddressState.mempoolData = data;
				AddressState.mempoolCount = data.total;

			if (data.total > 0 && AddressState.mempoolTxIds.length === 0) {
				AddressState.mempoolTxIds = data.items.map(tx => tx.id);
			}

			return data;
		} catch (error) {
			console.error('Mempool fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch transactions data with retry fallback.
	 * The primary (sigmaspace) request is aborted if it doesn't respond within the
	 * timeout, so a hung/down host fails over to the fallback instead of hanging.
	 */
	async getTransactionsData(attempt = 1) {
		const url = this.getTxsDataUrl(attempt);
		const timeoutMs = attempt === 1 ? TX_PRIMARY_TIMEOUT_MS : TX_FALLBACK_TIMEOUT_MS;

		try {
			const data = await fetchWithTimeout(url, timeoutMs, async (response) => {
				if (!response.ok) throw new Error('Transactions fetch failed');
				const arrayBuffer = await response.arrayBuffer();
				const buffer = new TextDecoder('utf-8').decode(arrayBuffer);
				return JSONbig.parse(buffer);
			});

			AddressState.transactionsData = data;

			return data;
		} catch (error) {
			if (attempt === 1) {
				console.warn('Primary API failed or timed out, trying fallback...', error);
				return this.getTransactionsData(2);
			}
			console.error('Transactions fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch balance summary
	 */
	async getAddressSummary() {
		try {
			return await fetchWithTimeout(this.getTxsUrl(), DATA_FETCH_TIMEOUT_MS, async (response) => {
				if (!response.ok) throw new Error('Balance fetch failed');
				return response.json();
			});
		} catch (error) {
			console.error('Balance fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch cached LP pool values
	 */
	async getLpPools(tokenIds) {
		const ids = [...new Set((tokenIds || []).filter(Boolean))];
		const batchSize = 40;
		const batches = [];

		for (let i = 0; i < ids.length; i += batchSize) {
			batches.push(ids.slice(i, i + batchSize));
		}

		const responses = await Promise.all(batches.map(async batch => {
			const response = await fetch(ERGEXPLORER_API_HOST + 'tokens/getLpPools?ids=' + encodeURIComponent(batch.join(',')));
			if (!response.ok) throw new Error('LP pools fetch failed');
			return response.json();
		}));

		return responses.reduce((merged, response) => {
			const items = response && response.items ? response.items : {};
			merged.items = Object.assign(merged.items, items);
			merged.total += Object.keys(items).length;
			return merged;
		}, { items: {}, total: 0 });
	},

	/**
	 * Fetch unspent boxes
	 */
	async getUnspentBoxes(boxOffset = AddressState.unspentBoxesOffset, limit = AddressState.unspentBoxesPageSize) {
		try {
			return await fetchWithTimeout(this.getUnspentBoxesDataUrl(boxOffset, limit), DATA_FETCH_TIMEOUT_MS, async (response) => {
				if (!response.ok) throw new Error('Unspent boxes fetch failed');
				return response.json();
			});
		} catch (error) {
			console.error('Unspent boxes fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch chart data for address statistics
	 */
	getChartData(tokenId) {
		return new Promise((resolve, reject) => {
			let url = ERGEXPLORER_API_HOST + 'user/getAddressStats?address=' + AddressState.walletAddress + '&tokenId=' + tokenId + '&type=1';

			if (FilterState.fromDate) url += '&fromDate=' + FilterState.fromDate;
			if (FilterState.toDate) url += '&toDate=' + FilterState.toDate;

			$.get(url, (data) => resolve(data))
				.fail(() => reject(new Error('Chart data fetch failed')));
		});
	},

	/**
	 * Fetch Ergopad vesting data
	 */
	getErgopadVesting() {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: 'POST',
				url: 'https://api.ergopad.io/vesting/v2/',
				data: JSON.stringify({ addresses: [AddressState.walletAddress] }),
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				success: (data) => resolve(data),
				error: () => reject(new Error('Ergopad vesting fetch failed'))
			});
		});
	},

	/**
	 * Fetch Ergopad staking data
	 */
	getErgopadStaking() {
		return new Promise((resolve, reject) => {
			$.ajax({
				type: 'POST',
				url: 'https://api.ergopad.io/staking/staked-all/',
				data: JSON.stringify({ addresses: [AddressState.walletAddress] }),
				contentType: 'application/json; charset=utf-8',
				dataType: 'json',
				success: (data) => resolve(data),
				error: () => reject(new Error('Ergopad staking fetch failed'))
			});
		});
	}
};
