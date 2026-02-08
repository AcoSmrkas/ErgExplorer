import { TxType, TxInOut, SWAP_TEMPLATES, SPECTRUM_TEMPLATES } from './constants.js';

/**
 * Determine transaction type based on input/output address types
 */
export function getTxType(tx, networkType) {
	if (!tx.inputs || tx.inputs.length === 0) {
		return TxType.Origin;
	}

	let outputAddress = tx.outputs[0].address;

	if (outputAddress === FEE_ADDRESS && tx.outputs.length > 1) {
		outputAddress = tx.outputs[1].address;
	}

	const input0isWallet = isWalletAddress(tx.inputs[0].address, networkType);
	const output0isWallet = isWalletAddress(outputAddress, networkType);

	if (input0isWallet && output0isWallet) {
		return TxType.Wallet2Wallet;
	}

	if (!input0isWallet && !output0isWallet) {
		return TxType.Contract2Contract;
	}

	if (input0isWallet && !output0isWallet) {
		return TxType.Wallet2Contract;
	}

	if (!input0isWallet && output0isWallet) {
		return TxType.Contract2Wallet;
	}
}

/**
 * Check if an address is a wallet address (vs contract)
 */
export function isWalletAddress(address, networkType) {
	const walletAddressPrefix = networkType === 'testnet' ? '3' : '9';
	return address.substring(0, 1) === walletAddressPrefix;
}

/**
 * Determine if transaction is In, Out, or Mixed based on asset flow
 */
export function getTxInOutType(totalTransferedAssets) {
	let txInOut = checkAssetsSign(totalTransferedAssets.assets);

	if (txInOut !== TxInOut.Mixed) {
		if (totalTransferedAssets.value > 0) {
			txInOut = (txInOut === TxInOut.Out) ? TxInOut.Mixed : TxInOut.In;
		} else if (totalTransferedAssets.value < 0) {
			txInOut = (txInOut === TxInOut.In) ? TxInOut.Mixed : TxInOut.Out;
		}
	}

	return txInOut;
}

/**
 * Check the sign of assets to determine if primarily In or Out
 */
export function checkAssetsSign(assets) {
	let assetsSign = undefined;

	for (const key of Object.keys(assets)) {
		const asset = assets[key];

		if (asset.amount > 0) {
			if (assetsSign === TxInOut.Out) {
				return TxInOut.Mixed;
			}
			assetsSign = TxInOut.In;
		}

		if (asset.amount < 0) {
			if (assetsSign === TxInOut.In) {
				return TxInOut.Mixed;
			}
			assetsSign = TxInOut.Out;
		}
	}

	return assetsSign;
}

/**
 * Detect smart contract addresses by matching ergoTree to known templates
 */
export function detectContractFromErgotree(ergoTree, addressType = 'label') {
	const templates = {
		[SWAP_TEMPLATES.N2T_SELL_ERG]: 'Spectrum Finance N2T Swap',
		[SWAP_TEMPLATES.N2T_SELL_SPF]: 'Spectrum Finance N2T Swap',
		[SWAP_TEMPLATES.N2T_BUY_ERG]: 'Spectrum Finance N2T Swap',
		[SWAP_TEMPLATES.N2T_BUY_SPF]: 'Spectrum Finance N2T Swap',
		[SWAP_TEMPLATES.T2T_SWAP_ERG]: 'Spectrum Finance T2T Swap',
		[SWAP_TEMPLATES.T2T_SWAP_SPF]: 'Spectrum Finance T2T Swap',
		[SPECTRUM_TEMPLATES.LP_DEPOSIT]: 'Spectrum Finance LP Deposit',
		[SPECTRUM_TEMPLATES.LP_REDEEM]: 'Spectrum Finance LP Redeem',
		[SPECTRUM_TEMPLATES.YF_DEPOSIT]: 'Spectrum Finance YF Deposit',
		[SPECTRUM_TEMPLATES.YF_REDEEM]: 'Spectrum Finance YF Redeem'
	};

	for (const [template, label] of Object.entries(templates)) {
		if (ergoTree.endsWith(template)) {
			return label;
		}
	}

	return null;
}

/**
 * Analyze transfer patterns in a transaction
 * Returns detailed info about minting, burning, sending, and receiving
 */
