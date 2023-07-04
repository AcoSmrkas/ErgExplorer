var walletAddress = undefined;
var mempoolData = undefined;
var transactionsData = undefined;
var tokensContentFull = '';
var tokensContent = '';
var formattedResult = '';
var totalTransactions = 0;
var valueFields = new Array();
var valueFieldsFull = new Array();
var nftsCount = 0;
var issuedNftsCount = 0;
var mempoolIndexOffset = 0;
var tokensArray = new Array();
var initRequestCount = -1;
var initRequestDone = 0
var addresses = new Array();
var addressbook = new Array();
var mempoolData = undefined;
var transactionsData = undefined;
var mempoolRequestDone = false;
var transactionsRequestDone = false;

$(function() {
	walletAddress = getWalletAddressFromUrl();	

	setDocumentTitle(walletAddress);
	
    getPrices(onInitRequestsFinished);
    getIssuedNfts(walletAddress, onGotIssuedNftInfo, false);
    getAddressInfo();

    setupQrCode();
});

function printAddressSummary() {
	let balanceUrl = API_HOST_2 + 'addresses/' + walletAddress + '/balance/total';
	if (networkType == 'testnet') {
		balanceUrl = API_HOST + 'api/v1/addresses/' + walletAddress + '/balance/total';
	}

	var jqxhr = $.get(balanceUrl,
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

			let totalVestingPrice = -1;
			let tokensToShow = 4;
			tokensContent = '';
			tokensContentFull = '';

			//Sort
			tokensArray = sortTokens(data.confirmed.tokens);

			//Format output
			let i = 0;
			let nftSearchTokens = [];
			let totalAssetsValue = 0;
			for (i = 0; i < tokensArray.length; i++) {
				let tokensPrice = 0;
				let tokensPriceString = '';
				if (gotPrices && prices[tokensArray[i].tokenId] != undefined) {
					tokensPrice = formatAssetDollarPrice(tokensArray[i].amount, tokensArray[i].decimals, tokensArray[i].tokenId);
					tokensPriceString = formatDollarPriceString(tokensPrice);
					totalAssetsValue += tokensPrice;
				}

				let tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4) + (tokensPrice == 0 ? '' : '<span class="text-light"> ' + tokensPriceString + '</span>'), tokensArray[i].tokenId);

				tokensContentFull += tokensString;

				nftSearchTokens[i] = tokensArray[i].tokenId;

				if (i > tokensToShow) continue;

				tokensContent += tokensString;

				if (i == tokensToShow && tokensArray.length > tokensToShow + 1) {
					tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
				}
			}

			if (i > tokensToShow && tokensArray.length > tokensToShow + 1) {
				tokensContentFull += '<br><p><strong><a href="#" onclick="hideAllTokens(event)">Hide</a></strong></p>';
			}

			if (totalAssetsValue > 0) {
				$('#finalAssetsBalance').html('<span class="gray-color">Tokens balance:</span> $' + formatValue(totalAssetsValue, 2) + '');
				$('#finalAssetsBalance').show();

				$('#finalBalance').html('<span class="grey-color">Total:</span> $' + formatValue(ergDollarValue + totalAssetsValue, 2) + '');
				$('#finalBalance').show();
			}

			getNftsInfo(nftSearchTokens, onGotOwnedNftInfo);

			$('#tokens').html(tokensContent);
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
    	showLoadError('No results matching your query.');
    });
}

