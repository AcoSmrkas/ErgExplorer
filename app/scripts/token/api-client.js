import { TokenState } from './state.js';
import { TokenAnalyzer } from './token-analyzer.js?v=3';

const TOKEN_TXS_GATEWAY = 'https://chain.mewfinance.com/';
const TOKEN_TXS_LIMIT = 10;
// Boxes to look through for that many transfers: one tx often makes several of them
const TOKEN_TXS_BOXES = 50;
// At most this many transactions are fetched, ten at a time, for a token whose boxes rarely move it
const TOKEN_TXS_MAX_LOOKUPS = 30;

function getJson(url) {
	return $.ajax({ url: url, dataType: 'json', timeout: 10000 });
}

// A node transaction in the shape the transactions table reads: the token's boxes only, each with
// its amount of the token as value
function toTokenTx(tx) {
	if (!tx) return null;

	const tokenBoxes = boxes => (boxes || [])
		.map(box => ({
			box_id: box.boxId,
			address: getBoxAddress(box),
			value: (box.assets || []).filter(asset => asset.tokenId === TokenState.tokenId).reduce((sum, asset) => sum + Number(asset.amount), 0)
		}))
		.filter(box => box.value > 0);

	return {
		txId: tx.id,
		blockHeight: tx.inclusionHeight,
		blockId: tx.blockId,
		timestamp: tx.timestamp,
		inputs: tokenBoxes(tx.inputs),
		outputs: tokenBoxes(tx.outputs)
	};
}

