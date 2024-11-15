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
var unspentBoxesCount = 0;
var printedAddressSummary = false;
var scamList = [];

const N2T_SWAP_SELL_TEMPLATE_ERG = 'd803d6017300d602b2a4730100d6037302eb027201d195ed92b1a4730393b1db630872027304d804d604db63087202d605b2a5730500d606b2db63087205730600d6077e8c72060206edededededed938cb2720473070001730893c27205d07201938c72060173099272077e730a06927ec172050699997ec1a7069d9c72077e730b067e730c067e720306909c9c7e8cb27204730d0002067e7203067e730e069c9a7207730f9a9c7ec17202067e7310067e9c73117e7312050690b0ada5d90108639593c272087313c1720873147315d90108599a8c7208018c72080273167317'
const N2T_SWAP_SELL_TEMPLATE_SPF = 'd804d601b2a4730000d6027301d6037302d6049c73037e730405eb027305d195ed92b1a4730693b1db630872017307d806d605db63087201d606b2a5730800d607db63087206d608b27207730900d6098c720802d60a95730a9d9c7e997209730b067e7202067e7203067e720906edededededed938cb27205730c0001730d93c27206730e938c720801730f92720a7e7310069573117312d801d60b997e7313069d9c720a7e7203067e72020695ed91720b731492b172077315d801d60cb27207731600ed938c720c017317927e8c720c0206720b7318909c7e8cb2720573190002067e7204069c9a720a731a9a9c7ec17201067e731b067e72040690b0ada5d9010b639593c2720b731cc1720b731d731ed9010b599a8c720b018c720b02731f7320'
const N2T_SWAP_BUY_TEMPLATE_ERG = 'd802d6017300d602b2a4730100eb027201d195ed92b1a4730293b1db630872027303d804d603db63087202d604b2a5730400d6059d9c7e99c17204c1a7067e7305067e730606d6068cb2db6308a773070002edededed938cb2720373080001730993c27204d072019272057e730a06909c9c7ec17202067e7206067e730b069c9a7205730c9a9c7e8cb27203730d0002067e730e067e9c72067e730f050690b0ada5d90107639593c272077310c1720773117312d90107599a8c7207018c72070273137314'
const N2T_SWAP_BUY_TEMPLATE_SPF = 'd802d601b2a4730000d6029c73017e730205eb027303d195ed92b1a4730493b1db630872017305d804d603db63087201d604b2a5730600d60599c17204c1a7d606997e7307069d9c7e7205067e7308067e730906ededededed938cb27203730a0001730b93c27204730c927205730d95917206730ed801d607b2db63087204730f00ed938c7207017310927e8c7207020672067311909c7ec17201067e7202069c7e9a72057312069a9c7e8cb2720373130002067e7314067e72020690b0ada5d90107639593c272077315c1720773167317d90107599a8c7207018c72070273187319'
const T2T_SWAP_TEMPLATE_ERG = 'd805d6017300d602b2a4730100d6037302d6047303d6057304eb027201d195ed92b1a4730593b1db630872027306d80ad606db63087202d607b2a5730700d608b2db63087207730800d6098c720802d60a7e720906d60bb27206730900d60c7e8c720b0206d60d7e8cb2db6308a7730a000206d60e7e8cb27206730b000206d60f9a720a730cedededededed938cb27206730d0001730e93c27207d07201938c7208017203927209730f927ec1720706997ec1a7069d9c720a7e7310067e73110695938c720b017203909c9c720c720d7e7204069c720f9a9c720e7e7205069c720d7e720406909c9c720e720d7e7204069c720f9a9c720c7e7205069c720d7e72040690b0ada5d90110639593c272107312c1721073137314d90110599a8c7210018c72100273157316'
const T2T_SWAP_TEMPLATE_SPF = 'd805d601b2a4730000d6027301d6037302d6049c73037e730405d6057305eb027306d195ed92b1a4730793b1db630872017308d80ad606db63087201d607b2a5730900d608db63087207d609b27208730a00d60a8c720902d60b95730b9d9c7e99720a730c067e7203067e730d067e720a06d60cb27206730e00d60d7e8c720c0206d60e7e8cb27206730f000206d60f9a720b7310ededededededed938cb2720673110001731293c272077313938c720901720292720a731492c17207c1a79573157316d801d610997e7317069d9c720b7e7318067e72030695ed917210731992b17208731ad801d611b27208731b00ed938c721101731c927e8c721102067210731d95938c720c017202909c720d7e7204069c720f9a9c720e7e7205067e720406909c720e7e7204069c720f9a9c720d7e7205067e72040690b0ada5d90110639593c27210731ec17210731f7320d90110599a8c7210018c72100273217322'
const SPECTRUM_LP_DEPOSIT = 'd802d601b2a4730000d6027301eb027302d195ed92b1a4730393b1db630872017304d80bd603db63087201d604b2a5730500d605b27203730600d6067e9973078c72050206d6077ec1720106d6089d9c7e72020672067207d609b27203730800d60a7e8c72090206d60b9d9c7e7309067206720ad60cdb63087204d60db2720c730a00ededededed938cb27203730b0001730c93c27204730d95ed8f7208720b93b1720c730ed801d60eb2720c730f00eded92c1720499c1a77310938c720e018c720901927e8c720e02069d9c99720b7208720a720695927208720b927ec1720406997ec1a706997e7202069d9c997208720b720772067311938c720d018c720501927e8c720d0206a17208720b90b0ada5d9010e639593c2720e7312c1720e73137314d9010e599a8c720e018c720e0273157316';
const SPECTRUM_YF_DEPOSIT = 'd803d601b2a4730000d6027301d6037302eb027303d195ed92b1a4730493b1db630872017305d805d604db63087201d605b2a5730600d606c57201d607b2a5730700d6088cb2db6308a773080002ededed938cb27204730900017202ed93c2720572039386027206730ab2db63087205730b00ededededed93cbc27207730c93d0e4c672070608720393e4c67207070e72029386028cb27204730d00017208b2db63087207730e009386028cb27204730f00019c72087e731005b2db6308720773110093860272067312b2db6308720773130090b0ada5d90109639593c272097314c1720973157316d90109599a8c7209018c72090273177318';
const SPECTRUM_YF_REDEEM = 'd802d601b2a5730400d60290b0ada5d90102639593c272027305c1720273067307d90102599a8c7202018c7202027308ededed93c272017309938602730a730bb2db63087201730c0072027202730d';
const SPECTRUM_LP_REDEEM = 'd806d602db63087201d603b2a5730400d604b2db63087203730500d605b27202730600d6067e8cb2db6308a77307000206d6077e9973088cb272027309000206ededededed938cb27202730a0001730b93c27203730c938c7204018c720501927e99c17203c1a7069d9c72067ec17201067207927e8c720402069d9c72067e8c72050206720790b0ada5d90108639593c27208730dc17208730e730fd90108599a8c7208018c72080273107311';