function getFormattedTransactionsString(transactionsJson, isMempool) {
	if (transactionsJson == undefined || transactionsJson == '' || transactionsJson.total == 0) {
		return '';
	}

	let formattedResult = '';
	let isWallet2Wallet = true;
	for (let i = 0; i < transactionsJson.items.length; i++) {
		const item = transactionsJson.items[i];

		formattedResult += '<tr>';

		let addressPrefix = '9';
		if (networkType == 'testnet') {
			addressPrefix = '3';
		}

		isWallet2Wallet = item.outputs[0].address.substring(0, 1) == addressPrefix;

		let isTxOut = false;
		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address == walletAddress) {
				isTxOut = true;
				break;
			}
		}

		let fromAddress = ((isTxOut) ? walletAddress : item.inputs[0].address);
		let toAddress = ((isTxOut) ? item.outputs[0].address : walletAddress);
		let isSmart = isTxOut && !isWallet2Wallet;		
		let smartAddress = walletAddress.length > 100
		let outputsAddress = (isSmart && !smartAddress ? walletAddress : toAddress);
		let ownAddressCount = 0;
		let smartOut = false;

		if (isSmart) {
			for (let j = 0; j < item.outputs.length; j++) {
				if (item.outputs[j].address == walletAddress) {
					ownAddressCount++;
				}
			}

			if (ownAddressCount == 1) {
				outputsAddress = toAddress;
				smartOut = true;
			}			
		}

		//Tx
		if (isMempool) {
			formattedResult += '<td></td>';
		} else {
			formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.id) + '"><i class="fas fa-link text-info"></i></a></td>';
		}

		//Timestamp
		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString((isMempool) ? item.creationTimestamp : item.timestamp) + '</td>';

		//Block nr.
		formattedResult += '<td><span class="d-lg-none"><strong>Block: </strong></span>' + ((isMempool) ? item.outputs[0].creationHeight : '<a href="' + getBlockUrl(item.blockId) + '">' + item.inclusionHeight + '</a>') + '</td>';
		
		// In or Out tx.
		let smartInOutString = (smartOut ? 'Out' : 'In');

		formattedResult += '<td class="' + ((isTxOut) ? (isWallet2Wallet) ? 'text-danger' : 'text-info' : 'text-success') + '">' + ((isTxOut) ? (isWallet2Wallet) ? 'Out' : 'Smart ' + smartInOutString : 'In') + '</td>';
		
		//From
		addAddress(fromAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span><a class="address-string" addr="' + fromAddress + '" href="' + getWalletAddressUrl(fromAddress) + '" >' + (getOwner(fromAddress) == undefined ? formatAddressString(fromAddress, 10) : getOwner(fromAddress)) + '</a></td>';
		
		//To
		addAddress(toAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span><a class="address-string" addr="' + toAddress +'" href="' + getWalletAddressUrl(toAddress) + '">' + (getOwner(toAddress) == undefined ? formatAddressString(toAddress, 10) : getOwner(toAddress)) + '</a></td>';

		//Status
		if (item.numConfirmations == undefined) {
			item.numConfirmations = item.confirmationsCount;
		}

		formattedResult += '<td><span class="d-lg-none"><strong>Status: </strong></span><span class="' + ((isMempool) ? 'text-warning' : 'text-success' ) + '">' + ((isMempool) ? 'Pending' : 'Confirmed (' + nFormatter(item.numConfirmations) + ')') + '</span></td>';
		
		//Fee
		let fee = 0;
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == FEE_ADDRESS) {
				fee = item.outputs[j].value;
			}
		}

		formattedResult += '<td><span class="d-lg-none"><strong>Fee: </strong></span>' + formatErgValueString(fee) + '</td>';

		//Value
		let value = 0;
		let assets = ' ';
		let assetsFull = ' ';
		let tokensToShow = 2;

		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == outputsAddress) {

				value = item.outputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.outputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					let assetPrice = -1;
					if (gotPrices && prices[tokensArray[k].tokenId] != undefined) {
						assetPrice = formatAssetDollarPriceString(tokensArray[k].amount, tokensArray[k].decimals, tokensArray[k].tokenId);
					}

					let assetsString = '<br><strong><span class="text-white">' + formatAssetValueString(tokensArray[k].amount, tokensArray[k].decimals, 4) + '</span></strong> ' + getAssetTitle(tokensArray[k], false) + (assetPrice == -1 ? '' : ' <span class="text-light">' + assetPrice +'</span>');

					assetsFull += assetsString;
					
					if (k > tokensToShow) continue;

					assets += assetsString;

					if (k == tokensToShow && tokensArray.length > tokensToShow + 1) {
						assets += '<p>...</p><p><strong><a href="#" onclick="showFullValue(event, ' + (i + mempoolIndexOffset) + ')">Show all</a></strong></p>';
					}
				}

				assetsFull += '<p> </p><p><strong><a href="#" onclick="hideFullValue(event, ' + (i + mempoolIndexOffset) + ')">Hide</a></strong></p>';

				break;
			}
		}

		let ergDollarValue = -1
		if (gotPrices) {
			ergDollarValue = formatAssetDollarPrice(value, ERG_DECIMALS, 'ERG');
		}

		valueFields[i + mempoolIndexOffset] = formatErgValueString(value, 5) + (ergDollarValue == -1 ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>') + assets;
		valueFieldsFull[i + mempoolIndexOffset] = formatErgValueString(value, 5) + (ergDollarValue == -1 ? '' : ' <span class="text-light">' + formatDollarPriceString(ergDollarValue) + '</span>') + assetsFull;

		formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span><span id="txValue' + (i + mempoolIndexOffset) + '">' + valueFields[i + mempoolIndexOffset] + '</span></td></tr>';
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
		let nftHolderId = '';
		let nftContentHolderId = '';

		switch (nftInfos[i].type) {
			case NFT_TYPE.Image:
				imgSrc = nftInfos[i].link;
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

		html[nftInfos[i].type] += '<a href="' + getTokenUrl(nftInfos[i].data.id) + '"><div class="card m-1" style="width: 100px;"><div class="cardImgHolder"><img src="' + imgSrc + '" class="card-img-top' + ((nftInfos[i].type == NFT_TYPE.Image) ? '' : ' p-4') + '"></div><div class="card-body p-2"><p class="card-text">' + nftInfos[i].data.name + '</p></div></div></a>';

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

function showNfts(e) {
	$('#nftsShowAll').show();
	$('#showAllNftsAction').hide();
	$('#hideAllNftsAction').show();
	$('#nftsTitle').html('<strong>Owned NFTs</strong>');

	scrollToElement($('#nftsTitle'));

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
    let mempoolUrl = API_HOST_2 + 'mempool/transactions/byAddress/' + walletAddress;

    if (networkType == 'testnet') {
        mempoolUrl = API_HOST_2 + 'api/v1/mempool/transactions/byAddress/' + walletAddress
    }

    let jqxhr = $.get(mempoolUrl, function(data) {
        mempoolData = data;
		totalTransactions += mempoolData.total;
    })
    .fail(function() {
        console.log('Mempool transactions fetch failed.');
    })
    .always(function() {
        mempoolRequestDone = true;
        onMempoolAndTransactionsDataFetched();
    });
}

function getTransactionsData() {
var jqxhr = $.get(API_HOST_2 + 'addresses/' + walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE, function(data) {
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

	formattedResult += getFormattedTransactionsString(mempoolData, true);
	formattedResult += getFormattedTransactionsString(transactionsData, false);

	setupPagination(transactionsData.total);

	$('#totalTransactions').html('<strong>Total transactions:</strong> ' + totalTransactions);

	if (totalTransactions > 0) {
		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();
	}

	$('#txLoading').hide();

	getAddressesInfo();
}

function getOfficialExplorereAddressUrl(address) {
	if (networkType == 'testnet') {
		return 'https://testnet.ergoplatform.com/addresses/' + address;
	} else {
		return 'https://explorer.ergoplatform.com/addresses/' + address;
	}
}

function showAllTokens(e) {
	$('#tokens').html(tokensContentFull);
	scrollToElement($('#tokensHolder'));

	e.preventDefault();
}

function hideAllTokens(e) {
	$('#tokens').html(tokensContent);
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

			switch (nftInfos[i].type) {
				case NFT_TYPE.Image:
					imgSrc = nftInfos[i].link;
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

			html[nftInfos[i].type] += '<a href="' + getTokenUrl(nftInfos[i].data.id) + '"><div class="card m-1" style="width: 100px;' + (nftInfos[i].data.isBurned == 't' ? 'border:1.5px solid red;' : '') + '"><div class="cardImgHolder"><img ' + (nftInfos[i].data.isBurned == 't' ? 'style="opacity: 0.4;"' : '') + 'src="' + imgSrc + '" class="card-img-top' + ((nftInfos[i].type == NFT_TYPE.Image) ? '' : ' p-4') + '"></div><div class="card-body p-2"><p class="card-text">' + nftInfos[i].data.name + '</p></div></div></a>';
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
				$('#ergopadVesting').html('<a href="https://www.ergopad.io/dashboard"" target="_new"><img src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon"> Ergopad</a> vesting: <span class="text-light">$' + formatValue(totalVestingPrice, 2) + '</span>' + (totalReddemablePrice > 0 ? '<br><img src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon" style="visibility:hidden;"> <span style="font-size:0.9em;">Redeemable: $' + formatValue(totalReddemablePrice, 2) + '</span>' : ''));
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

			$('#ergopadStaking').html('<a href="https://www.ergopad.io/dashboard"" target="_new"><img src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg" class="token-icon"> Ergopad</a> staking: <span class="text-light">$' + formatValue(totalVestingPrice, 2) + '</span>');
			$('#ergopadStaking').show();
			$('#ergopad').show();
	    }
	});
}

function onInitRequestsFinished() {
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
	});
}

function getAddressesInfo() {
	var jqxhr = $.post(ERGEXPLORER_API_HOST + 'addressbook/getAddressesInfo',
		{'addresses' : addresses},
	function (data) {
		if (data.total == 0) return;

		addressbook = data.items;

		$('.address-string').each(function(index) {
			$(this).html(getOwner($(this).attr('addr')));
		});
	});
}

function addAddress(address) {
	for (let i = 0; i < addresses.length; i++) {
		if (addresses[i] == address) {
			return;
		}
	}

	addresses.push(address);
}

function getOwner(address) {
	for (var i = 0; i < addressbook.length; i++) {
		if (addressbook[i]['address'] == address) {
			let owner = addressbook[i]['name'];

			if (addressbook[i]['urltype'] != '') {
				owner += ' (' + addressbook[i]['urltype'] + ')';
			}

			return owner;
		}
	}

	return undefined;
}