import { AddressState } from './state.js';

// How long a source gets before the next one is asked too. Warm, both explorers answer in
// 0.1-1 s; cold, a busy address took sigmaspace 2-20 s and api.ergoplatform 1-9 s.
const HEDGE_AFTER_MS = 1500;
// Per tx-list source. A cold sigmaspace answered a 376k-tx address in 20.6 s and 29.9 s while
// api.ergoplatform 503'd after 30 s, so a shorter cap turns slow into "no transactions".
const TX_FETCH_TIMEOUT_MS = 45000;
// Other address data fetches (mempool, balance, unspent boxes) abort after this to avoid hanging.
const DATA_FETCH_TIMEOUT_MS = 15000;
// An indexed node: same /blockchain/balance as the explorer's balance/total (ERG, token ids,
// amounts and decimals matched on a 2,236-token address), and often faster when that is cold.
const INDEXED_NODE_HOST = 'https://node.sigmaspace.io/';

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
 * Ask the sources in order, the next one also when nothing has answered after HEDGE_AFTER_MS
 * or as soon as every source asked so far has failed. The first good answer wins and the others
 * are aborted. A slow source is not cancelled to make room for the next: it may still be first.
 * Each source is { url, init, read }; `read` returns the data or throws on a bad answer.
 */
function fetchFirst(sources, timeoutMs) {
	return new Promise((resolve, reject) => {
		const controllers = [];
		let started = 0;
		let failed = 0;
		let done = false;
		let hedgeTimer;

		const finish = () => {
			done = true;
			clearTimeout(hedgeTimer);
			controllers.forEach(controller => controller.abort());
		};

		const startNext = () => {
			if (done || started >= sources.length) return;

			const source = sources[started++];
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), timeoutMs);
			controllers.push(controller);

			clearTimeout(hedgeTimer);
			hedgeTimer = setTimeout(startNext, HEDGE_AFTER_MS);

			fetch(source.url, Object.assign({}, source.init, { signal: controller.signal }))
				.then(source.read)
				.then(data => {
					if (done) return;
					finish();
					resolve(data);
				}, error => {
					if (done) return;
					console.warn('Address data source failed: ' + source.url, error);
					if (++failed === sources.length) {
						finish();
						reject(error);
					} else {
						startNext();
					}
				})
				.finally(() => clearTimeout(timer));
		};

		startNext();
	});
}

async function readItemsBigJson(response) {
	if (!response.ok) throw new Error('HTTP ' + response.status);
	const buffer = new TextDecoder('utf-8').decode(await response.arrayBuffer());
	const data = JSONbig.parse(buffer);
	// sigmaspace can answer HTTP 200 with an error body
	if (!data || !Array.isArray(data.items)) throw new Error('No items in answer');
	return data;
}

async function readBalance(response) {
	if (!response.ok) throw new Error('HTTP ' + response.status);
	const data = await response.json();
	if (!data || !data.confirmed || !Array.isArray(data.confirmed.tokens)) throw new Error('No balance in answer');
	return data;
}

/**
 * API client for address page data fetching
 * Wraps jQuery $.get/$.ajax and fetch calls for cleaner API
 */