export function analyzeTransfers(txData, inputAddress) {
	const PAYMENT_ADDRESS = '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';

	const result = {
		isSending: false,
		isReceiving: false,
		isMinting: false,
		isBurning: false,
		sendingTo: new Set(),
		receivingFrom: new Set(),
		assetsSent: [],
		assetsReceived: [],
		assetsMinted: [],
		assetsBurned: [],
		from: '',
		to: ''
	};

	const getBoxAssets = (boxes) => {
		const assets = new Map();
		boxes.forEach(box => {
			if (!assets.has('ERG')) assets.set('ERG', 0);
			assets.set('ERG', assets.get('ERG') + box.value);

			(box.assets || []).forEach(asset => {
				if (!assets.has(asset.tokenId)) assets.set(asset.tokenId, 0);
				assets.set(asset.tokenId, assets.get(asset.tokenId) + asset.amount);
			});
		});
		return assets;
	};

	const inputBoxes = txData.inputs.filter(box => box.address === inputAddress);
	const outputBoxes = txData.outputs.filter(box => box.address === inputAddress);

	const inputAssets = getBoxAssets(inputBoxes);
	const outputAssets = getBoxAssets(outputBoxes);
	const allTxInputAssets = getBoxAssets(txData.inputs);
	const allTxOutputAssets = getBoxAssets(txData.outputs);

	// Detect minting
	for (const [tokenId, outputAmount] of outputAssets) {
		const inputAmount = inputAssets.get(tokenId) || 0;
		const totalTxInputAmount = allTxInputAssets.get(tokenId) || 0;
		const totalTxOutputAmount = allTxOutputAssets.get(tokenId) || 0;

		if (totalTxOutputAmount > totalTxInputAmount && outputAmount > inputAmount) {
			result.isMinting = true;
			result.assetsMinted.push({
				tokenId,
				amount: Math.min(outputAmount - inputAmount, totalTxOutputAmount - totalTxInputAmount)
			});
		}
	}

	// Detect burning
	for (const [tokenId, inputAmount] of inputAssets) {
		const outputAmount = outputAssets.get(tokenId) || 0;
		const totalTxInputAmount = allTxInputAssets.get(tokenId) || 0;
		const totalTxOutputAmount = allTxOutputAssets.get(tokenId) || 0;

		if (totalTxOutputAmount < totalTxInputAmount && inputAmount > outputAmount) {
			result.isBurning = true;
			result.assetsBurned.push({
				tokenId,
				amount: Math.min(inputAmount - outputAmount, totalTxInputAmount - totalTxOutputAmount)
			});
		}
	}

	const onlyBurnedAssets = new Set(result.assetsBurned.map(asset => asset.tokenId));

	// Detect sending
	for (const [tokenId, inputAmount] of inputAssets) {
		const outputAmount = outputAssets.get(tokenId) || 0;
		if (inputAmount > outputAmount) {
			const isActuallySent = txData.outputs.some(box =>
				box.address !== inputAddress &&
				box.address !== PAYMENT_ADDRESS &&
				(
					(tokenId === 'ERG' && box.value > 0) ||
					(box.assets || []).some(asset => asset.tokenId === tokenId && asset.amount > 0)
				)
			);

			if (isActuallySent) {
				onlyBurnedAssets.delete(tokenId);
				result.isSending = true;
				txData.outputs
					.filter(box => box.address !== inputAddress && box.address !== PAYMENT_ADDRESS)
					.forEach(box => {
						if (tokenId === 'ERG' && box.value > 0) {
							result.sendingTo.add(box.address);
						} else {
							const assetExists = (box.assets || []).some(asset =>
								asset.tokenId === tokenId && asset.amount > 0);
							if (assetExists) {
								result.sendingTo.add(box.address);
							}
						}
					});
			}

			result.assetsSent.push({
				tokenId,
				amount: inputAmount - outputAmount
			});
		}
	}

	result.assetsSent = result.assetsSent.filter(asset => !onlyBurnedAssets.has(asset.tokenId));

	// Detect receiving
	for (const [tokenId, outputAmount] of outputAssets) {
		const inputAmount = inputAssets.get(tokenId) || 0;
		if (outputAmount > inputAmount) {
			result.isReceiving = true;
			txData.inputs
				.filter(box => box.address !== inputAddress)
				.forEach(box => {
					if (tokenId === 'ERG' && box.value > 0) {
						result.receivingFrom.add(box.address);
					} else {
						const assetExists = (box.assets || []).some(asset =>
							asset.tokenId === tokenId && asset.amount > 0);
						if (assetExists) {
							result.receivingFrom.add(box.address);
						}
					}
				});
			result.assetsReceived.push({
				tokenId,
				amount: outputAmount - inputAmount
			});
		}
	}

	// Determine from/to addresses
	if (result.isSending && (!result.isBurning || result.sendingTo.size > 0)) {
		result.from = inputAddress;
		if (result.sendingTo.size === 1) {
			result.to = Array.from(result.sendingTo)[0];
		} else if (result.sendingTo.size > 1) {
			result.to = findLargestRecipient(result.sendingTo, txData);
		}
	} else if (result.isReceiving) {
		result.to = inputAddress;
		if (result.receivingFrom.size === 1) {
			result.from = Array.from(result.receivingFrom)[0];
		} else if (result.receivingFrom.size > 1) {
			result.from = findLargestSender(result.receivingFrom, txData);
		}
	} else if (result.isBurning && !result.isSending) {
		result.from = inputAddress;
		result.to = PAYMENT_ADDRESS;
	} else if (result.isMinting && !result.isReceiving) {
		result.from = inputAddress;
		result.to = inputAddress;
	} else {
		result.from = inputAddress;
		result.to = inputAddress;
	}

	return {
		...result,
		sendingTo: Array.from(result.sendingTo),
		receivingFrom: Array.from(result.receivingFrom)
	};
}

/**
 * Find the address receiving the most value
 */
function findLargestRecipient(addresses, txData) {
	let maxValue = 0;
	let maxAddress = '';

	addresses.forEach(address => {
		let totalValue = txData.outputs
			.filter(box => box.address === address)
			.reduce((sum, box) => sum + box.value + (box.assets || []).reduce((a, b) => a + b.amount, 0), 0);

		if (totalValue > maxValue) {
			maxValue = totalValue;
			maxAddress = address;
		}
	});

	return maxAddress;
}

/**
 * Find the address sending the most value
 */
function findLargestSender(addresses, txData) {
	let maxValue = 0;
	let maxAddress = '';

	addresses.forEach(address => {
		let totalValue = txData.inputs
			.filter(box => box.address === address)
			.reduce((sum, box) => sum + box.value + (box.assets || []).reduce((a, b) => a + b.amount, 0), 0);

		if (totalValue > maxValue) {
			maxValue = totalValue;
			maxAddress = address;
		}
	});

	return maxAddress;
}
