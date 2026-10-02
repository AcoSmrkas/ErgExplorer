import { CRUX_TEMPLATES, DUCKPOOLS_TEMPLATES, EPERPS_TEMPLATES, ERGO_MIXER_TEMPLATES, ERGONAMES_TEMPLATES, ERGOPAD_STAKING_TEMPLATES, ERGORAFFLE_TEMPLATES, LITHOS_LOCK_TEMPLATES, LITHOS_TEMPLATES, ORACLE_POOL_V2_TEMPLATES, PAIDEIA_TEMPLATES, ROSEN_TEMPLATES, THE_FIELD_TEMPLATES, SPECTRUM_TEMPLATES, SWAP_TEMPLATES, TxInOut, TxType } from './constants.js';

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
		[SWAP_TEMPLATES.N2T_SWAP_ALT_1]: 'Spectrum Finance N2T Swap',
		[SWAP_TEMPLATES.N2T_SWAP_ALT_2]: 'Spectrum Finance N2T Swap',
		[SPECTRUM_TEMPLATES.LP_DEPOSIT]: 'Spectrum Finance LP Deposit',
		[SPECTRUM_TEMPLATES.LP_REDEEM]: 'Spectrum Finance LP Redeem',
		[SPECTRUM_TEMPLATES.YF_DEPOSIT]: 'Spectrum Finance YF Deposit',
		[SPECTRUM_TEMPLATES.YF_REDEEM]: 'Spectrum Finance YF Redeem',
		[CRUX_TEMPLATES.LIMIT_ORDER]: 'Crux Finance Limit Order',
		[CRUX_TEMPLATES.LIMIT_ORDER_PART]: 'Crux Finance Limit Order',
		[CRUX_TEMPLATES.LIQUIDITY_POSITION]: 'Crux Finance Liquidity Position',
		[LITHOS_TEMPLATES.SWAP_SELL]: 'Lithos LP Swap',
		[LITHOS_TEMPLATES.SWAP_BUY]: 'Lithos LP Swap',
		[LITHOS_TEMPLATES.LP_DEPOSIT]: 'Lithos LP Deposit',
		[LITHOS_TEMPLATES.LP_REDEEM]: 'Lithos LP Redeem',
		[LITHOS_TEMPLATES.POOL]: 'Lithos Liquidity Pool'
	};

	// Services whose contracts come in several builds: [templates by role, label by role]
	const templateGroups = [
		[ERGORAFFLE_TEMPLATES, {
			SERVICE: 'ErgoRaffle Service',
			CREATE_PROXY: 'ErgoRaffle Raffle Creation',
			RAFFLE_SETUP: 'ErgoRaffle Raffle Setup',
			RAFFLE_TOKENS: 'ErgoRaffle Raffle Setup',
			ACTIVE: 'ErgoRaffle Active Raffle',
			TICKET_PROXY: 'ErgoRaffle Ticket Purchase',
			TICKET: 'ErgoRaffle Ticket',
			WINNER: 'ErgoRaffle Winner Prize',
			REFUND: 'ErgoRaffle Refund'
		}],
		[ORACLE_POOL_V2_TEMPLATES, {
			POOL: 'Oracle Pool v2',
			DATAPOINT: 'Oracle Pool v2 Datapoint',
			REFRESH: 'Oracle Pool v2 Refresh',
			COMPANION: 'Oracle Pool v2 Companion',
			BUYBACK: 'Oracle Pool v2 Buyback'
		}],
		[ROSEN_TEMPLATES, {
			REPO: 'Rosen Bridge Watcher Repo',
			COLLATERAL: 'Rosen Bridge Watcher Collateral',
			PERMIT: 'Rosen Bridge Watcher Permit',
			COMMITMENT: 'Rosen Bridge Commitment',
			EVENT_TRIGGER: 'Rosen Bridge Event Trigger',
			REPO_CONFIG: 'Rosen Bridge Repo Config'
		}],
		[ERGO_MIXER_TEMPLATES, {
			HALF_MIX: 'Ergo Mixer Half-Mix',
			FULL_MIX: 'Ergo Mixer Full-Mix',
			FEE: 'Ergo Mixer Fee Box',
			TOKEN_EMISSION: 'Ergo Mixer Token Emission'
		}],
		[ERGOPAD_STAKING_TEMPLATES, {
			STATE: 'ErgoPad Staking State',
			STAKE: 'ErgoPad Stake',
			POOL: 'ErgoPad Staking Pool',
			EMISSION: 'ErgoPad Staking Emission',
			INCENTIVE: 'ErgoPad Staking Incentive',
			REQUEST: 'ErgoPad Staking Request'
		}],
		[LITHOS_LOCK_TEMPLATES, {
			CAMPAIGN: 'Lithos Lock Campaign'
		}],
		[PAIDEIA_TEMPLATES, {
			STAKE_STATE: 'Paideia Stake State',
			STAKING: 'Paideia Staking',
			PROPOSAL: 'Paideia Proposal',
			TREASURY: 'Paideia DAO Treasury',
			DAO: 'Paideia DAO',
			ACTION: 'Paideia DAO Action',
			ORIGIN: 'Paideia Origin'
		}],
		[ERGONAMES_TEMPLATES, {
			MINT_REQUEST: 'ErgoNames Mint Request',
			COLLECTION: 'ErgoNames Collection',
			NAME_MINT: 'ErgoNames Name Mint',
			REGISTRY: 'ErgoNames Registry',
			ERGODOMAINS_REGISTRAR: 'ErgoDomains Registrar',
			ERGODOMAINS_DOMAIN: 'ErgoDomains Domain'
		}],
		[DUCKPOOLS_TEMPLATES, {
			POOL: 'Duckpools Lending Pool',
			COLLATERAL: 'Duckpools Collateral',
			REPAYMENT: 'Duckpools Repayment',
			CHILD_INTEREST: 'Duckpools Child Interest',
			INTEREST: 'Duckpools Interest',
			LEND_PROXY: 'Duckpools Lend',
			WITHDRAW_PROXY: 'Duckpools Withdraw',
			BORROW_PROXY: 'Duckpools Borrow',
			REPAY_PROXY: 'Duckpools Repay',
			PARTIAL_REPAY_PROXY: 'Duckpools Partial Repay'
		}],
		[THE_FIELD_TEMPLATES, {
			MARKET: 'The Field Market',
			COLLECTION: 'The Field Collection',
			BID_MARKET: 'The Field Bid Market',
			BID: 'The Field Bid'
		}],
		[EPERPS_TEMPLATES, {
			RESERVE: 'ePerps Reserve',
			STAMP: 'ePerps Stamp',
			STAMPER: 'ePerps Stamper',
			LPSAT: 'ePerps LP Satellite',
			FILLSAT: 'ePerps Fill Satellite',
			RISKSAT: 'ePerps Risk Satellite',
			SWEEP: 'ePerps Sweep',
			UPDATE: 'ePerps Update',
			BALLOT: 'ePerps Ballot',
			RSV: 'ePerps RSV'
		}]
	];

	for (const [groupTemplates, labels] of templateGroups) {
		for (const [key, label] of Object.entries(labels)) {
			for (const template of groupTemplates[key]) {
				templates[template] = label;
			}
		}
	}

	for (const [template, label] of Object.entries(templates)) {
		if (ergoTree.endsWith(template)) {
			return label;
		}
	}

	return null;
}

/**
 * Name a Lithos pool box after the order the batcher filled with it. The pool is
 * input 0 of the fill, so it is what shows as the sender of the swapped assets;
 * the order box spent beside it says what the fill was.
 */
export function detectLithosFill(inputs, ergoTree) {
	if (!ergoTree.endsWith(LITHOS_TEMPLATES.POOL)) {
		return null;
	}

	for (const box of inputs) {
		const contractName = box.ergoTree && !box.ergoTree.endsWith(LITHOS_TEMPLATES.POOL)
			? detectContractFromErgotree(box.ergoTree)
			: null;

		if (contractName) {
			return contractName;
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
