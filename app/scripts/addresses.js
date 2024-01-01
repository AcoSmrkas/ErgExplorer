var walletAddress = undefined;
var mempoolData = undefined;
var transactionsData = undefined;
var tokensContentFull = '';
var tokensContent = '';
var financialTokensContentFull = '';
var financialTokensContent = '';
var formattedResult = '';
var totalTransactions = 0;
var valueFields = new Array();
var valueFieldsFull = new Array();
var nftsCount = 0;
var issuedNftsCount = 0;
var mempoolIndexOffset = 0;
var tokensArray = new Array();
var initRequestCount = -1;
var initRequestDone = 0;
var mempoolData = undefined;
var transactionsData = undefined;
var mempoolRequestDone = false;
var transactionsRequestDone = false;
var mempoolCount = 0;
var mempoolInterval = undefined;
var mempoolTxIds = new Array();
var txNotification = undefined;
var datePickerFrom = undefined;
var datePickerTo = undefined;
var tempDate = -1;
var publicUser = false;
var checkedUser = false;
var printed = false;
var loadingOwnedNfts = false;
var loadingIssuedNfts = false;

$(function() {
	walletAddress = getWalletAddressFromUrl();	

	setDocumentTitle(walletAddress);
	
    getUser();
    getPrices(onInitRequestsFinished);
    getIssuedNfts(walletAddress, onGotIssuedNftInfo, false);
    getAddressInfo();

    setupQrCode();
    setupDatePicker();
});

const resizeObserver = new ResizeObserver((entries) => {
	let windowWidth = window.innerWidth;

	if (windowWidth <= 992) {
		return;
	}

	let element = $('#tokensHolder');

	if (element) {
		let heightStr = element.css('height');
		let height = parseInt(heightStr);
		let newHeight = (height / 2) - 50;

		$('.tokensContainer').css('max-height', newHeight + 'px');
	}
});

resizeObserver.observe(document.getElementById('tokensHolder'));

function getUser() {
	$.get(ERGEXPLORER_API_HOST + 'user/getUser?address=' + walletAddress,
	function (data) {
		if (data.items.length > 0) {
			//if (data.items[0].public == 't') {
			//$('#filterHolder').show();
			//getChart('ERG', 'chart', '1chartHolder');

//			publicUser = true;
		}
	}).always(function (data) {
		checkedUser = true;
		onInitRequestsFinished();
	});
}

function printAddressSummary() {
	let balanceUrl = getTxsUrl();

	$.get(balanceUrl,
	function(data) {
		//Total ERG value
		$('#finalErgBalance').html('<strong class="erg-span">ERG</strong><span class="gray-color"> balance:</span> <strong>' + formatErgValueString(data.confirmed.nanoErgs, 2) + '</strong>');
		
		let ergDollarValue = formatAssetDollarPrice(data.confirmed.nanoErgs, ERG_DECIMALS, 'ERG');
		if (gotPrices) {
			$('#finalErgBalance').html($('#finalErgBalance').html() + ' ' + formatDollarPriceString(ergDollarValue, 2));
		}

		//Balance tokens
		if (data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			//Sort
			tokensArray = sortTokens(data.confirmed.tokens);

			let financialTokens = tokensArray.filter(separateFinancialTokens);
			let otherTokens = tokensArray.filter(separateNonFinancialTokens);

			//Format output
			if (financialTokens.length > 0) {
				let financialTokensHtmlString = formatFinancialTokensHtmlString(financialTokens, ergDollarValue);
				$('#financialTokens').html(financialTokensHtmlString);
				$('#financialAssetsHolder').show();
			}

			if (otherTokens.length > 0) {
				let otherTokensHtmlString = formatOtherTokensHtmlString(otherTokens, ergDollarValue);
				$('#otherTokens').html(otherTokensHtmlString);
				$('#otherTokensHolder').show();
			}
		}

		let walletAddressString = walletAddress;
		if (walletAddressString.length > 70) {
			walletAddressString = formatAddressString(walletAddressString, 58);
		}
		$('#address').html(walletAddressString + ' &#128203;');
		$('#officialLink').html(getOfficialExplorereAddressUrl(walletAddressString));
		$('#officialLink').attr('href', getOfficialExplorereAddressUrl(walletAddress));
		$('#officialLink').show();

		$('#summaryOk').show();

		getErgopadVesting();
		getErgopadStaking();
    })
    .fail(function() {
    	$('#txLoading').hide();
    	showLoadError('No results matching your query.');
    });
}

function formatOtherTokensHtmlString(tokensArray) {
	let i = 0;
	let nftSearchTokens = [];
	let totalAssetsValue = 0;	
	let tokensToShow = 2;
	let totalVestingPrice = -1;
	tokensContent = '';
	tokensContentFull = '';

	if (publicUser) {
		tokensToShow = 15;
	}

	for (i = 0; i < tokensArray.length; i++) {
		let tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4), tokensArray[i].tokenId);

		tokensContentFull += tokensString;

		nftSearchTokens[i] = tokensArray[i].tokenId;

		if (i > tokensToShow) continue;

		tokensContent += tokensString;

		if (i == tokensToShow && tokensArray.length > tokensToShow + 1) {
			tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
		}
	}

	getNftsInfo(nftSearchTokens, onGotOwnedNftInfo);

	return tokensContentFull;
}

function formatFinancialTokensHtmlString(tokensArray, ergDollarValue) {
	let i = 0;
	let totalAssetsValue = 0;	
	let tokensToShow = 6;
	let totalVestingPrice = -1;
	financialTokensContent = '';
	financialTokensContentFull = '';

	if (publicUser) {
		tokensToShow = 15;
	}

	for (i = 0; i < tokensArray.length; i++) {
		let tokensPrice = 0;
		let tokensPriceString = '';
		if (gotPrices && prices[tokensArray[i].tokenId] != undefined) {
			tokensPrice = formatAssetDollarPrice(tokensArray[i].amount, tokensArray[i].decimals, tokensArray[i].tokenId);
			tokensPriceString = formatDollarPriceString(tokensPrice);
			totalAssetsValue += tokensPrice;
			tokensArray[i].usdPrice = tokensPrice;
		}

		tokensArray[i].tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4) + (tokensPrice == 0 ? '' : '<span class="text-light"> ' + tokensPriceString + '</span>'), tokensArray[i].tokenId);
	}

	if (gotPrices) {
		tokensArray.sort((a, b) => {
			let aAmount = a.usdPrice;
			let bAmount = b.usdPrice;

			if (aAmount === bAmount) return 0;

			return aAmount > bAmount ? -1 : 1;
		});
	}

	for (i = 0; i < tokensArray.length; i++) {
		let tokensString = tokensArray[i].tokensString;

		financialTokensContentFull += tokensString;

		if (i > tokensToShow) continue;

		financialTokensContent += tokensString;

		if (i == tokensToShow && tokensArray.length > tokensToShow + 1) {
			financialTokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllFinancialTokens(event)">Show all</a></strong></p>';
		}
	}

	if (totalAssetsValue > 0) {
		$('#finalAssetsBalance').html('<span class="gray-color">Tokens balance:</span> $' + formatValue(totalAssetsValue, 2) + '');
		$('#finalAssetsBalance').show();

		$('#finalBalance').html('<span class="grey-color"><b>Total:</b></span> $' + formatValue(ergDollarValue + totalAssetsValue, 2) + '');
		$('#finalBalance').show();
	}

	return financialTokensContentFull;
}

