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

		const burnAddress = '2Z4YBkDsDvQj5BXnqYJGQyJmF4MfT4HRwBBWNcHBd6WD7VN1TY9o1Q2uMrvnM46F9';

		// Use the TokenApiClient to get holders and check if all are burn address
		const TokenApiClient = await import('./api-client.js').then(m => m.TokenApiClient);

		try {
			const holders = await TokenApiClient.getHolders();

			if (holders && holders.length > 0) {
				let allBurned = true;
				for (let holder of holders) {
					if (holder.address !== burnAddress) {
						allBurned = false;
						break;
					}
				}

				if (allBurned) {
					$('#tokenBurned').show();
					$('#nftCurrentAddressHolder').remove();
					this.getBurnTx();
				}
			}
		} catch (error) {
			console.error('Error checking if burned:', error);
		}
	},

	// Get transaction that burned the token
	getBurnTx() {
		if (!TokenState.tokenData) return;

		const burnAddress = '2Z4YBkDsDvQj5BXnqYJGQyJmF4MfT4HRwBBWNcHBd6WD7VN1TY9o1Q2uMrvnM46F9';

		const xhr = $.ajax({
			url: 'https://api.ergexplorer.com/addresses/' + burnAddress + '/transactions?offset=0&limit=100',
			type: 'GET',
			async: true,
			dataType: 'json',
			success: (data) => {
				if (data && data.items) {
					for (let tx of data.items) {
						// Check if this tx involves our token
						let found = false;
						if (tx.outputs) {
							for (let output of tx.outputs) {
								if (output.tokenId === TokenState.tokenId) {
									found = true;
									break;
								}
							}
						}

						if (found) {
							$('#burnTxId').html('<a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(tx.id) : '#') + '">' + tx.id + '</a>');
							$('#burnTxIdRow').show();
							break;
						}
					}
				}
			},
			error: (error) => {
				console.error('Error getting burn tx:', error);
			}
		});
	}
};
