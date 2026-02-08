import { TokenState } from './state.js';

export const TokenAnalyzer = {
	// Calculate the amount transferred in a transaction
	calculateTransferredAmount(tx) {
		const addressInputSums = {};
		const addressOutputSums = {};

		// Sum inputs by address
		if (tx.inputs) {
			for (const input of tx.inputs) {
				const addr = input.address;
				addressInputSums[addr] = (addressInputSums[addr] || 0) + input.value;
			}
		}

		// Sum outputs by address
		if (tx.outputs) {
			for (const output of tx.outputs) {
				const addr = output.address;
				addressOutputSums[addr] = (addressOutputSums[addr] || 0) + output.value;
			}
		}

		let totalTransferred = 0;

		// For each address that had inputs (sent funds)
		for (const addr in addressInputSums) {
			const inputSum = addressInputSums[addr];
			const outputSum = addressOutputSums[addr] || 0;
			const netSent = inputSum - outputSum;

			if (netSent > 0) {
				totalTransferred += netSent;
			}
		}

		if (Object.keys(addressInputSums).length == 0) {
			totalTransferred = addressOutputSums[Object.keys(addressOutputSums)[0]] || 0;
		}

		return totalTransferred;
	},

	// Check if token is burned
	async checkIfBurned() {
		if (!TokenState.tokenData) return;

		const tokenId = TokenState.tokenId;
		const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
		
		// Fix potential double slash
		const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';

		$.get(baseUrl + 'boxes/unspent/byTokenId/' + tokenId, function(data) {
			if (data && data.total == 0) {
				$('[id="tokenBurned"]').show();
				$('[id="nftCurrentAddressHolder"]').remove();
				
				const ergExplorerHost = typeof ERGEXPLORER_API_HOST !== 'undefined' ? ERGEXPLORER_API_HOST : 'https://api.ergexplorer.com/';
				$.get(ergExplorerHost + 'tokens/updateSingle?id=' + tokenId);
				TokenAnalyzer.getBurnTx();
			} else {		
				$('[id="nftBurnTransactionHolder"]').remove();
			}
			TokenAnalyzer.reapplyNftInfoStriping();
		}).fail(function(err) {
			console.error('Error checking if burned:', err);
		});
	},

	// Get transaction that burned the token
	getBurnTx() {
		if (!TokenState.tokenData) return;

		const tokenId = TokenState.tokenId;
		const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
		const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';

		// We need to find where it was burned. Original logic used boxes/byTokenId
		$.get(baseUrl + 'boxes/byTokenId/' + tokenId + '?limit=100', function(data) {
			if (data && data.total > 0) {
				const txOffset = data.total - 1;
				$.get(baseUrl + 'boxes/byTokenId/' + tokenId + '?offset=' + txOffset, function(data) {
					if (data && data.items && data.items.length > 0) {
						const box = data.items[0];
						if (box.spentTransactionId) {
							$('[id="nftBurnTransaction"]').html('<p><a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(box.spentTransactionId) : '#') + '">' + box.spentTransactionId + '</a></p>');
							$('[id="nftBurnTransactionHolder"]').show();
							TokenAnalyzer.reapplyNftInfoStriping();
						}
					}
				});
			}
		});
	},

	// Get the current address holding a 1/1 NFT
	getCurrentAddress() {
		const tokenId = TokenState.tokenId;
		const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
		const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';

		$.get(baseUrl + 'boxes/byTokenId/' + tokenId, function(data) {
			if (!data || data.total == 0) return;

			let txOffset = data.total - 1;
			$.get(baseUrl + 'boxes/byTokenId/' + tokenId + '?offset=' + txOffset, function(data) {
				if (!data || !data.items || data.items.length === 0) return;
				
				const currentAddress = data.items[0].address;
				TokenState.currentAddress = currentAddress;

				if (typeof addAddress === 'function') addAddress(currentAddress);
				
				// Use more robust selectors that work even if there are duplicates or if one is removed
				const addressHtml = '<p><a class="address-string" addr="' + currentAddress + '" href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(currentAddress) : '#') + '">' + (typeof formatLongAddressString === 'function' ? formatLongAddressString(currentAddress) : currentAddress) + '</a></p>';
				
				// Update all possible holders
				$('[id="nftCurrentAddress"]').html(addressHtml);
				$('[id="nftCurrentAddressHolder"]').show();
				TokenAnalyzer.reapplyNftInfoStriping();

				// Special Mew Mart listing check
				const mewMartAddresses = [
					'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'
				];

				if (mewMartAddresses.includes(currentAddress)) {
					const mewMartHtml = '<p>Available for purchase on <a class="erg-span" target="_new" href="https://mart.mewfinance.com/explore?tokenId=' + tokenId + '">Mew Mart</a></p>';
					$('[id="nftAuction"]').each(function() {
						$(this).html(mewMartHtml + ($(this).html() || ''));
					});
				}

				if (typeof getAddressesInfo === 'function') getAddressesInfo();
			}).fail(function() {
				console.log('Failed to fetch current address (2).');
			});
		}).fail(function() {
			console.log('Failed to fetch current address. (1)');
		});
	},

	// Helper to re-apply striping to visible rows in NFT/Token info sections
	reapplyNftInfoStriping() {
		$('[id="nftInfoHolder"], [id="nftCollectionDataHolder"]').each(function() {
			$(this).find('> div:visible').each(function(index) {
				$(this).css('background-color', index % 2 === 0 ? 'var(--striped-1)' : 'transparent');
			});
		});
	}
};