function separateFinancialTokens(_, index, array) {
	let pricesKeys = Object.keys(prices);
	for (let i = 0; i < pricesKeys.length; i++) {
		let priceId = pricesKeys[i];
		let token = array[index];

		if (priceId == token.tokenId) {
			return true;
		}
	}

	return false;
}

function separateNonFinancialTokens(_, index, array) {
	let pricesKeys = Object.keys(prices);
	for (let i = 0; i < pricesKeys.length; i++) {
		let priceId = pricesKeys[i];
		let token = array[index];

		if (priceId == token.tokenId) {
			return false;
		}
	}

	return true;
}

const TxType = {
	Wallet2Wallet: 'Wallet2Wallet',
	Wallet2Contract: 'Wallet2Contract',
	Contract2Wallet: 'Contract2Wallet',
	Contract2Contract: 'Contract2Contract',
	Origin: 'Origin'
}

function getTxType(tx) {		
	if (tx.inputs == undefined || tx.inputs.length == 0) {
		return TxType.Origin;
	}

	let input0isWallet = isWalletAddress(tx.inputs[0].address);
	let output0isWallet = isWalletAddress(tx.outputs[0].address);

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

function isWalletAddress(address) {
	let walletAddressPrefix = networkType == 'testnet' ? '3' : '9';

	return address.substring(0, 1) == walletAddressPrefix;
}

function formatTxAddressString(address) {
	let formattedAddress;
	
	if (address == walletAddress) {
		formattedAddress = 'This Address';
	} else {
		formattedAddress = formatAddressString(address, 10);
	}

	let addressString = '<a title="' + address + '" class="address-string" addr="' + address + '" href="' + getWalletAddressUrl(address) + '" >' + (getOwner(address) == undefined ? formattedAddress : getOwner(address)) + '</a>';
	if (address == AddressType.NA) {
		addressString = '<span class="text-light">' + AddressType.NA + '</span>';
	} else if (address == AddressType.Multiple) {
		addressString = '<span class="text-light" title="This transaction has multiple receiving addresses. Check transaction link for more details.">' + AddressType.Multiple + '</span>';
	}

	addressString = '<a title="' + address + '" onclick="copyAddress(event, this)" href="Copy to clipboard!">&#128203;</a> ' + addressString;

	return addressString;
}

function getTxInOutType(totalTransferedAssets) {
	let txInOut = checkAssetsSign(totalTransferedAssets.assets);

	if (txInOut != TxInOut.Mixed) {
		if (totalTransferedAssets.value > 0) {
			if (txInOut == TxInOut.Out) {
				txInOut = TxInOut.Mixed;
			} else {
				txInOut = TxInOut.In;
			}
		} else if (totalTransferedAssets.value < 0) {
			if (txInOut == TxInOut.In) {
				txInOut = TxInOut.Mixed;
			} else {
				txInOut = TxInOut.Out;
			}
		}
	}

	return txInOut;
}

function checkAssetsSign(assets) {
	let assetsSign = undefined;

	let assetsKeys = Object.keys(assets);
	for (let i = 0; i < assetsKeys.length; i++) {
		let asset = assets[assetsKeys[i]];

		if (asset.amount > 0) {
			if (assetsSign == TxInOut.Out) {
				assetsSign = TxInOut.Mixed;
			}

			if (assetsSign == undefined) {
				assetsSign = TxInOut.In;
			}
		}

		if (asset.amount < 0) {
			if (assetsSign == TxInOut.In) {
				assetsSign = TxInOut.Mixed;
			}

			if (assetsSign == undefined) {
				assetsSign = TxInOut.Out;
			}
		}
	}

	return assetsSign;
}

const TxInOut = {
	In: 'In',
	Out: 'Out',
	Mixed: 'Mixed'
}

const AddressType = {
	NA: 'N/A',
	Multiple: 'Multiple'
}

function getFormattedTransactionsString(transactionsJson, isMempool) {
	if (transactionsJson == undefined || transactionsJson == '' || transactionsJson.total == 0) {
		return '';
	}

	let formattedResult = '';
	for (let i = 0; i < transactionsJson.items.length; i++) {
		const item = transactionsJson.items[i];

		formattedResult += '<tr>';

		//Fee
		let fee = 0;
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == FEE_ADDRESS) {
				fee = item.outputs[j].value;
			}
		}

		let outputsAddress = walletAddress;
		let txType = getTxType(item);

		let totalTransferedAssets = {
			value: 0,
			assets: {}
		};

		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == outputsAddress) {

				totalTransferedAssets.value += item.outputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.outputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets.assets[tokensArray[k].tokenId] == undefined) {
						totalTransferedAssets.assets[tokensArray[k].tokenId] = tokensArray[k];
					} else {
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount += tokensArray[k].amount;
					}
				}
			}
		}

		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address == outputsAddress) {

				totalTransferedAssets.value -= item.inputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.inputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets.assets[tokensArray[k].tokenId] == undefined) {
						totalTransferedAssets.assets[tokensArray[k].tokenId] = {};
						totalTransferedAssets.assets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
						totalTransferedAssets.assets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
						totalTransferedAssets.assets[tokensArray[k].tokenId].name = tokensArray[k].name;
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount = -tokensArray[k].amount;
					} else {
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount -= tokensArray[k].amount;
					}
				}
			}
		}

		let txInOut = getTxInOutType(totalTransferedAssets);
		let fromAddress;
		let toAddress;
		if ((txInOut == TxInOut.Out
			|| txInOut == TxInOut.Mixed)
			&& totalTransferedAssets.value == -fee) {
			let hasOtherAddresses = false;
			let oneaddress = walletAddress;
			for (let j = 0; j < item.inputs.length; j++) {
				let input = item.inputs[j];

				if (input.address != oneaddress && input.address != FEE_ADDRESS) {
					console.log(input.address);
					hasOtherAddresses = true;
				}
			}
			for (let j = 0; j < item.outputs.length; j++) {
				let output = item.outputs[j];

				if (output.address != oneaddress && output.address != FEE_ADDRESS) {
					console.log(output.address);
					hasOtherAddresses = true;
				}
			}
			if (!hasOtherAddresses) {
				txInOut = undefined;
			}
//			totalTransferedAssets.value = 0;
		} else if ((txType == TxType.Wallet2Wallet || txType == TxType.Wallet2Contract)
			&& txInOut == TxInOut.Out) {
//			totalTransferedAssets.value += fee;
		} 

		if (txInOut == TxInOut.In && txType != TxType.Origin) {
			for (let j = 0; j < item.outputs.length; j++) {
				let output = item.outputs[j];
				if (output.address == walletAddress) {
					toAddress = walletAddress;
					fromAddress = item.inputs[0].address;
					break;
				}
			}
		}

		//From/to address
		if (txType == TxType.Origin) {
			fromAddress = AddressType.NA;
			toAddress = item.outputs[0].address;
		} else if (txType == TxType.Wallet2Wallet) {
			if (txInOut == TxInOut.In) {
				//Input TX
				fromAddress = item.inputs[0].address;
				toAddress = walletAddress;
			} else if (txInOut == TxInOut.Out
				|| txInOut == TxInOut.Mixed) {
				//Output TX
				fromAddress = walletAddress;
				toAddress = item.outputs[0].address;

				//Handle multiple output addresses
				let otherAddresses = 0;
				for (let j = 0; j < item.outputs.length; j++) {
					let output = item.outputs[j];

					if (output.address != fromAddress && output.address != FEE_ADDRESS) {
						otherAddresses++;
					}
				}

				if (fromAddress == toAddress) {
					if (otherAddresses == 1) {
						for (let j = 0; j < item.outputs.length; j++) {
							let output = item.outputs[j];

							if (output.address != fromAddress && output.address != FEE_ADDRESS) {
								toAddress = output.address;
								break;
							}
						}
					}
				}

				if (otherAddresses > 1) {
					toAddress = AddressType.Multiple;
				}
			}
		} else if (txType == TxType.Contract2Contract) {
			//Is this contract
			let isThisContract;
			if (item.inputs[0].address == item.outputs[0].address
				&& item.inputs[0].address == walletAddress) {
				isThisContract = true;
			} else {
				isThisContract = false;
			}

			if (txInOut == TxInOut.In) {
				//Input TX
				if (isThisContract) {
					if (item.inputs.length > 1) {
						fromAddress = item.inputs[1].address;
					} else {
						fromAddress = item.inputs[0].address;
					}

					toAddress = walletAddress;
				} else {
					fromAddress = item.inputs[0].address;
					toAddress = walletAddress;
				}
			} else if (txInOut == TxInOut.Out
				|| txInOut == TxInOut.Mixed) {
				//Output TX
				if (isThisContract) {
					if (txInOut == TxInOut.Mixed && item.inputs.length == 2) {
						fromAddress = item.inputs[1].address;
					} else {
						fromAddress = item.inputs[0].address;
					}

					toAddress = walletAddress;
				} else {
					fromAddress = walletAddress;
					toAddress = item.outputs[0].address;
				}

				if (fromAddress == toAddress || txInOut == TxInOut.Mixed) {
					let otherAddresses = 0;
					for (let j = 0; j < item.outputs.length; j++) {
						let output = item.outputs[j];

						if (output.address != fromAddress
							&& output.address != FEE_ADDRESS) {
							otherAddresses++;
						}
					}

					if (otherAddresses > 1) {
						toAddress = AddressType.Multiple;
					} else {
						if (item.outputs.length > 1) {
							toAddress = item.outputs[1].address;
						} else {
							toAddress = item.outputs[0].address;
						}
					}
				}
			}
		} else if (txType == TxType.Wallet2Contract) {
			fromAddress = item.inputs[0].address;
			toAddress = item.outputs[0].address;
		} else if (txType == TxType.Contract2Wallet) {
			fromAddress = item.inputs[0].address;
			toAddress = item.outputs[0].address;
		}

		if (txInOut == undefined) {
			fromAddress = toAddress = walletAddress;
		}

		if (txInOut == TxInOut.Out && txType == TxType.Contract2Wallet) {
			let minDiff = 9999999999;
			let minDiffIndex = -1;
			
			for (let i = 0; i < item.outputs.length; i++) {
				let output = item.outputs[i];

				if (output.address == FEE_ADDRESS) continue;

				let transferVal = Math.abs(totalTransferedAssets.value);

				let newDiff = Math.abs(transferVal - output.value);
				if (newDiff < minDiff) {
					minDiff = newDiff
					minDiffIndex = i;
				}
			}

			if (minDiffIndex > -1) {
				toAddress = item.outputs[minDiffIndex].address;
			}
		}

		//Tx
		formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.id) + '"><i class="fas fa-link text-info"></i></a><span class="d-inline d-lg-none text-white float-end">' + formatDateString((isMempool) ? item.creationTimestamp : item.timestamp) + '</span></td>';

		//Timestamp
		formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString((isMempool) ? item.creationTimestamp : item.timestamp) + '</td>';

		//Block nr.
		let blockNr = item.inclusionHeight;

		let classString;
		let inOutString;
		if (txInOut == TxInOut.In) {
			classString = 'text-success';
			inOutString = 'In';
		} else if (txInOut == TxInOut.Out) {
			classString = 'text-danger';
			inOutString = 'Out';
		} else if (txInOut == TxInOut.Mixed) {
			classString = 'text-warning';
			inOutString = 'Mixed';
		} else if (txInOut == undefined) {
			classString = 'text-info';
			inOutString = 'Consolidation';
		}

		let smartString = '<span class="text-info" title="Smart Contract interaction. Check transaction link for full details."> (SC)</span>';

		if (txType == TxType.Contract2Contract) {
			inOutString += smartString;
		}

		formattedResult += '<td><span class="d-lg-none"><strong>Block: </strong></span>' + ((isMempool) ? item.outputs[0].creationHeight : '<a href="' + getBlockUrl(item.blockId) + '">' + blockNr + '</a>') + '<span class="d-inline d-lg-none float-end"><strong>Type: </strong><span class="' + classString + '">' + inOutString + '</span></span></td>';
		
		// In or Out tx.
		formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Type: </strong></span><span class="' + classString + '">' + inOutString + '</span></td>';
		
		//From
		addAddress(fromAddress);
		let formattedAddressString = formatTxAddressString(fromAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span>' + formattedAddressString + '</td>';
		
		//To
		addAddress(toAddress);
		formattedAddressString = formatTxAddressString(toAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span>' + formattedAddressString + '</td>';

		//Status
		formattedResult += '<td><span class="d-lg-none"><strong>Status: </strong></span><span class="' + ((isMempool) ? 'text-warning' : 'text-success' ) + '">' + ((isMempool) ? 'Pending' : 'Confirmed') + '</span><span class="d-inline d-lg-none text-white float-end"><strong>Fee: </strong>' + formatErgValueString(fee) + '</span></td>';
		
		//Fee
		formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Fee: </strong></span>' + formatErgValueString(fee) + '</td>';

		//Value
		if (txInOut != TxInOut.Mixed) {
			if (totalTransferedAssets.value < 0) totalTransferedAssets.value *= -1;

			let assetKeys = Object.keys(totalTransferedAssets.assets);
			for (let k = 0; k < assetKeys.length; k++) {
				let asset = totalTransferedAssets.assets[assetKeys[k]];
				if (asset.amount < 0) asset.amount *= -1;
			}
		}

		let assets = ' ';
		let assetsFull = ' ';
		let tokensToShow = 2;
		let keys = Object.keys(totalTransferedAssets.assets)
		let assetsI = 0;
		let mixedPlus = '';
		if (txInOut == TxInOut.Mixed || txInOut == TxInOut.In) {
//			mixedPlus = '+';
		}
		let endAdd = '';
		let assetITotal = 0;
		for (let j = 0; j < keys.length; j++) {
			let asset = totalTransferedAssets.assets[keys[j]];

			if (asset.amount != 0) {
				assetITotal++;
			}
		}

		for (let j = 0; j < keys.length; j++) {
			let asset = totalTransferedAssets.assets[keys[j]];

			if (asset.amount == 0) {
				continue;
			}

			let assetPrice = undefined;
			if (gotPrices && prices[asset.tokenId] != undefined) {
			//	assetPrice = formatAssetDollarPriceString(asset.amount, asset.decimals, asset.tokenId);
			}

			let assetsString = '<br><strong><span class="text-white">' + (asset.amount > 0 ? mixedPlus : '') + formatAssetValueString(asset.amount, asset.decimals, 4) + '</span></strong> ' + getAssetTitle(asset, false) + (assetPrice == undefined ? '' : ' <span class="text-light">' + assetPrice +'</span>');

			assetsFull += assetsString;
			
			if (assetsI > tokensToShow) {
				assetsI++;
				continue;
			}

			assets += assetsString;

			if (assetsI == tokensToShow && assetITotal > tokensToShow + 1) {
				assets += '<p>...</p><p><strong><a href="#" onclick="showFullValue(event, ' + (i + mempoolIndexOffset) + ')">Show all</a></strong></p>';

				endAdd = '';
			}

			assetsI++;
		}

		if (endAdd != '') {
			assetsFull += endAdd;
		}

		let ergDollarValue = undefined;
		if (gotPrices) {
		//	ergDollarValue = formatAssetDollarPrice(totalTransferedAssets.value, ERG_DECIMALS, 'ERG');
		}

		let ergValueString = '';
		if (totalTransferedAssets.value != 0) {
			ergValueString = (totalTransferedAssets.value > 0 ? mixedPlus : '') + formatErgValueString(totalTransferedAssets.value, 5) + (ergDollarValue == undefined ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>')
formatErgValueString(totalTransferedAssets.value, 5) + (ergDollarValue == undefined ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>');
		} else {
			assetsFull = assets.substr(5);
			assets = assets.substr(5);
		}

		if (totalTransferedAssets.value == 0 && assetsI == 0) {
			assets = '/';
			assetsFull = '/';
		}

		valueFields[i + mempoolIndexOffset] = ergValueString + assets;
		valueFieldsFull[i + mempoolIndexOffset] = ergValueString + assetsFull;

		formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span><span id="txValue' + (i + mempoolIndexOffset) + '">' + valueFieldsFull[i + mempoolIndexOffset] + '</span></td></tr>';
	}

	if (isMempool) {
		mempoolIndexOffset = transactionsJson.items.length;
	}

	return formattedResult;
}

function onGotOwnedNftInfo(nftInfos, message) {
	if (nftInfos == undefined || nftInfos == null || nftInfos.length == 0) return;

	nftInfos.sort((a, b) => {
		return a.data.isBurned == 't' ? 1 : -1;
	});

	nftInfos.sort((a, b) => {
		if (a.data.isBurned != 't'
			|| b.data.isBurned != 't') {
			return 0;
		}

		return a.data.name > b.data.name ? 1 : -1;
	});

	nftInfos.sort((a, b) => {
		if (a.data.isBurned == 't'
			|| b.data.isBurned == 't') {
			return 0;
		}

		return a.data.name > b.data.name ? 1 : -1;
	});

	let html = [];
	nftsCount = 0;
	html['token'] = '';
	html[NFT_TYPE.Image] = '';
	html[NFT_TYPE.Audio] = '';
	html[NFT_TYPE.Video] = '';
	html[NFT_TYPE.ArtCollection] = '';
	html[NFT_TYPE.FileAttachment] = '';
	html[NFT_TYPE.MembershipToken] = '';
	for (let i = 0; i < nftInfos.length; i++) {
		if (!nftInfos[i].isNft) continue;

		let imgSrc = '';
		let cSrc = '';
		let nftHolderId = '';
		let nftContentHolderId = '';

		switch (nftInfos[i].type) {
			case NFT_TYPE.Image:
				if (nftInfos[i].link.ipfsCid) {
					cSrc = IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nftInfos[i].link.url;
				} else {
					cSrc = nftInfos[i].link.url;
				}
				imgSrc = './images/nft-image.png';
				nftHolderId = '#nftImagesHolder';
				nftContentHolderId = '#nftImagesContentHolder';
				break;
			case NFT_TYPE.Audio:
				imgSrc = './images/nft-audio.png';
				nftHolderId = '#nftAudioHolder';
				nftContentHolderId = '#nftAudioContentHolder';
				break;
			case NFT_TYPE.Video:
				imgSrc = './images/nft-video.png';
				nftHolderId = '#nftVideoHolder';
				nftContentHolderId = '#nftVideoContentHolder';
				break;
			case NFT_TYPE.ArtCollection:
				imgSrc = './images/nft-artcollection.png';;
				nftHolderId = '#nftArtCollectionHolder';
				nftContentHolderId = '#nftArtCollectionContentHolder';
				break;
			case NFT_TYPE.FileAttachment:
				imgSrc = './images/nft-file.png';
				nftHolderId = '#nftFileHolder';
				nftContentHolderId = '#nftFileContentHolder';
				break;
			case NFT_TYPE.MembershipToken:
				imgSrc = './images/nft-membership.png';
				nftHolderId = '#nftMembershipHolder';
				nftContentHolderId = '#nftMembershipContentHolder';
				break;
		}

		html[nftInfos[i].type] += '<a href="' + getTokenUrl(nftInfos[i].data.id) + '"><div class="card m-1" style="width: 100px;"><div class="cardImgHolder"><img onload="onNftImageLoaded(this, \'nft-img-owned\')" onerror="onNftImageLoaded(this, \'nft-img-owned\')" csrc="' + cSrc + '" src="' + imgSrc + '" class="nft-img-owned card-img-top p-4"></div><div class="card-body p-2"><p class="card-text">' + nftInfos[i].data.name + '</p></div></div></a>';

		$(nftHolderId).show();

		nftsCount++;
	}

	if (nftsCount > 0) {
		$('#nftImagesContentHolder').html(html[NFT_TYPE.Image]);
		$('#nftAudioContentHolder').html(html[NFT_TYPE.Audio]);
		$('#nftVideoContentHolder').html(html[NFT_TYPE.Video]);
		$('#nftArtCollectionContentHolder').html(html[NFT_TYPE.ArtCollection]);
		$('#nftFileContentHolder').html(html[NFT_TYPE.FileAttachment]);
		$('#nftMembershipContentHolder').html(html[NFT_TYPE.MembershipToken]);

		$('#nftsHolder').show();
		$('#nftsTitle').html('<strong>Owned NFTs</strong> (+' + nftsCount + ') ');
		$('#hideAllNftsAction').hide();
	}
}

function loadOwnedNfts() {
	if (!loadingOwnedNfts) {
		loadingOwnedNfts = true;

		loadMoreNfts(10, 'nft-img-owned');
	}
}

function loadIssuedNfts() {
	if (!loadingIssuedNfts) {
		loadingIssuedNfts = true;

		loadMoreNfts(10, 'nft-img-issued');
	}
}

function loadMoreNfts(amount, type) {
	let loadIndex = 0;
	$('.' + type).each(function (index, element) {
		let cSrc = $(element).attr('csrc');
		let src = $(element).attr('src');

		if (loadIndex >= amount) {
			return;
		}

		if (cSrc && cSrc != src) {
			$(element).attr('src', cSrc);

			loadIndex++;
		}
	});
}

function onNftImageLoaded(element, type) {
	let cSrc = $(element).attr('csrc');
	let src = $(element).attr('src');

	if (cSrc == src) {
		$(element).removeClass('p-4');
		$(element).attr('csrc', '');
		
		setTimeout(loadMoreNfts, 50, 1, type);
	}
}

function showNfts(e) {
	$('#nftsShowAll').show();
	$('#showAllNftsAction').hide();
	$('#hideAllNftsAction').show();
	$('#nftsTitle').html('<strong>Owned NFTs</strong>');

	scrollToElement($('#nftsTitle'));

	loadOwnedNfts();

	e.preventDefault();
}

function hideNfts(e) {
	$('#nftsShowAll').hide();
	$('#showAllNftsAction').show();
	$('#hideAllNftsAction').hide();
	$('#nftsTitle').html('<strong>Owned NFTs</strong> (+' + nftsCount + ') ');

	scrollToElement($('#nftsTitle'));

	e.preventDefault();
}

function printTransactions() {
    if (offset == 0) {
        getMempoolData()
    } else {
        mempoolRequestDone = true;
    }

    getTransactionsData();
}

function getMempoolData() {
    let mempoolUrl = getMempoolUrl();

    let jqxhr = $.get(mempoolUrl, function(data) {
        mempoolData = data;
		totalTransactions += mempoolData.total;
		mempoolCount = mempoolData.total

		if (mempoolData.total > 0) {
			for (let i = 0; i < mempoolData.items.length; i++) {
				mempoolTxIds.push(mempoolData.items[i].id);
			}

			showNotificationPermissionToast();
		}
    })
    .fail(function() {
        console.log('Mempool transactions fetch failed.');
    })
    .always(function() {
        mempoolRequestDone = true;
        onMempoolAndTransactionsDataFetched();
    });
}

function checkMempoolChanged() {
	let mempoolUrl = getMempoolUrl();

    let jqxhr = $.get(mempoolUrl, function(data) {
    	let newMempoolCount = data.total;

    	if (newMempoolCount != mempoolCount) {
    		let balanceUrl = getTxsDataUrl();

			var jqxhr = $.get(balanceUrl,
			function(data) {
				for (let i = 0; i < data.items.length; i++) {
					let found = false;
					for (let j = 0; j < mempoolTxIds.length; j++) {
						if (data.items[i].id == mempoolTxIds[j]) {
							onMempoolTxConfirmed();
							found = true;
							break;
						}
					}

					if (found) {
						break;
					}

					if (i == data.items.length - 1
						&& !found
						&& newMempoolCount == 0) {
						onMempoolEmptyNoConfirmation();
						break;
					}
				}
			});    		
    	}
    });
}

function onMempoolTxConfirmed() {
	if (Notification.permission === 'granted') {
		const img = 'https://ergexplorer.com/images/logo.png';
		const text = 'Transaction on address ' + walletAddress + ' has been confirmed.';
		txNotification = new Notification('Transaction confirmed', { body: text, icon: img });
		
		txNotification.onclick = function(x) {
			window.focus();
			this.close();
			location.reload();
		};
	}

	if (mempoolInterval != undefined) {
		clearTimeout(mempoolInterval);
	}

	if (document.hasFocus()) {
		location.reload();
	}
}

function onMempoolEmptyNoConfirmation() {
	if (Notification.permission === 'granted') {
		const img = 'https://ergexplorer.com/images/logo.png';
		const text = 'Transaction on address ' + walletAddress + ' status updated.';
		const notification = new Notification('Transaction updated', { body: text, icon: img });
		
		notification.onclick = function(x) {
			window.focus();
			this.close();
			location.reload();
		};
	}

	if (mempoolInterval != undefined) {
		clearTimeout(mempoolInterval);
	}

	if (document.hasFocus()) {
		location.reload();
	}
}

function getTxsUrl() {
	let balanceUrl = API_HOST_2 + 'addresses/' + walletAddress + '/balance/total';
	if (networkType == 'testnet') {
		balanceUrl = API_HOST + 'api/v1/addresses/' + walletAddress + '/balance/total';
	}

	return balanceUrl;
}

function getTxsDataUrl() {
	if (params['filterTxs'] == undefined) {
		return API_HOST_2 + 'addresses/' + walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE;
	} else {
		let tokenId = params['tokenId'];
		let minValue = params['minValue'];
		let maxValue = params['maxValue'];
		let fromDate = params['fromDate'];
		let toDate = params['toDate'];
		let txType = params['txType'];

		let filterApiUrl = ERGEXPLORER_API_HOST + 'user/getUserTransactions?filterTx&address=' + walletAddress + '&offset=' + offset + '&limit=' + ITEMS_PER_PAGE;

		if (tokenId != undefined) {
			filterApiUrl += '&tokenId=' + tokenId;
		}

		if (minValue != undefined) {
			filterApiUrl += '&minValue=' + minValue;
		}

		if (maxValue != undefined) {
			filterApiUrl += '&maxValue=' + maxValue;
		}

		if (fromDate != undefined) {
			filterApiUrl += '&fromDate=' + fromDate;
		}

		if (toDate != undefined) {
			filterApiUrl += '&toDate=' + toDate;
		}

		if (txType != 'all') {
			filterApiUrl += '&txType=' + txType;
		}

		return filterApiUrl;
	}
}

function getMempoolUrl() {
	let mempoolUrl = API_HOST_2 + 'mempool/transactions/byAddress/' + walletAddress;

    if (networkType == 'testnet') {
        mempoolUrl = API_HOST_2 + 'api/v1/mempool/transactions/byAddress/' + walletAddress
    }

    return mempoolUrl;
}

function trackTransaction() {
	if (Notification.permission !== 'granted') {
		return;
	}

	if (mempoolInterval != undefined) {
		return;
	}

	showCustomToast('Monitoring mempool<span id="dots">...</span>');
	setInterval(animateDots, 300);

	mempoolInterval = setInterval(checkMempoolChanged, 30000);
}

function onNotificationToastYes() {
	requestNotificationPermission(() => {
		trackTransaction();
	});

	hideNotificationPermissionToast();	
	trackTransaction();
}

function onNotificationToastNo() {
	hideNotificationPermissionToast();
}

function getTransactionsData() {
	var jqxhr = $.get(getTxsDataUrl(), function(data) {
        transactionsData = data;
		totalTransactions += transactionsData.total;
    })
    .fail(function() {
        console.log('Transactions fetch failed.');
    })
    .always(function() {
        transactionsRequestDone = true;
        onMempoolAndTransactionsDataFetched();
    });
}

function onMempoolAndTransactionsDataFetched() {
    if (!mempoolRequestDone || !transactionsRequestDone) {
		return;
	}

	if (printed) {
		return;
	}

	formattedResult += getFormattedTransactionsString(mempoolData, true);
	formattedResult += getFormattedTransactionsString(transactionsData, false);

	setupPagination(transactionsData.total);

	$('#totalTransactions').html('<strong>Total transactions:</strong> ' + totalTransactions);

	if (totalTransactions > 0) {
		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();
	} else {
		showLoadError('No transactions.');
	}

	$('#txLoading').hide();

	getAddressesInfo();

	printed = true;
}

function getChart(tokenId, canvasId, holderId) {
	let url = ERGEXPLORER_API_HOST + 'user/getAddressStats?address=' + walletAddress + '&tokenId=' + tokenId + '&type=1';

	if (params['fromDate'] != undefined) {
		url += '&fromDate=' + params['fromDate'];
	}

	if (params['toDate'] != undefined) {
		url += '&toDate=' + params['toDate'];
	}

	$.get(url, function(data) {
		if (data.items.length < 2) {
			return;
		}

		let step = 1;
		if (data.items.length > 25) {
			step = parseInt(data.items.length / 25);
		}

		let lastStep;
		let diff = 0;
		let diffI = 0;
		let newData = [];
		data.items = data.items.filter(function (_, index) {
			let item = data.items[index];
			if (index == 0) {
				newData.push(item);
				lastStep = item.value;
				diff = 0;

				return true;
			}

			if (index == data.items.length - 1) {
				if (tokenId != 'ERG') {
					for (let i = 0; i < tokensArray.length; i++) {
						let token = tokensArray[i];
						if (token.tokenId == tokenId) {
							item.value = token.amount / Math.pow(10, token.decimals);
						}
					}
				}

				newData.push(item);

				return true;
			}

			let temp = Math.abs(lastStep - item.value);
			if (temp > diff) {
				diff = temp;
				diffI = index;
			}

			if (index % step === 0) {
				data.items[index].value = data.items[diffI].value;

				newData.push(item);
				lastStep = item.value;
				diff = 0;

				return true;
			}

			return false;
		});

		const rootStyles = getComputedStyle(document.documentElement);

		// Get the value of the global CSS variable
		const primaryColor = rootStyles.getPropertyValue('--main-color').trim();

		new Chart(
		    document.getElementById(canvasId),
		    {
		      type: 'line',
		      options: {
		      	responsive: true,
		        animation: true,
		        fill: false,
		        borderColor: primaryColor,
		        plugins: {
		          legend: {
		            display: false
		          },
		          tooltip: {
		            enabled: true
		          }
		        },
		        scales: {
			        y: {
			            beginAtZero: true
			        }
			    }
		      },
		      data: {
		        labels: data.items.map(mapLabel),
		        datasets: [
		          {
		            data: data.items.map(row => row.value)
		          }
		        ]
		      }
		    }
		  );

		$('#' + holderId).show();
	});
}

function mapLabel(row, index) {
	let dateString = new Date(parseInt(row.timestamp)).toLocaleDateString();

	if (dateString != tempDate) {
		tempDate = dateString;
		return dateString;
	} else {
		return '';
	}
}

function getOfficialExplorereAddressUrl(address) {
	if (networkType == 'testnet') {
		return 'https://testnet.ergoplatform.com/addresses/' + address;
	} else {
		return 'https://explorer.ergoplatform.com/addresses/' + address;
	}
}

function showAllTokens(e) {
	$('#otherTokens').html(tokensContentFull);
	scrollToElement($('#tokensHolder'));

	e.preventDefault();
}

function hideAllTokens(e) {
	$('#otherTokens').html(tokensContent);
	scrollToElement($('#tokensHolder'));

	e.preventDefault();
}

function showAllFinancialTokens(e) {
	$('#financialTokens').html(financialTokensContentFull);
	scrollToElement($('#tokensHolder'));

	e.preventDefault();
}

function hideAllFinancialTokens(e) {
	$('#financialTokens').html(financialTokensContent);
	scrollToElement($('#tokensHolder'));

	e.preventDefault();
}

function showFullValue(e, index) {
	$('#txValue' + index).html(valueFieldsFull[index]);

	e.preventDefault();
}

function hideFullValue(e, index) {
	$('#txValue' + index).html(valueFields[index]);
	scrollToElement($('#txValue' + index));

	e.preventDefault();
}

function copyWalletAddress(e) {
	copyToClipboard(e, walletAddress);
}

function copyAddress(e, element) {
	copyToClipboard(e, $(element).attr('title'));
}

function setupQrCode() {
	$('#showQRcodeBtn').on('click', function () {
		showQRcode(walletAddress);
	});

	$('#qrCodeBack').on('click', function () {
		$('#qrCodeBack').fadeOut();

		$('body').css('height', 'inherit');
		$('body').css('overflow-y', 'auto');
	});
}

function setupDatePicker() {
    datePickerFrom = new tempusDominus.TempusDominus(document.getElementById('datetimepicker1'), {
	  allowInputToggle: true,
	  display: {
	    viewMode: 'calendar',
	    components: {
	      decades: false,
	      year: true,
	      month: true,
	      date: true,
	      hours: false,
	      minutes: false,
	      seconds: false
	    },
	    buttons: {
	      today: true,
	      clear: true,
	      close: true
	    }
	  }
	});

    datePickerFrom.dates.formatInput = function(date) {
    	{
    		if (date == undefined) {
    			return '';
    		}

    		return date.toLocaleDateString(undefined,
    			{  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}) + ' 00:00 AM';
    	}
	}

    datePickerTo = new tempusDominus.TempusDominus(document.getElementById('datetimepicker2'), {
	  allowInputToggle: true,
	  display: {
	    viewMode: 'calendar',
	    components: {
	      decades: false,
	      year: true,
	      month: true,
	      date: true,
	      hours: false,
	      minutes: false,
	      seconds: false
	    },
	    buttons: {
	      today: true,
	      clear: true,
	      close: true
	    }
	  }
	});

    datePickerTo.dates.formatInput = function(date) {
    	{
    		if (date == undefined) {
    			return '';
    		}

    		return date.toLocaleDateString(undefined,
    			{  year: 'numeric',
		  month: '2-digit',
		  day: '2-digit',
		}) + ' 11:59 PM';
    	}
	}
}

function filterTransactions(e) {
	e.preventDefault();

	clearFilterParams();

	params['filterTxs'] = 'true';

	let tokenId = $('#tokenId').val();
	if (tokenId.trim() != '') {
		params['tokenId'] = tokenId;
	}
	let minValue = $('#minValue').val();
	if (minValue.trim() != '') {
		params['minValue'] = minValue;
	}
	let maxValue = $('#maxValue').val();
	if (maxValue.trim() != '') {
		params['maxValue'] = maxValue;
	}

	if (datePickerFrom.dates._dates.length > 0) {
		params['fromDate'] = datePickerFrom.dates._dates[0].getTime();
	}

	if (datePickerTo.dates._dates.length > 0) {
		params['toDate'] = datePickerTo.dates._dates[0].getTime();
	}

	let txType = $('#txType').val();
	if (txType == undefined) {
		params['txType'] = 'all';
	} else {
		params['txType'] = txType;
	}

	window.location.assign(getCurrentUrlWithParams());
}

function clearFilter(e) {
	e.preventDefault();	

	clearFilterParams();

	window.location.assign(getCurrentUrlWithParams());
}

function clearFilterParams() {
	delete params['filterTxs'];
	delete params['tokenId'];
	delete params['minValue'];
	delete params['maxValue'];
	delete params['fromDate'];
	delete params['toDate'];
	delete params['txType'];

	params['offset'] = 0;
}

function onGotIssuedNftInfo(nftInfos, message) {
	if (nftInfos == undefined || nftInfos == null || nftInfos.length == 0) return;

	nftInfos.sort((a, b) => {
		return a.data.isBurned == 't' ? 1 : -1;
	});

	nftInfos.sort((a, b) => {
		if (a.data.isBurned != 't'
			|| b.data.isBurned != 't') {
			return 0;
		}

		return a.data.name > b.data.name ? 1 : -1;
	});

	nftInfos.sort((a, b) => {
		if (a.data.isBurned == 't'
			|| b.data.isBurned == 't') {
			return 0;
		}

		return a.data.name > b.data.name ? 1 : -1;
	});

	let html = [];
	issuedNftsCount = 0;
	html['token'] = '';
	html[NFT_TYPE.Image] = '';
	html[NFT_TYPE.Audio] = '';
	html[NFT_TYPE.Video] = '';
	html[NFT_TYPE.ArtCollection] = '';
	html[NFT_TYPE.FileAttachment] = '';
	html[NFT_TYPE.MembershipToken] = '';
	for (let i = 0; i < nftInfos.length; i++) {		
		let nftHolderId = '';
		let nftContentHolderId = '';

		if (nftInfos[i].isNft) {
			let imgSrc = '';
			let cSrc = '';

			switch (nftInfos[i].type) {
				case NFT_TYPE.Image:
					if (nftInfos[i].link.ipfsCid) {
						cSrc = IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nftInfos[i].link.url;
					} else {
						cSrc = nftInfos[i].link.url;
					}
					imgSrc = './images/nft-image.png';
					nftHolderId = '#issuedNftImagesHolder';
					nftContentHolderId = '#issuedNftImagesContentHolder';
					break;
				case NFT_TYPE.Audio:
					imgSrc = './images/nft-audio.png';
					nftHolderId = '#issuedNftAudioHolder';
					nftContentHolderId = '#issuedNftAudioContentHolder';
					break;
				case NFT_TYPE.Video:
					imgSrc = './images/nft-video.png';
					nftHolderId = '#issuedNftVideoHolder';
					nftContentHolderId = '#issuedNftVideoContentHolder';
					break;
				case NFT_TYPE.ArtCollection:
					imgSrc = './images/nft-artcollection.png';;
					nftHolderId = '#issuedNftArtCollectionHolder';
					nftContentHolderId = '#issuedNftArtCollectionContentHolder';
					break;
				case NFT_TYPE.FileAttachment:
					imgSrc = './images/nft-file.png';
					nftHolderId = '#issuedNftFileHolder';
					nftContentHolderId = '#issuedNftFileContentHolder';
					break;
				case NFT_TYPE.MembershipToken:
					imgSrc = './images/nft-membership.png';
					nftHolderId = '#issuedNftMembershipHolder';
					nftContentHolderId = '#issuedNftMembershipContentHolder';
					break;
			}

			html[nftInfos[i].type] += '<a href="' + getTokenUrl(nftInfos[i].data.id) + '"><div class="card m-1" style="width: 100px;' + (nftInfos[i].data.isBurned == 't' ? 'border:1.5px solid red;' : '') + '"><div class="cardImgHolder"><img onload="onNftImageLoaded(this, \'nft-img-issued\')" onerror="onNftImageLoaded(this, \'nft-img-issued\')" csrc="' + cSrc + '" ' + (nftInfos[i].data.isBurned == 't' ? 'style="opacity: 0.4;"' : '') + 'src="' + imgSrc + '" class="nft-img-issued card-img-top p-4"></div><div class="card-body p-2"><p class="card-text">' + nftInfos[i].data.name + '</p></div></div></a>';
		} else {
			nftHolderId = '#issuedTokenHolder';
			nftContentHolderId = '#issuedTokenContentHolder';

			html['token'] += '<p><a href="' + getTokenUrl(nftInfos[i].data.id) + '">' + nftInfos[i].data.name + ' - ' + formatAddressString(nftInfos[i].data.id) + '</a>' + (nftInfos[i].data.isBurned == 't' ? ' (<span class="text-danger">Burned</span>)' : '') + '</p>';
		}

		$(nftHolderId).show();

		issuedNftsCount++;
	}

	$('#issuedTokenContentHolder').html(html['token']);
	$('#issuedNftImagesContentHolder').html(html[NFT_TYPE.Image]);
	$('#issuedNftAudioContentHolder').html(html[NFT_TYPE.Audio]);
	$('#issuedNftVideoContentHolder').html(html[NFT_TYPE.Video]);
	$('#issuedNftArtCollectionContentHolder').html(html[NFT_TYPE.ArtCollection]);
	$('#issuedNftFileContentHolder').html(html[NFT_TYPE.FileAttachment]);
	$('#issuedNftMembershipContentHolder').html(html[NFT_TYPE.MembershipToken]);

	$('#issuedNftsHolder').show();
	$('#issuedNftsTitle').html('<strong>Issued Assets</strong> (+' + issuedNftsCount + ') ');
	$('#hideIssuedNftsAction').hide();
}

function showIssuedNfts(e) {
	$('#nftsShowIssued').show();
	$('#showIssuedNftsAction').hide();
	$('#hideIssuedNftsAction').show();
	$('#issuedNftsTitle').html('<strong>Issued Assets</strong>');

	scrollToElement($('#issuedNftsTitle'));

	loadIssuedNfts();

	e.preventDefault();
}

function hideIssuedNfts(e) {
	$('#nftsShowIssued').hide();
	$('#showIssuedNftsAction').show();
	$('#hideIssuedNftsAction').hide();
	$('#issuedNftsTitle').html('<strong>Issued Assets</strong> (+' + issuedNftsCount + ') ');

	scrollToElement($('#issuedNftsTitle'));

	e.preventDefault();
}

function getErgopadVesting() {
	$.ajax({
	    type: 'POST',
	    url: 'https://api.ergopad.io/vesting/v2/',
	    data: JSON.stringify({addresses: [walletAddress]}),
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function(data) {
	    	let ergopadVestingData = data;

			let keys = Object.keys(ergopadVestingData);
			let totalVestingPrice = 0;
			let totalReddemablePrice = 0;
			for (let i = 0; i < tokensArray.length; i++) {
				for (let j = 0; j < keys.length; j++) {
					let vestingAsset = ergopadVestingData[keys[j]];
					for (let k = 0; k < vestingAsset.length; k++) {
						let vestingEntry = vestingAsset[k];
						let vestingEntryKeyId = vestingEntry['Vesting Key Id'];
						if (tokensArray[i].tokenId == vestingEntryKeyId) {
							totalVestingPrice += vestingEntry['Remaining'] * pricesNames[keys[j]];
							totalReddemablePrice += vestingEntry['Redeemable'] * pricesNames[keys[j]];
						}	
					}
				}
			}

			if (totalVestingPrice > 0) {
				$('#ergopadVesting').html('<a href="https://www.ergopad.io/dashboard"" target="_new"><img src="https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon"> Ergopad</a> vesting: <span class="text-light">$' + formatValue(totalVestingPrice, 2) + '</span>' + (totalReddemablePrice > 0 ? '<br><img src="https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon" style="visibility:hidden;"> <span style="font-size:0.9em;">Redeemable: $' + formatValue(totalReddemablePrice, 2) + '</span>' : ''));
				$('#ergopadVesting').show();
				$('#ergopad').show();
			}
	    }
	});
}

function getErgopadStaking() {
	$.ajax({
	    type: 'POST',
	    url: 'https://api.ergopad.io/staking/staked-all/',
	    data: JSON.stringify({addresses: [walletAddress]}),
	    contentType: 'application/json; charset=utf-8',
	    dataType: 'json',
	    success: function(data) {
	    	let ergopadStakingData = data;

			let keys = Object.keys(pricesNames);
			let totalVestingPrice = 0;
			for (let i = 0; i < keys.length; i++) {
				for (let j = 0; j < ergopadStakingData.length; j++) {
					if (keys[i] == ergopadStakingData[j].tokenName) {
						totalVestingPrice += ergopadStakingData[j]['addresses'][walletAddress].totalStaked * pricesNames[keys[i]];
					}
				}
			}

			if (totalVestingPrice == 0) return;

			$('#ergopadStaking').html('<a href="https://www.ergopad.io/dashboard"" target="_new"><img src="https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon"> Ergopad</a> staking: <span class="text-light">$' + formatValue(totalVestingPrice, 2) + '</span>');
			$('#ergopadStaking').show();
			$('#ergopad').show();
	    }
	});
}

function onInitRequestsFinished() {
	if (!checkedUser) {
		return;
	}

    printAddressSummary();
	printTransactions();
}

function getAddressInfo() {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'addressbook/getAddressInfo?address=' + walletAddress,
	function (data) {
		if (data.total == 0) return;

		let title = data.items[0].name;
		let type = ''
		if (data.items[0].type != '') {
			type += ' (<span class="' + getOwnerTypeClass(data.items[0].type) + '">' + data.items[0].type + '</span>)';
		}

		let html = title;
		if (data.items[0].name != '') {
			html = '<a href="' + data.items[0].url + '" target="_new"><span class="">' + title + '</span></a>' + type;
		}

		$('#verifiedOwner').html(html);
		$('#verifiedOwnerHolder').show();

		if (data.items[0].urltype != '') {
			$('#addressName').html(data.items[0].urltype);
			$('#addressNameHolder').show();
		}
	});
}