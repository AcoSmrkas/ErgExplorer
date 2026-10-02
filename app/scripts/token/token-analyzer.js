import { TokenState } from './state.js';

// Our node's index (mainnet only). It lists a token's boxes newest first.
const INDEXED_NODE_HOST = 'https://chain.mewfinance.com/';

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

	// Get transaction that burned the token: the one that spent its newest box.
	// Ask the node — the explorer doesn't list boxes in chain order, so its
	// last box can be an earlier hop (Bubble Heads #43 showed 18b60f98…, an
	// earlier transfer, instead of e68c4ba7…).
	getBurnTx() {
		if (!TokenState.tokenData) return;

		const tokenId = TokenState.tokenId;
		const showBurnTx = function(box) {
			if (!box.spentTransactionId) return;

			$('[id="nftBurnTransaction"]').html('<p><a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(box.spentTransactionId) : '#') + '">' + box.spentTransactionId + '</a></p>');
			$('[id="nftBurnTransactionHolder"]').show();
			TokenAnalyzer.reapplyNftInfoStriping();
		};

		if (typeof networkType === 'undefined' || networkType != 'testnet') {
			$.get(INDEXED_NODE_HOST + 'blockchain/box/byTokenId/' + tokenId + '?offset=0&limit=1', function(data) {
				if (data && data.items && data.items.length > 0) showBurnTx(data.items[0]);
			});
			return;
		}

		// Testnet has no indexed node of ours: take the explorer's last box.
		const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
		const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';

		$.get(baseUrl + 'boxes/byTokenId/' + tokenId + '?limit=1', function(data) {
			if (data && data.total > 0) {
				$.get(baseUrl + 'boxes/byTokenId/' + tokenId + '?limit=1&offset=' + (data.total - 1), function(data) {
					if (data && data.items && data.items.length > 0) showBurnTx(data.items[0]);
				});
			}
		});
	},

	// Get the current address holding a 1/1 NFT: the address of its unspent box.
	// (The explorer's last box can be an earlier hop, see getBurnTx.)
	getCurrentAddress() {
		const tokenId = TokenState.tokenId;
		const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
		const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';
		const url = (typeof networkType === 'undefined' || networkType != 'testnet')
			? INDEXED_NODE_HOST + 'blockchain/box/unspent/byTokenId/' + tokenId + '?offset=0&limit=1'
			: baseUrl + 'boxes/unspent/byTokenId/' + tokenId + '?limit=1';

		$.get(url, function(data) {
			// The node returns a plain array, the explorer { items, total }
			const boxes = Array.isArray(data) ? data : (data && data.items);
			if (!boxes || boxes.length === 0) return;

			const currentAddress = boxes[0].address;
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
			console.log('Failed to fetch current address.');
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



