import { TokenState } from './state.js';

export const TokenApiClient = {
	// Fetch supply info from Crux Finance
	async getCruxData() {
		return new Promise((resolve) => {
			$.get('https://api.cruxfinance.io/crux/token_info/' + TokenState.tokenId, function (data) {
				TokenState.amountsData = data;
				resolve(data);
			}).fail(function(error) {
				console.error('Error fetching Crux data:', error);
				resolve(null);
			}).always(function() {
				// Call getPrices from prices.js if available
				if (typeof getPrices === 'function') {
					getPrices(() => {
						// Price data loaded, trigger chart display if we have price history
						console.log('Prices loaded, checking for price history data');

						// Import and call chart display if price history is loaded
						import('./ui-controllers.js').then(module => {
							if (TokenState.priceData && TokenState.priceData.length > 0) {
								console.log('Price history available, displaying chart');
								module.TokenUIControllers.printGainersLosers(0);
							}
						});
					}, true);
				}
			});
		});
	},

	// Fetch transactions for token
	async getTxsData() {
		return new Promise((resolve) => {
			if (!TokenState.tokenId) {
				console.warn('Token ID not set for transactions');
				resolve([]);
				return;
			}

			const url = 'https://api.ergexplorer.com/tokens/getTransactions?offset=0&limit=10&tokenId=' + encodeURIComponent(TokenState.tokenId);
			console.log('Fetching TXs from:', url);

			$.get(url, function (data) {
				resolve((data && data.items) ? data.items : []);
			}).fail(function (error) {
				console.error('Error fetching transactions:', error);
				resolve([]); // Resolve with empty instead of rejecting
			});
		});
	},

	// Fetch swaps for token
	async getSwapsData() {
		return new Promise((resolve) => {
			if (!TokenState.tokenId) {
				console.warn('Token ID not set for swaps');
				resolve([]);
				return;
			}

			const url = 'https://api.mewfinance.com/dex/getSwapsByTokenId?tokenId=' + encodeURIComponent(TokenState.tokenId);
			console.log('Fetching swaps from:', url);

			$.get(url, function (data) {
				resolve((data && data.items) ? data.items : []);
			}).fail(function (error) {
				console.error('Error fetching swaps:', error);
				resolve([]); // Resolve with empty instead of rejecting
			});
		});
	},

	// Get price history for chart
	async getPriceHistory() {
		return new Promise((resolve) => {
			if (!TokenState.tokenData || !TokenState.tokenData.name) {
				console.warn('Token data not loaded yet');
				resolve();
				return;
			}

			$.post('https://api2.ergexplorer.com/tokens/getPriceHistoryNew',
				{ from: TokenState.from30d, ids: [TokenState.tokenData.name] },
				function(data) {
					if (data && data.length > 0 && data[0].length > 0) {
						TokenState.priceData = data;
						TokenState.hasPrice = true;
					}
					$('#priceLoading').hide();
					resolve(data);
				}
			).fail(function(error) {
				console.error('Error fetching price history:', error);
				$('#priceLoading').hide();
				resolve(null);
			});
		});
	},

	// Get holders from ergo.watch
	async getHolders() {
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				console.log('Holders timeout, trying fallback');
				this.getHoldersFallback().then(resolve).catch(reject);
			}, 2000);

			$.ajax({
				url: 'https://api.ergo.watch/lists/addresses/by/balance?token_id=' + TokenState.tokenId + '&limit=10',
				success: function (data) {
					if (timeout) {
						clearTimeout(timeout);
					}
					resolve(data || []);
				},
				error: function (xhr, status, error) {
					if (timeout) {
						clearTimeout(timeout);
					}
					console.error('Error fetching holders:', status, error);
					reject(error);
				}
			});
		});
	},

	// Get holder count from ergo.watch
	async getHolderCount() {
		return new Promise((resolve, reject) => {
			let timeout = setTimeout(() => {
				console.log('Holder count timeout, trying fallback');
				this.getHolderCountFallback().then(resolve).catch(reject);
			}, 2000);

			$.ajax({
				url: 'https://api.ergo.watch/p2pk/count?token_id=' + TokenState.tokenId,
				success: function (data) {
					if (timeout) {
						clearTimeout(timeout);
					}
					resolve(data);
				},
				error: function (xhr, status, error) {
					if (timeout) {
						clearTimeout(timeout);
					}
					console.error('Error fetching holder count:', status, error);
					reject(error);
				}
			});
		});
	},

	// Fallback for holders data
	async getHoldersFallback() {
		return new Promise((resolve) => {
			const apiHost = typeof ERGEXPLORER_API_HOST !== 'undefined' ? ERGEXPLORER_API_HOST : 'https://api.ergexplorer.com/';
			$.get(apiHost + 'tokens/getHolders?id=' + TokenState.tokenId, function (data) {
				resolve(data && data.items ? data.items : []);
			}).fail(function (error) {
				console.error('Error fetching holders (fallback):', error);
				resolve([]);
			});
		});
	},

	// Fallback for holder count
	async getHolderCountFallback() {
		return new Promise((resolve) => {
			const apiHost = typeof ERGEXPLORER_API_HOST !== 'undefined' ? ERGEXPLORER_API_HOST : 'https://api.ergexplorer.com/';
			$.get(apiHost + 'tokens/getHolderCount?id=' + TokenState.tokenId, function (data) {
				resolve(data);
			}).fail(function (error) {
				console.error('Error fetching holder count (fallback):', error);
				resolve(null);
			});
		});
	},

	// Check addressbook for token addresses
	checkAddressbook() {
		const apiHost = typeof ERGEXPLORER_API_HOST !== 'undefined' ? ERGEXPLORER_API_HOST : 'https://api.ergexplorer.com/';
		$.get(apiHost + 'addressbook/getTokenAddresses?tokenId=' + TokenState.tokenId, function (data) {
			if (data && data.total > 0) {
				let formattedData = '';

				for (let i = 0; i < data.items.length; i++) {
					let addressData = data.items[i];
					if (typeof TokenUIDisplay !== 'undefined' && typeof TokenUIDisplay.printAddressbookAddress === 'function') {
						formattedData += TokenUIDisplay.printAddressbookAddress(addressData, i == 0, i == data.items.length - 1);
					}
				}

				$('#addressbookInfoHolder').html(formattedData);
				$('#addressbookInfo').show();

				if (data.items[0].url != '') {
					$('#addressbookUrl').html('<strong class="">URL:</strong> <a target="_new" href="' + data.items[0].url + '">' + data.items[0].url + '</a>');
					$('#addressbookUrl').show();
				}
			}
		}).fail(function(error) {
			console.error('Error checking addressbook:', error);
		});
	}
};