$(function() {
	walletAddress = getWalletAddressFromUrl();	

	setDocumentTitle(walletAddress);
	
    getUser();
    getScamList();
    getPrices(onInitRequestsFinished);
    getIssuedNfts(walletAddress, onGotIssuedNftInfo, false);

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

function getScamList(callback) {
	$.get(ERGEXPLORER_API_HOST + 'tokens/getScam',
	function (data) {
		scamList = data.items.map(t => t.tokenId);
	}).always(function (data) {
		onInitRequestsFinished();
	});
}

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
	if (!gotPrices || printedAddressSummary) return;

	printedAddressSummary = true;

	let balanceUrl = getTxsUrl();

	$.get(balanceUrl,
	function(data) {
		if (walletAddress == '9fnZypJQLj37k3iLSPVVczGkoSArMZenJLdU4QFaGUpyDrdzPCv') {
			data.confirmed.nanoErgs += 7660000000000;
		}
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
		let tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true, scamList.includes(tokensArray[i].tokenId)), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4), tokensArray[i].tokenId);

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

		tokensArray[i].tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true, scamList.includes(tokensArray[i].tokenId)), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4) + (tokensPrice == 0 ? '' : '<span class="text-light"> ' + tokensPriceString + '</span>'), tokensArray[i].tokenId);
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

	let outputAddress = tx.outputs[0].address;

	if (outputAddress == FEE_ADDRESS
		&& tx.outputs.length > 1) {
		outputAddress = tx.outputs[1].address;
	}

	let input0isWallet = isWalletAddress(tx.inputs[0].address);
	let output0isWallet = isWalletAddress(outputAddress);

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

