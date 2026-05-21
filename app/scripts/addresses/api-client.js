import { AddressState, FilterState } from './state.js';

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
			const response = await fetch(this.getMempoolUrl());
			if (!response.ok) throw new Error('Mempool fetch failed');

			const arrayBuffer = await response.arrayBuffer();
			const buffer = new TextDecoder('utf-8').decode(arrayBuffer);
			const data = JSONbig.parse(buffer);

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
	 * Fetch transactions data with retry fallback
	 */
	async getTransactionsData(attempt = 1) {
		try {
			const url = this.getTxsDataUrl(attempt);

			const response = await fetch(url);
			if (!response.ok) throw new Error('Transactions fetch failed');

			const arrayBuffer = await response.arrayBuffer();
			const buffer = new TextDecoder('utf-8').decode(arrayBuffer);
			const data = JSONbig.parse(buffer);

			AddressState.transactionsData = data;

			return data;
		} catch (error) {
			if (attempt === 1) {
				console.warn('Primary API failed, trying fallback...');
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
			const response = await fetch(this.getTxsUrl());
			if (!response.ok) throw new Error('Balance fetch failed');
			return await response.json();
		} catch (error) {
			console.error('Balance fetch failed:', error);
			throw error;
		}
	},

	/**
	 * Fetch token metadata
	 */
	async getTokenInfo(tokenId) {
		const response = await fetch(API_HOST_2 + 'tokens/' + tokenId);
		if (!response.ok) throw new Error('Token info fetch failed');
		return response.json();
	},

	/**
	 * Fetch unspent boxes containing token
	 */
	async getUnspentBoxesByTokenId(tokenId, limit = 100) {
		const response = await fetch(API_HOST_2 + 'boxes/unspent/byTokenId/' + tokenId + '?limit=' + limit);
		if (!response.ok) throw new Error('Token boxes fetch failed');
		return response.json();
	},

	/**
	 * Fetch Crux token info, including value in ERG
	 */
	async getCruxTokenInfo(tokenId) {
		const response = await fetch('https://api.cruxfinance.io/crux/token_info/' + tokenId);
		if (!response.ok) throw new Error('Crux token info fetch failed');
		return response.json();
	},

	/**
	 * Fetch Spectrum token rows, including liquidity
	 */
	async getSpectrumTokenList(nameFilter) {
		const response = await fetch('https://api.cruxfinance.io/spectrum/token_list', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				sort_by: 'Volume',
				sort_order: 'Desc',
				limit: 10,
				offset: 0,
				filter_window: 'Day',
				name_filter: nameFilter || ''
			})
		});
		if (!response.ok) throw new Error('Spectrum token list fetch failed');
		return response.json();
	},

	/**
	 * Fetch unspent boxes
	 */
	async getUnspentBoxes(boxOffset = AddressState.unspentBoxesOffset, limit = AddressState.unspentBoxesPageSize) {
		try {
			const response = await fetch(this.getUnspentBoxesDataUrl(boxOffset, limit));
			if (!response.ok) throw new Error('Unspent boxes fetch failed');
			return await response.json();
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