export const ApiClient = {
	// First-load requests started by prefetch(), by request key. Each is handed out once;
	// later calls (the 60s refresh, paging) fetch fresh.
	_prefetched: new Map(),

	/**
	 * Start the first load's chain requests now. They need none of the scam list, token icons
	 * or prices, only the rendering does, and used to wait 1.2-1.6 s behind those.
	 */
	prefetch({ mempool }) {
		const requests = [
			['summary', this._fetchAddressSummary()],
			['transactions', this._fetchTransactionsData()],
			[this._unspentBoxesKey(AddressState.unspentBoxesOffset, AddressState.unspentBoxesPageSize),
				this._fetchUnspentBoxes(AddressState.unspentBoxesOffset, AddressState.unspentBoxesPageSize)]
		];
		if (mempool) {
			requests.push(['mempool', this._fetchMempoolData()]);
		}

		requests.forEach(([key, promise]) => {
			// The consumer handles a failure; this only keeps it from being reported as unhandled meanwhile.
			promise.catch(() => {});
			this._prefetched.set(key, promise);
		});
	},

	_takePrefetched(key) {
		const promise = this._prefetched.get(key);
		this._prefetched.delete(key);
		return promise;
	},

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
	 * Transactions page URLs, in the order they are asked (see fetchFirst)
	 */
	getTxsDataUrls() {
		const query = '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE;

		if (networkType === 'testnet') {
			return [API_HOST + 'api/v1/addresses/' + AddressState.walletAddress + query];
		}

		return [
			'https://api.sigmaspace.io/api/v1/addresses/' + AddressState.walletAddress + query,
			API_HOST_2 + 'addresses/' + AddressState.walletAddress + query
		];
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
	 * Our node's pending txs for this address (see mergeMempoolItems in main.js)
	 */
	getOwnMempoolUrl() {
		if (!MEMPOOL_API_HOST) return null;
		return MEMPOOL_API_HOST + 'transactions/byAddress/' + AddressState.walletAddress;
	},

	/**
	 * Fetch pending txs from every mempool source and merge them.
	 * Rejects only if all sources fail.
	 */
	async fetchMempool() {
		const ownUrl = this.getOwnMempoolUrl();
		const urls = [ownUrl, this.getMempoolUrl()].filter(Boolean);

		const results = await Promise.allSettled(urls.map(url =>
			fetchWithTimeout(url, DATA_FETCH_TIMEOUT_MS, async (response) => {
				if (!response.ok) throw new Error('Mempool fetch failed: ' + url);
				const arrayBuffer = await response.arrayBuffer();
				const buffer = new TextDecoder('utf-8').decode(arrayBuffer);
				return JSONbig.parse(buffer);
			})
		));

		const pages = results.map(result =>
			result.status === 'fulfilled' && result.value && Array.isArray(result.value.items) ? result.value : null);
		const answered = pages.filter(Boolean);

		if (answered.length === 0) {
			throw new Error('Mempool fetch failed');
		}

		const data = mergeMempoolItems(answered.map(page => page.items));

		// For pending-tracker.js: every tx a source lists (the merge keeps one side of a double-spend),
		data.ids = new Set(answered.flatMap(page => page.items.map(tx => tx.id)));
		// what our node holds (null on testnet or when it failed to answer),
		data.ownIds = ownUrl && pages[0] ? new Set(pages[0].items.map(tx => tx.id)) : null;
		// and whether that is everything: a failed source, a paged list, or the explorer's
		// `items: []` with `total > 0` would hide txs that are still pending.
		data.complete = answered.length === urls.length && answered.every(page => page.items.length >= Number(page.total || 0));

		return data;
	},

	/**
	 * Fetch mempool data
	 */
	async getMempoolData() {
		return this._takePrefetched('mempool') || this._fetchMempoolData();
	},

	async _fetchMempoolData() {
		let data;

		try {
			data = await this.fetchMempool();
		} catch (error) {
			// Don't let a mempool outage hide the confirmed history.
			console.error('Mempool fetch failed:', error);
			data = { items: [], total: 0 };
		}

		AddressState.mempoolData = data;

		return data;
	},

	/**
	 * A tx as an indexer has it once it is in a block, or null while no indexer knows it
	 * (still pending, its block not indexed yet, or dropped).
	 */
	async getConfirmedTransaction(txId) {
		const urls = networkType === 'testnet'
			? [API_HOST + 'api/v1/transactions/' + txId]
			: [API_HOST_2 + 'transactions/' + txId, 'https://api.sigmaspace.io/api/v1/transactions/' + txId];

		const results = await Promise.allSettled(urls.map(url =>
			fetchWithTimeout(url, DATA_FETCH_TIMEOUT_MS, async (response) => {
				return response.ok ? response.json() : null;
			})
		));

		// sigmaspace answers an unknown id with HTTP 200 and an error body, hence the id check
		const found = results.find(result => result.status === 'fulfilled' && result.value &&
			result.value.id === txId && result.value.blockId);

		return found ? found.value : null;
	},

	/**
	 * Fetch a page of the address's transactions: sigmaspace first, the explorer too if
	 * sigmaspace is slow or fails (fetchFirst).
	 */
	async getTransactionsData() {
		return this._takePrefetched('transactions') || this._fetchTransactionsData();
	},

	async _fetchTransactionsData() {
		try {
			const sources = this.getTxsDataUrls().map(url => ({ url, read: readItemsBigJson }));
			const data = await fetchFirst(sources, TX_FETCH_TIMEOUT_MS);

			AddressState.transactionsData = data;

			return data;
		} catch (error) {
			console.error('Transactions fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch balance summary: the explorer first, an indexed node too if the explorer is slow
	 * or fails (fetchFirst). Both answer { confirmed: { nanoErgs, tokens }, unconfirmed }.
	 */
	async getAddressSummary() {
		return this._takePrefetched('summary') || this._fetchAddressSummary();
	},

	async _fetchAddressSummary() {
		const sources = [{ url: this.getTxsUrl(), read: readBalance }];

		if (networkType !== 'testnet') {
			sources.push({
				url: INDEXED_NODE_HOST + 'blockchain/balance',
				// text/plain keeps it a simple request: no CORS preflight
				init: { method: 'POST', body: AddressState.walletAddress, headers: { 'Content-Type': 'text/plain' } },
				read: readBalance
			});
		}

		try {
			return await fetchFirst(sources, DATA_FETCH_TIMEOUT_MS);
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
		return this._takePrefetched(this._unspentBoxesKey(boxOffset, limit)) || this._fetchUnspentBoxes(boxOffset, limit);
	},

	_unspentBoxesKey(boxOffset, limit) {
		return 'unspentBoxes:' + boxOffset + ':' + limit;
	},

	async _fetchUnspentBoxes(boxOffset, limit) {
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