function formatTxAddressString(address, formattedAddress = null) {	
	if (address == walletAddress) {
		formattedAddress = 'This Address';
	} else if (formattedAddress == null) {
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

		let minted = undefined;
		if (item.inputs[0]) {
		let mintId = item.inputs[0].boxId;
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == outputsAddress) {
				
				//Sort
				let tokensArray = sortTokens(item.outputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					if (tokensArray[k].tokenId == mintId) {
						minted = tokensArray[k];
					}
				}
			}
		}
		}

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
						totalTransferedAssets.assets[tokensArray[k].tokenId] = {};
						totalTransferedAssets.assets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
						totalTransferedAssets.assets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
						totalTransferedAssets.assets[tokensArray[k].tokenId].name = tokensArray[k].name;
						totalTransferedAssets.assets[tokensArray[k].tokenId].amount = tokensArray[k].amount;
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


		if (walletAddress == '9fnZypJQLj37k3iLSPVVczGkoSArMZenJLdU4QFaGUpyDrdzPCv' && item.id == '7b76c4cf02550f58c880ef627d934be3902e945548fa87e7c1b8ba807843503e') {
			totalTransferedAssets.value = 7660000000000;
		}

		if (walletAddress == '9gvDVNy1XvDeFoi4ZHn5v6u3tFRECMXGKbwuHbijJu6Z2hLQTQz' && item.id == '7b76c4cf02550f58c880ef627d934be3902e945548fa87e7c1b8ba807843503e') {
			totalTransferedAssets.value = -7660000000000;
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
					hasOtherAddresses = true;
				}
			}
			for (let j = 0; j < item.outputs.length; j++) {
				let output = item.outputs[j];

				if (output.address != oneaddress && output.address != FEE_ADDRESS) {
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

				//Handle multiple input addresses
				let otherAddresses = Array();
				for (let j = 0; j < item.inputs.length; j++) {
					let input = item.inputs[j];

					if (input.address != toAddress && !otherAddresses.includes(input.address)) {
						otherAddresses.push(input.address);
					}
				}

				if (fromAddress == toAddress) {
					if (otherAddresses.length == 1) {
						for (let j = 0; j < item.inputs.length; j++) {
							let output = item.inputs[j];

							if (output.address != toAddress) {
								fromAddress = output.address;
								break;
							}
						}
					}
				}

				if (otherAddresses.length > 1) {
					fromAddress = AddressType.Multiple;
				}

			} else if (txInOut == TxInOut.Out
				|| txInOut == TxInOut.Mixed) {
				//Output TX
				fromAddress = walletAddress;
				toAddress = item.outputs[0].address;

				//Handle multiple output addresses
				let otherAddresses = Array();
				for (let j = 0; j < item.outputs.length; j++) {
					let output = item.outputs[j];

					if (output.address != fromAddress && output.address != FEE_ADDRESS && !otherAddresses.includes(output.address)) {
						otherAddresses.push(output.address);
					}
				}

				if (fromAddress == toAddress) {
					if (otherAddresses.length == 1) {
						for (let j = 0; j < item.outputs.length; j++) {
							let output = item.outputs[j];

							if (output.address != fromAddress && output.address != FEE_ADDRESS) {
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
					let otherAddresses = Array();
					for (let j = 0; j < item.outputs.length; j++) {
						let output = item.outputs[j];

						if (output.address != fromAddress
							&& output.address != FEE_ADDRESS
							&& !otherAddresses.includes(output.address)) {
							otherAddresses.push(output.address);
						}
					}

					if (otherAddresses.length > 1) {
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

			if (toAddress == FEE_ADDRESS) {
				if (item.outputs.length > 1) {
					toAddress = item.outputs[1].address;
				}
			}
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

		let fromAddressIndex = 0;
		let originalFromAddressIndex = 0;
		for (let i = 0; i < item.inputs.length; i++) {
			if (item.inputs[i].address == fromAddress) {
				fromAddressIndex = i;
				originalFromAddressIndex = i;
				break;
			}
		}

		if (txInOut != TxInOut.In) {			
			let hasEnough = true;
			do {
				hasEnough = true;

				let totalSentFrom = {};
				totalSentFrom.value = 0;
				totalSentFrom.assets = {};

				for (let i = 0; i < item.inputs.length; i++) {
					let input = item.inputs[i];
					if (input.address != fromAddress) continue;

					totalSentFrom.value += input.value;
					if (input.assets) {
						for (let j = 0; j < input.assets.length; j++) {
							let asset = input.assets[j];
							if (totalSentFrom.assets[asset.tokenId] == undefined) {
								totalSentFrom.assets[asset.tokenId] = {};
								totalSentFrom.assets[asset.tokenId].amount = 0;
								totalSentFrom.assets[asset.tokenId].decimals = asset.decimals;
								totalSentFrom.assets[asset.tokenId].tokenId = asset.tokenId;
							}

							totalSentFrom.assets[asset.tokenId].amount += asset.amount;
						}
					}
				}

				if (totalSentFrom.value < totalTransferedAssets.value) hasEnough = false;
				for (let i = 0; i < totalTransferedAssets.assets.length; i++) {
					let asset = totalTransferedAssets.assets[i];
					for (let j = 0; j < totalSentFrom.assets.length; j++) {
						let sentAsset = totalSentFrom.assets[j];
						if (sentAsset.tokenId == asset.tokenId &&
							sentAsset.amount < totalTransferedAssets.amount) {
							hasEnough = false;
						}
					}
				}

				if (!hasEnough) {
					fromAddressIndex++;
					if (fromAddressIndex < item.inputs.length) {
						fromAddress = item.inputs[fromAddressIndex].address;
					} else {
						fromAddress = item.inputs[originalFromAddressIndex].address;
						break;
					}
				}

			} while (!hasEnough);
		}

		//check burn for single emissions
		let burnedAssets = {};

		for (let j = 0; j < item.inputs.length; j++) {
			let tokensArray = sortTokens(item.inputs[j].assets);
			for (let k = 0; k < tokensArray.length; k++) {
				if (burnedAssets[tokensArray[k].tokenId] == undefined) {
					burnedAssets[tokensArray[k].tokenId] = {};
					burnedAssets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
					burnedAssets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
					burnedAssets[tokensArray[k].tokenId].name = tokensArray[k].name;
					burnedAssets[tokensArray[k].tokenId].amount = tokensArray[k].amount;
				} else {
					burnedAssets[tokensArray[k].tokenId].amount += tokensArray[k].amount;
				}
			}
		}

		for (let j = 0; j < item.outputs.length; j++) {				
			//Sort
			let tokensArray = sortTokens(item.outputs[j].assets);
			for (let k = 0; k < tokensArray.length; k++) {
				if (burnedAssets[tokensArray[k].tokenId] == undefined) {
					burnedAssets[tokensArray[k].tokenId] = {};
					burnedAssets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
					burnedAssets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
					burnedAssets[tokensArray[k].tokenId].name = tokensArray[k].name;
					burnedAssets[tokensArray[k].tokenId].amount = -tokensArray[k].amount;
				} else {
					burnedAssets[tokensArray[k].tokenId].amount -= tokensArray[k].amount;
				}
			}
		}

		let burnedAssetKeys = Object.keys(burnedAssets);
		let hasBurnedAssets = false;
		for (let i = 0; i < burnedAssetKeys.length; i++) {
			let asset = burnedAssets[burnedAssetKeys[i]];

			if (asset.amount == 0) {
				delete burnedAssets[burnedAssetKeys[i]];
			} else if (asset.amount > 0) {
				hasBurnedAssets = true;
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

		if (txType == TxType.Contract2Contract
			|| txType == TxType.Wallet2Contract
			|| txType == TxType.Contract2Wallet) {
			inOutString += smartString;
		}

		formattedResult += '<td><span class="d-inline d-lg-none"><strong>Type: </strong><span class="' + classString + '">' + inOutString + '</span></span><span class="d-inline d-lg-none float-end"><strong>Block: </strong>' + ((isMempool) ? item.outputs[0].creationHeight : '<a href="' + getBlockUrl(item.blockId) + '">' + blockNr + '</a>') + '</span><span class="d-none d-lg-inline">' + ((isMempool) ? item.outputs[0].creationHeight : '<a href="' + getBlockUrl(item.blockId) + '">' + blockNr + '</a>') + '</span></td>';
		
		// In or Out tx.
		formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Type: </strong></span><span class="' + classString + '">' + inOutString + '</span></td>';
		
		//From
		addAddress(fromAddress);
		let formattedAddressString = formatTxAddressString(fromAddress);

		if (networkType != 'testnet' && (txType == TxType.Wallet2Contract || txType == TxType.Contract2Wallet)) {
			formattedAddressString = getAddressFromErgotree(item.inputs[0].ergoTree, fromAddress, formattedAddressString);
		}

		formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span>' + formattedAddressString + '</td>';
		
		//To
		addAddress(toAddress);
		formattedAddressString = formatTxAddressString(toAddress);

		if (txType == TxType.Wallet2Contract || txType == TxType.Contract2Wallet) {
			formattedAddressString = getAddressFromErgotree(item.outputs[0].ergoTree, toAddress, formattedAddressString);
		}

		formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span>' + formattedAddressString + '</td>';

		//Status
		formattedResult += '<td><span class="d-lg-none"><strong>Status: </strong></span><span class="' + ((isMempool) ? 'text-warning' : 'text-success' ) + '">' + ((isMempool) ? 'Pending' : 'Confirmed') + '</span><span class="d-inline d-lg-none text-white float-end"><strong>Fee: </strong>' + formatErgValueString(fee) + '</span></td>';
		
		//Fee
		formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Fee: </strong></span>' + formatErgValueString(fee) + '</td>';

		//Burn setup		
		let assetKeys = Object.keys(totalTransferedAssets.assets);
		for (let k = 0; k < assetKeys.length; k++) {
			let asset = totalTransferedAssets.assets[assetKeys[k]];
			asset.isBurned = false;
			if (asset.amount == -1
				&& burnedAssets[asset.tokenId] != undefined) {
				asset.isBurned = true;
			}
		}
			

		//Value
		if (txInOut != TxInOut.Mixed) {
			if (totalTransferedAssets.value < 0) totalTransferedAssets.value *= -1;

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

			let isMinted = false;
			if (minted) {
				if (minted.tokenId == asset.tokenId) {
					isMinted = true;
				}
			}

			let assetsString = '<br><strong>'+(isMinted ? '<span title="Minted">✨</span>' : '')+''+(asset.isBurned ? '<span title="Burned">🔥</span>' : '')+'<span class="">' + (asset.amount > 0 ? mixedPlus : '') + (txInOut == TxInOut.Out ? '-' : '') + formatAssetValueString(asset.amount, asset.decimals, 4) + '</span></strong> ' + getAssetTitle(asset, false, scamList.includes(asset.tokenId)) + (assetPrice == undefined ? '' : ' <span class="text-light">' + assetPrice +'</span>');

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
			ergValueString = (totalTransferedAssets.value > 0 ? mixedPlus : '') + (txInOut == TxInOut.Out ? '-' : '') + formatErgValueString(totalTransferedAssets.value, 5) + (ergDollarValue == undefined ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>')
formatErgValueString(totalTransferedAssets.value, 5) + (ergDollarValue == undefined ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>');
		} else {
			assetsFull = assets.substr(5);
			assets = assets.substr(5);
		}

		if (totalTransferedAssets.value == 0 && assetsI == 0) {
			assets = '/';
			assetsFull = '/';
		}

		if (minted) {
		//	let assetPrice = undefined;
		//	assetsFull += '<br><strong><span class="text-white">' + (minted.amount > 0 ? mixedPlus : '') + formatAssetValueString(minted.amount, minted.decimals, 4) + '</span></strong> ' + getAssetTitle(minted, false) + (assetPrice == undefined ? '' : ' <span class="text-light">' + assetPrice +'</span>')
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

				if (nftInfos[i].data.nsfw) {
					cSrc = '';
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
		$('#nftsTitle').html('<strong>Owned NFTs</strong> (' + nftsCount + ') ');
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
	$('#nftsTitle').html('<strong>Owned NFTs</strong> (' + nftsCount + ') ');

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

    fetch(mempoolUrl)
	.then(async response => {
		if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let abuffer = await response.arrayBuffer();
		const buffer = new TextDecoder("utf-8").decode(abuffer);
        const stringFromBuffer = buffer.toString('utf8');

        let data = JSONbig.parse(stringFromBuffer);

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
    .catch(function() {
        console.log('Mempool transactions fetch failed.');
    })
    .finally(function() {
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

function getUnspentBoxesDataUrl() {
	let balanceUrl = API_HOST_2 + 'boxes/unspent/byAddress/' + walletAddress;
	if (networkType == 'testnet') {
		balanceUrl = API_HOST + 'api/v1/boxes/unspent/byAddress/' + walletAddress;
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
	fetch(getTxsDataUrl())
	.then(async response => {
		if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let abuffer = await response.arrayBuffer();
		const buffer = new TextDecoder("utf-8").decode(abuffer);
        const stringFromBuffer = buffer.toString('utf8');

        let data = JSONbig.parse(stringFromBuffer);

        transactionsData = data;
		totalTransactions += transactionsData.total;
    })
    .catch(function() {
        console.log('Transactions fetch failed.');
    })
    .finally(function() {
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

    getAddressInfo();

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

					if (nftInfos[i].data.nsfw) {
						cSrc = '';
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
	$('#issuedNftsTitle').html('<strong>Issued Assets</strong> (' + issuedNftsCount + ') ');
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
	$('#issuedNftsTitle').html('<strong>Issued Assets</strong> (' + issuedNftsCount + ') ');

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
	printUnspentBoxes();
}

function printUnspentBoxes() {
	hideUnspentBoxes(null);

	var jqxhr = $.get(getUnspentBoxesDataUrl(), function(data) {
		let html = '';
        for (let i = 0; i < data.items.length; i++) {
        	html += formatBox(data.items[i], false, true).replace('row', 'col-6');
        }

        unspentBoxesCount = data.total;

        $('#unspentBoxesHolder').html(html);
        $('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (' + unspentBoxesCount + ') ');

        $('#hideUnspentBoxesAction').hide();
    })
    .fail(function() {
        console.log('Unspent boxes fetch failed.');
    })
    .always(function() {
    	//onMempoolAndTransactionsDataFetched();
    });
}

function showUnspentBoxes(e) {
	$('#unspentBoxesHolder').show();
	$('#showUnspentBoxesAction').hide();
	$('#hideUnspentBoxesAction').show();
	$('#unspentBoxesHeading').html('<strong>Unspent Boxes </strong>');

	scrollToElement($('#unspentBoxesHeading'));

	e.preventDefault();
}

function hideUnspentBoxes(e) {
	$('#unspentBoxesHolder').hide();
	$('#showUnspentBoxesAction').show();
	$('#hideUnspentBoxesAction').hide();
	$('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (' + unspentBoxesCount + ') ');

	if (e) {
		scrollToElement($('#unspentBoxesHeading'));

		e.preventDefault();
	}
}

function getAddressInfo() {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'addressbook/getAddressInfo?address=' + walletAddress,
	function (data) {
		if (data.total == 0) {
			let newName = "";

			for (let i = 0; i < transactionsData.items[0].inputs.length; i++) {
				let box = transactionsData.items[0].inputs[i];
				if (box.address == walletAddress) {
					newName = getAddressFromErgotree(box.ergoTree, "", newName);
					break;
				}
			}

			for (let i = 0; i < transactionsData.items[0].outputs.length; i++) {
				let box = transactionsData.items[0].outputs[i];
				if (box.address == walletAddress) {
					newName = getAddressFromErgotree(box.ergoTree, "", newName);
					break;
				}
			}

			if (newName != "") {
				$('#address').html(newName);
			}

			return;
		}

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

function findOtherAddress(item, totalTransferred, txInOut, firstAddress) {
	let addresses = Array();
	let totalTransferedAssets = {};

	for (let j = 0; j < item.outputs.length; j++) {
		let newAddress = item.outputs[j].address;
		if (!addresses.includes(newAddress)) {
			addresses.push(newAddress);
			totalTransferedAssets[newAddress] = {
				value: 0,
				assets: {}
			};
		}
	}

	for (let j = 0; j < item.inputs.length; j++) {
		let newAddress = item.inputs[j].address;
		if (!addresses.includes(newAddress)) {
			addresses.push(newAddress);
			totalTransferedAssets[newAddress] = {
				value: 0,
				assets: {}
			};
		}
	}

	for (let i = 0; i < addresses.length; i++) {
		let address = addresses[i];

		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address == address) {

				totalTransferedAssets[address].value += item.inputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.inputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets[address].assets[tokensArray[k].tokenId] == undefined) {
						totalTransferedAssets[address].assets[tokensArray[k].tokenId] = tokensArray[k];
					} else {
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].amount += tokensArray[k].amount;
					}
				}
			}
		}

		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == add) {
				totalTransferedAssets[address].value -= item.outputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.outputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					if (totalTransferedAssets[address].assets[tokensArray[k].tokenId] == undefined) {
						totalTransferedAssets[address].assets[tokensArray[k].tokenId] = {};
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].tokenId = tokensArray[k].tokenId;
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].decimals = tokensArray[k].decimals;
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].name = tokensArray[k].name;
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].amount = -tokensArray[k].amount;
					} else {
						totalTransferedAssets[address].assets[tokensArray[k].tokenId].amount -= tokensArray[k].amount;
					}
				}
			}
		}
	}

	for (let i = 0; i < addresses.length; i++) {
		let exactMatch = true;
		let address = addresses[i];

				if (address == firstAddress || address != '2JowFgqdee4yFVaXNsYuiAh1ge7HGxNSaDLiXQRKhtCYYRKgwMCeqMPi54qxpovt5TtjRVNNRabtZ7awzrcnqnmALG2Hjkwe2okjFn9odM7M3uhA9RQ2uBkkVsrY1P3FW8bUTx6qRjy4yHdtdS8YUzFCvmGZVHLteknL6RN9dueHbpLYRkyV2e5mYEzptufdxy81DwNpJphyJa9Y21ELHo75vk2t24kZS5Lgt5GDByQHRu3G4GTnPb4vMvew4wUFJh8xAwM1ffoEG946YZaWkSu48UUV4tw6Y5a4uDxZPEEiSDM36wookGfTixFeWVfM9YApPytQm8y1L1bsbcocQ9JTvBjixevx1BRagnvaJrwduuDbKYr3wwpo9PfK85xXprxrFgHBVwEof9gQs5TQFJ3ddKf1pftx6SJrHyNygX6CS4Vm3TG9dU32bs8inxSn4eVdwfRdhNiECZavPBBrzgfa9ismVpkwrcNbFZrAdNSFUpoKfiuFcsP6Be5tsE4ZsPD9sWEArhbGPqya88U8TftP9DqoD3xVPUmhMsB6pb6GfwQ1QxsenMhynSMBZ4fc6eyjdZWvzWeBKKs6AbVMX6EsSoptPvsbvpd664kBq99DsZ5Br6rQGjPDM1zPYsCpGUSW849qigHzHyNmYUCoVkDgfQA26TYKwFPLi7rxsJbSfAEhwQj5czRmfg11HafTYMcuSgryKP8ZzxTfTj5LxZFsXVjY9JWScT1tA5ZFjXZHxGENBporNPMbqWzusqMKvmyzTkZDwwyJV6nzcAFRDEjHd4MjzzsHbztt9XoYtWcYyKCYyMiAxsEqvc7VvuKXvTMEyzHnR1dSpqoP6bKpCwNKKZvrYX35GdxNdEKzQS6ccbNe98zvFQPrgQPa7BjYs1hgCWv6LLLWmqhhy9J6ca332st262t1BYjVLhYLEHSvLbsmM36hDtDjyoniTuW3zVmN51nV7bkZU1L1PQobFqp7uLvdieFt234Pz2RBgezeVTqkKqJLv7D2xKveVTUGJqsM8P7BghcLTyzEY9CZ3dXZRQVh2sXbhQEFqHdKpXL92eZTLZbg1AQYRpfL2p8AVVrbeWEuha3gmA5mv95zkmi5MPbDtxEekDaTLc9KXoWtSEPSy8zRMyhiws5') {
			continue;
		}

		console.log(totalTransferedAssets[address].value, totalTransferred.value);
		if (totalTransferedAssets[address].value != totalTransferred.value) {
			exactMatch = false;
			continue;
		}

		console.log(`Value match for address ${address}`);

		let assetKeys1 = Object.keys(totalTransferedAssets[address].assets);
		let assetKeys2 = Object.keys(totalTransferred.assets);

		if (assetKeys1.length != assetKeys2.length) {
			exactMatch = false;
			continue;
		}

		console.log(`Asset length match for address ${address}`);

		for (let j = 0; j < assetKeys1.length; j++) {
			let asset1 = totalTransferedAssets[address].assets[assetKeys1[j]];		
			let foundAsset = false;
			for (let k = 0; k < assetKeys2.length; k++) {
				let asset2 = totalTransferred.assets[assetKeys2[k]];
				if (asset2 && asset1.tokenId == asset2.tokenId) {
					foundAsset = true;
					if (asset1.amount != asset2.amount) {
						exactMatch = false;
					}
					break;
				}
			}

			if (!foundAsset || !exactMatch) {
				exactMatch = false;
				break;
			}
		}

		if (exactMatch) {
			console.log(`Exact match: ${address}`);	
		}
	}
}

function findMinDiffBox(totalTransferred, boxes) {

}

function getAddressFromErgotree(ergoTree, fromAddress, formattedAddress) {
				if (ergoTree.substring(ergoTree.length - N2T_SWAP_SELL_TEMPLATE_ERG.length) == N2T_SWAP_SELL_TEMPLATE_ERG
				||
				ergoTree.substring(ergoTree.length - N2T_SWAP_SELL_TEMPLATE_SPF.length) == N2T_SWAP_SELL_TEMPLATE_SPF
				||
				ergoTree.substring(ergoTree.length - N2T_SWAP_BUY_TEMPLATE_ERG.length) == N2T_SWAP_BUY_TEMPLATE_ERG
				||
				ergoTree.substring(ergoTree.length - N2T_SWAP_BUY_TEMPLATE_SPF.length) == N2T_SWAP_BUY_TEMPLATE_SPF) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance N2T Swap Contract');
			}

			if (ergoTree.substring(ergoTree.length - T2T_SWAP_TEMPLATE_ERG.length) == T2T_SWAP_TEMPLATE_ERG
				||
				ergoTree.substring(ergoTree.length - T2T_SWAP_TEMPLATE_SPF.length) == T2T_SWAP_TEMPLATE_SPF) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance T2T Swap Contract');
			}

			if (ergoTree.substring(ergoTree.length - SPECTRUM_LP_DEPOSIT.length) == SPECTRUM_LP_DEPOSIT) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance LP Deposit Contract');
			}

			if (ergoTree.substring(ergoTree.length - SPECTRUM_LP_REDEEM.length) == SPECTRUM_LP_REDEEM) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance LP Redeem Contract');
			}

			if (ergoTree.substring(ergoTree.length - SPECTRUM_YF_DEPOSIT.length) == SPECTRUM_YF_DEPOSIT) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance YF Deposit Contract');
			}

			if (ergoTree.substring(ergoTree.length - SPECTRUM_YF_REDEEM.length) == SPECTRUM_YF_REDEEM) {
				return formatTxAddressString(fromAddress, 'Spectrum Finance YF Redeem Contract');
			}

			return formattedAddress;
}