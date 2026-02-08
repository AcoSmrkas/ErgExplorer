import { AddressState } from './state.js';
import { TxType, TxInOut, AddressType } from './constants.js';
import { getTxType, getTxInOutType, analyzeTransfers } from './transaction-analyzer.js';

/**
 * Transaction formatting - ported from original getFormattedTransactionsString
 * Maintains exact same logic as monolithic version for compatibility
 */
export const TransactionFormatter = {
	/**
	 * Format transactions into HTML table rows
	 */
	formatTransactions(transactionsJson, isMempool, walletAddress, networkType, startIndex = 0) {
		if (!transactionsJson || !transactionsJson.items || transactionsJson.total === 0) {
			return '';
		}

		let formattedResult = '';
		for (let i = 0; i < transactionsJson.items.length; i++) {
			const item = transactionsJson.items[i];
			formattedResult += this.formatTransactionRow(item, startIndex + i, isMempool, walletAddress, networkType);
		}
		return formattedResult;
	},

	/**
	 * Format single transaction row (ported from original getFormattedTransactionsString loop)
	 */
	formatTransactionRow(item, index, isMempool, walletAddress, networkType) {
		let html = '<tr>';

		// Ensure arrays exist
		if (!item) {
			return '<tr><td colspan="10">Invalid transaction</td></tr>';
		}
		if (!Array.isArray(item.outputs)) item.outputs = [];
		if (!Array.isArray(item.inputs)) item.inputs = [];


		// Fee calculation
		let fee = 0;
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j] && item.outputs[j].address === FEE_ADDRESS) {
				fee = item.outputs[j].value;
			}
		}

		let outputsAddress = walletAddress;
		let txType = getTxType(item, networkType);

		// Calculate total transferred assets
		let totalTransferedAssets = {
			value: new BigNumber(0),
			assets: {}
		};

		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address === outputsAddress) {
				totalTransferedAssets.value = totalTransferedAssets.value.plus(item.outputs[j].value);

				let tokensArray = sortTokens(item.outputs[j].assets);
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets.assets[tokensArray[k].tokenId] === undefined) {
						totalTransferedAssets.assets[tokensArray[k].tokenId] = {};
						totalTransferedAssets.assets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
						totalTransferedAssets.assets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
						totalTransferedAssets.assets[tokensArray[k].tokenId].name = tokensArray[k].name;
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount = new BigNumber(tokensArray[k].amount);
					} else {
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount =
							totalTransferedAssets.assets[tokensArray[k].tokenId].amount.plus(tokensArray[k].amount);
					}
				}
			}
		}

		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address === outputsAddress) {
				totalTransferedAssets.value = totalTransferedAssets.value.minus(item.inputs[j].value);

				let tokensArray = sortTokens(item.inputs[j].assets);
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets.assets[tokensArray[k].tokenId] === undefined) {
						totalTransferedAssets.assets[tokensArray[k].tokenId] = {};
						totalTransferedAssets.assets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
						totalTransferedAssets.assets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
						totalTransferedAssets.assets[tokensArray[k].tokenId].name = tokensArray[k].name;
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount = new BigNumber(-tokensArray[k].amount);
					} else {
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount =
							totalTransferedAssets.assets[tokensArray[k].tokenId].amount.minus(tokensArray[k].amount);
					}
				}
			}
		}

		let txInOut = getTxInOutType(totalTransferedAssets);
		let analysis = analyzeTransfers(item, walletAddress);

		// Determine from/to addresses
		let fromAddress;
		let toAddress;

		if (txType === TxType.Origin) {
			fromAddress = AddressType.NA;
			toAddress = item.outputs && item.outputs.length > 0 && item.outputs[0].address ? item.outputs[0].address : AddressType.NA;
		} else if (txType === TxType.Wallet2Wallet) {
			if (txInOut === TxInOut.In) {
				fromAddress = item.inputs && item.inputs.length > 0 ? item.inputs[0].address : walletAddress;
				toAddress = walletAddress;

				let otherAddresses = [];
				if (item.inputs) {
					for (let j = 0; j < item.inputs.length; j++) {
						let input = item.inputs[j];
						if (input.address !== toAddress && !otherAddresses.includes(input.address)) {
							otherAddresses.push(input.address);
						}
					}
				}

				if (fromAddress === toAddress) {
					if (otherAddresses.length === 1) {
						for (let j = 0; j < item.inputs.length; j++) {
							let output = item.inputs[j];
							if (output.address !== toAddress) {
								fromAddress = output.address;
								break;
							}
						}
					}
				}

				if (otherAddresses.length > 1) {
					fromAddress = AddressType.Multiple;
				}
			} else if (txInOut === TxInOut.Out || txInOut === TxInOut.Mixed) {
				fromAddress = walletAddress;
				toAddress = item.outputs && item.outputs.length > 0 ? item.outputs[0].address : walletAddress;

				let otherAddresses = [];
				if (item.outputs) {
					for (let j = 0; j < item.outputs.length; j++) {
						let output = item.outputs[j];
						if (output.address !== fromAddress && output.address !== FEE_ADDRESS &&
						    !otherAddresses.includes(output.address)) {
							otherAddresses.push(output.address);
						}
					}
				}

				if (fromAddress === toAddress) {
					if (otherAddresses.length === 1) {
						for (let j = 0; j < item.outputs.length; j++) {
							let output = item.outputs[j];
							if (output.address !== fromAddress && output.address !== FEE_ADDRESS) {
								toAddress = output.address;
								break;
							}
						}
					}
				}

				if (otherAddresses.length > 1) {
					toAddress = AddressType.Multiple;
				}
			}
		} else if (txType === TxType.Contract2Contract) {
			let isThisContract = item.inputs && item.inputs.length > 0 &&
				item.outputs && item.outputs.length > 0 &&
				item.inputs[0].address === item.outputs[0].address &&
				item.inputs[0].address === walletAddress;

			if (txInOut === TxInOut.In) {
				if (isThisContract) {
					fromAddress = item.inputs && item.inputs.length > 1 ? item.inputs[1].address :
					              (item.inputs && item.inputs.length > 0 ? item.inputs[0].address : walletAddress);
					toAddress = walletAddress;
				} else {
					fromAddress = item.inputs && item.inputs.length > 0 ? item.inputs[0].address : walletAddress;
					toAddress = walletAddress;
				}
			} else if (txInOut === TxInOut.Out || txInOut === TxInOut.Mixed) {
				if (isThisContract) {
					fromAddress = item.inputs && item.inputs.length > 0 ? item.inputs[0].address : walletAddress;
					toAddress = walletAddress;
				} else {
					fromAddress = walletAddress;
					toAddress = item.outputs && item.outputs.length > 0 ? item.outputs[0].address : walletAddress;
				}

				if (fromAddress === toAddress || txInOut === TxInOut.Mixed) {
					let otherAddresses = [];
					if (item.outputs) {
						for (let j = 0; j < item.outputs.length; j++) {
							let output = item.outputs[j];
							if (output.address !== fromAddress && output.address !== FEE_ADDRESS &&
							    !otherAddresses.includes(output.address)) {
								otherAddresses.push(output.address);
							}
						}
					}

					if (otherAddresses.length > 1) {
						toAddress = AddressType.Multiple;
					} else {
						toAddress = item.outputs && item.outputs.length > 1 ? item.outputs[1].address :
						            (item.outputs && item.outputs.length > 0 ? item.outputs[0].address : walletAddress);
					}
				}
			}
		} else if (txType === TxType.Wallet2Contract) {
			fromAddress = item.inputs && item.inputs.length > 0 ? item.inputs[0].address : AddressType.NA;
			toAddress = item.outputs && item.outputs.length > 0 ? item.outputs[0].address : AddressType.NA;
			if (toAddress === FEE_ADDRESS && item.outputs && item.outputs.length > 1) {
				toAddress = item.outputs[1].address;
			}
		} else if (txType === TxType.Contract2Wallet) {
			fromAddress = item.inputs && item.inputs.length > 0 ? item.inputs[0].address : AddressType.NA;
			toAddress = item.outputs && item.outputs.length > 0 ? item.outputs[0].address : AddressType.NA;
		}

		if (txInOut === undefined) {
			fromAddress = toAddress = walletAddress;
		}

		// Ensure addresses are set
		if (!fromAddress) fromAddress = walletAddress;
		if (!toAddress) toAddress = walletAddress;

		if (fromAddress !== AddressType.Multiple && analysis.from) {
			fromAddress = analysis.from;
		}
		if (toAddress !== AddressType.Multiple && analysis.to) {
			toAddress = analysis.to;
		}

		// Build HTML table cells
		const timestamp = isMempool ? item.creationTimestamp : item.timestamp;
		let blockNr = item.inclusionHeight || 0;
		if (isMempool && item.outputs && item.outputs.length > 0) {
			blockNr = item.outputs[0].creationHeight || blockNr;
		}

		// Tx link
		html += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.id) + '"><i class="fas fa-link text-info"></i></a><span class="d-inline d-lg-none text-white float-end">' + formatDateString(timestamp) + '</span></td>';

		// Timestamp
		html += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(timestamp) + '</td>';

		// Type & Block
		let classString = 'text-info';
		let inOutString = 'Consolidation';
		if (txInOut === TxInOut.In) {
			classString = 'text-success';
			inOutString = 'In';
		} else if (txInOut === TxInOut.Out) {
			classString = 'text-danger';
			inOutString = 'Out';
		} else if (txInOut === TxInOut.Mixed) {
			classString = 'text-warning';
			inOutString = 'Mixed';
		}

		let smartString = '<span class="text-info" title="Smart Contract interaction. Check transaction link for full details."> (SC)</span>';
		if (txType === TxType.Contract2Contract || txType === TxType.Wallet2Contract || txType === TxType.Contract2Wallet) {
			inOutString += smartString;
		}

		const blockHtml = isMempool ? blockNr : (item.blockId ? '<a href="' + getBlockUrl(item.blockId) + '">' + blockNr + '</a>' : blockNr);
		html += '<td><span class="d-inline d-lg-none"><strong>Type: </strong><span class="' + classString + '">' + inOutString + '</span></span><span class="d-inline d-lg-none float-end"><strong>Block: </strong>' + blockHtml + '</span><span class="d-none d-lg-inline">' + blockHtml + '</span></td>';

		// Type for desktop
		html += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Type: </strong></span><span class="' + classString + '">' + inOutString + '</span></td>';

		// From address
		addAddress(fromAddress);
		let formattedFromAddress = formatTxAddressString(fromAddress, null, walletAddress);
		if (networkType !== 'testnet' && (txType === TxType.Wallet2Contract || txType === TxType.Contract2Wallet) &&
		    item.inputs && item.inputs.length > 0 && item.inputs[0].ergoTree &&
		    typeof getAddressFromErgotree === 'function') {
			formattedFromAddress = getAddressFromErgotree(item.inputs[0].ergoTree, fromAddress, formattedFromAddress);
		}
		html += '<td><span class="d-lg-none"><strong>From: </strong></span>' + formattedFromAddress + '</td>';

		// To address
		addAddress(toAddress);
		let formattedToAddress = formatTxAddressString(toAddress, null, walletAddress);
		if ((txType === TxType.Wallet2Contract || txType === TxType.Contract2Wallet) &&
		    item.outputs && item.outputs.length > 0 && item.outputs[0].ergoTree &&
		    typeof getAddressFromErgotree === 'function') {
			formattedToAddress = getAddressFromErgotree(item.outputs[0].ergoTree, toAddress, formattedToAddress);
		}
		html += '<td><span class="d-lg-none"><strong>To: </strong></span>' + formattedToAddress + '</td>';

		// Status & Fee
		html += '<td><span class="d-lg-none"><strong>Status: </strong></span><span class="' + (isMempool ? 'text-warning' : 'text-success') + '">' + (isMempool ? 'Pending' : 'Confirmed') + '</span><span class="d-inline d-lg-none text-white float-end"><strong>Fee: </strong>' + formatErgValueString(fee) + '</span></td>';

		// Fee
		html += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Fee: </strong></span>' + formatErgValueString(fee) + '</td>';

		// Value
		if (txInOut !== TxInOut.Mixed) {
			if (totalTransferedAssets.value.isNegative()) {
				totalTransferedAssets.value = totalTransferedAssets.value.absoluteValue();
			}
			let assetKeys = Object.keys(totalTransferedAssets.assets);
			for (let k = 0; k < assetKeys.length; k++) {
				let asset = totalTransferedAssets.assets[assetKeys[k]];
				if (asset.amount.isNegative()) {
					asset.amount = asset.amount.absoluteValue();
				}
			}
		}

		let valueStr = formatErgValueString(totalTransferedAssets.value, 4) || '0.00 ERG';
		let assetKeys = Object.keys(totalTransferedAssets.assets);
		if (assetKeys.length > 0) {
			for (let j = 0; j < assetKeys.length; j++) {
				let asset = totalTransferedAssets.assets[assetKeys[j]];
				if (!asset || !asset.amount || asset.amount.toString() === '0') continue;

				const sign = txInOut === TxInOut.Out ? '-' : '';
				const isScan = AddressState.scamList.includes(asset.tokenId);
				valueStr += '<br><strong>' + sign + formatAssetValueString(asset.amount, asset.decimals, 4) + '</strong> ' +
					getAssetTitle(asset, false, isScan);
			}
		}

		html += '<td id="txValue' + index + '">' + valueStr + '</td>';

		html += '</tr>';
		return html;
	}
};