export const TokenApiClient = {
	// Fetch supply info from Crux Finance
	async getCruxData() {
		return new Promise((resolve) => {
			// Crux is currently unreachable; without a timeout a hung XHR stalls
			// the getPrices() call chained below for the browser's full timeout.
			$.ajax({
				url: 'https://api.cruxfinance.io/crux/token_info/' + TokenState.tokenId,
				type: 'GET',
				dataType: 'json',
				timeout: 8000,
				success: function (data) {
					TokenState.amountsData = data;
					resolve(data);
				}
			}).fail(function(error) {
				console.error('Error fetching Crux data:', error);
				resolve(null);
			}).always(function() {
				// Call getPrices from prices.js if available
				if (typeof getPrices === 'function') {
					getPrices(() => {
						// Price data loaded, trigger chart display if we have price history
						console.log('Prices loaded, checking for price history data');

						// Refresh UI components that depend on prices
						import('./ui-display.js?v=4').then(module => {
							if (TokenState.amountsData) module.TokenUIDisplay.printSupplyInfo();
							if (TokenState.holders && TokenState.holders.length > 0) module.TokenUIDisplay.printHolders(TokenState.holders);
							if (TokenState.txs && TokenState.txs.length > 0) module.TokenUIDisplay.printTxs(TokenState.txs);
							if (TokenState.swaps && TokenState.swaps.length > 0) module.TokenUIDisplay.printSwaps(TokenState.swaps);
						});

						// Import and call chart display if price history is loaded
						import('./ui-controllers.js?v=4').then(module => {
							module.TokenUIControllers.setLinks();

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

	// The token's latest transfers. api.ergexplorer.com/tokens/getTransactions served these from an
	// indexer database that is gone (the endpoint now answers empty), so they come from the indexed
	// nodes instead: the newest boxes holding the token, then each transaction that made them. Only
	// boxes holding the token count as its inputs and outputs, as before, and a transaction that moves
	// none of it (a contract updating its own box) is left out.
	async getTxsData() {
		if (!TokenState.tokenId) {
			console.warn('Token ID not set for transactions');
			return [];
		}

		try {
			const boxes = await getJson(TOKEN_TXS_GATEWAY + 'blockchain/box/byTokenId/' + encodeURIComponent(TokenState.tokenId) + '?offset=0&limit=' + TOKEN_TXS_BOXES + '&sortDirection=desc');
			// The node index lists some boxes twice: one id per transaction, newest first
			const txIds = [...new Set((boxes.items || []).map(box => box.transactionId))];
			const items = [];

			for (let i = 0; i < Math.min(txIds.length, TOKEN_TXS_MAX_LOOKUPS) && items.length < TOKEN_TXS_LIMIT; i += TOKEN_TXS_LIMIT) {
				const txs = await Promise.all(txIds.slice(i, i + TOKEN_TXS_LIMIT).map(id =>
					getJson(TOKEN_TXS_GATEWAY + 'blockchain/transaction/byId/' + id).catch(() => null)));

				txs.map(toTokenTx).filter(item => item && TokenAnalyzer.calculateTransferredAmount(item) != 0).forEach(item => items.push(item));
			}

			TokenState.txs = items.slice(0, TOKEN_TXS_LIMIT);
			return TokenState.txs;
		} catch (error) {
			console.error('Error fetching transactions:', error);
			return [];
		}
	},

	// Fetch swaps for token
	async getSwapsData() {
		return new Promise((resolve) => {
			if (!TokenState.tokenId) {
				console.warn('Token ID not set for swaps');
				resolve([]);
				return;
			}

			if (TokenState.isLpToken) {
				resolve([]);
				return;
			}

			const url = 'https://api.mewfinance.com/dex/getSwapsByTokenId?tokenId=' + encodeURIComponent(TokenState.tokenId);
			console.log('Fetching swaps from:', url);

			$.get(url, function (data) {
				const items = (data && data.items) ? data.items : [];
				TokenState.swaps = items;
				resolve(items);
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

			// tokenId picks the token exactly (names collide); full asks for 24h, 7d, 30d, 1y and all
			$.post('https://api2.ergexplorer.com/tokens/getPriceHistoryNew',
				{ tokenId: TokenState.tokenId, ids: [TokenState.tokenData.name], full: true },
				function(data) {
					if (data && data.length > 0 && data[0].length > 0) {
						TokenState.priceData = data;
						TokenState.hasPrice = true;
					} else {
						TokenState.hasPrice = false;
					}
					$('#priceLoading').hide();
					resolve(data);
				}
			).fail(function(error) {
				console.error('Error fetching price history:', error);
				TokenState.hasPrice = false;
				$('#priceLoading').hide();
				resolve(null);
			});
		});
	},

	// Get holders from ergo.watch
	async getHolders() {
		return new Promise((resolve, reject) => {
			const tokenId = TokenState.tokenId;
			if (!tokenId) {
				resolve([]);
				return;
			}

			let timeout = setTimeout(() => {
				console.log('Holders timeout, trying fallback');
				this.getHoldersFallback().then(resolve).catch(reject);
			}, 2000);

			$.ajax({
				url: 'https://api.ergo.watch/lists/addresses/by/balance?token_id=' + tokenId + '&limit=10',
				success: function (data) {
					if (timeout) {
						clearTimeout(timeout);
					}
					const items = data || [];
					TokenState.holders = items;
					resolve(items);
				},
				error: function (xhr, status, error) {
					if (timeout) {
						clearTimeout(timeout);
					}
					console.error('Error fetching holders:', status, error);
					this.getHoldersFallback().then(resolve).catch(reject);
				}.bind(this)
			});
		});
	},

	// Get holder count from ergo.watch
	async getHolderCount() {
		return new Promise((resolve, reject) => {
			const tokenId = TokenState.tokenId;
			if (!tokenId) {
				resolve(0);
				return;
			}

			let timeout = setTimeout(() => {
				console.log('Holder count timeout, trying fallback');
				this.getHolderCountFallback().then(resolve).catch(reject);
			}, 2000);

			$.ajax({
				url: 'https://api.ergo.watch/p2pk/count?token_id=' + tokenId,
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
					this.getHolderCountFallback().then(resolve).catch(reject);
				}.bind(this)
			});
		});
	},

	// Fallback for holders data
	async getHoldersFallback() {
		return new Promise((resolve) => {
			const apiHost = typeof ERGEXPLORER_API_HOST !== 'undefined' ? ERGEXPLORER_API_HOST : 'https://api.ergexplorer.com/';
			$.get(apiHost + 'tokens/getHolders?id=' + TokenState.tokenId, function (data) {
				const items = data && data.items ? data.items : [];
				TokenState.holders = items;
				resolve(items);
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
