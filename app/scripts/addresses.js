var walletAddress = undefined;
var mempoolData = undefined;
var transactionsData = undefined;
var tokensContentFull = '';
var tokensContent = '';
var mempoolRequestDone = false;
var transactionsRequestDone = false;
var formattedResult = '';
var totalTransactions = 0;
var valueFields = new Array();
var valueFieldsFull = new Array();
var nftsCount = 0;

$(function() {
	walletAddress = getWalletAddressFromUrl();	

	setDocumentTitle(walletAddress);
	
    printAddressSummary();
    printTransactions();

    setupQrCode();
});

function printAddressSummary() {
	var jqxhr = $.get(API_HOST + 'addresses/' + walletAddress + '/balance/total',
	function(data) {
		$('#finalBalance').html('Final balance: <strong>' + formatErgValueString(data.confirmed.nanoErgs, 2) + '</strong>');

		if (data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			let tokensToShow = 2;
			tokensContent = '';
			tokensContentFull = '';

			//Sort
			let tokensArray = sortTokens(data.confirmed.tokens);

			//Format output
			let i = 0;
			for (i = 0; i < tokensArray.length; i++) {
				let tokensString = formatAssetNameAndValueString(getAssetTitle(tokensArray[i], true), formatAssetValueString(tokensArray[i].amount, tokensArray[i].decimals, 4), tokensArray[i].tokenId);

				tokensContentFull += tokensString;

				getNftInfo(tokensArray[i].tokenId, onGotNftInfo);

				if (i > tokensToShow) continue;

				tokensContent += tokensString;

				if (i == tokensToShow && tokensArray.length > tokensToShow + 1) {
					tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
				}
			}

			if (i > tokensToShow && tokensArray.length > tokensToShow + 1) {
				tokensContentFull += '<br><p><strong><a href="#" onclick="hideAllTokens(event)">Hide</a></strong></p>';
			}

			$('#tokens').html(tokensContent);
		}

		let walletAddressString = walletAddress;
		if (walletAddressString.length > 70) {
			walletAddressString = formatAddressString(walletAddressString, 60);
		}
		$('#address').html(walletAddressString + ' &#128203;');
		$('#officialLink').html(getOfficialExplorereAddressUrl(walletAddressString));
		$('#officialLink').attr('href', getOfficialExplorereAddressUrl(walletAddress));

		$('#summaryOk').show();
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
		isWallet2Wallet = item.inputs[0].address.substring(0, 1) == '9';

		let isTxOut = false;
		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address == walletAddress) {
				isTxOut = true;
				break;
			}
		}

		let isSmart = isTxOut && !isWallet2Wallet;

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
		formattedResult += '<td class="' + ((isTxOut) ? (isWallet2Wallet) ? 'text-danger' : 'text-info' : 'text-success') + '">' + ((isTxOut) ? (isWallet2Wallet) ? 'Out' : 'Smart' : 'In') + '</td>';
		
		//From
		let fromAddress = ((isTxOut) ? walletAddress : item.inputs[0].address);
		formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span><a href="' + getWalletAddressUrl(fromAddress) + '" >' + formatAddressString(fromAddress, 10) + '</a></td>';
		
		//To
		let toAddress = ((isTxOut) ? item.outputs[0].address : walletAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span><a href="' + getWalletAddressUrl(toAddress) + '">' + formatAddressString(toAddress, 10) + '</a></td>';

		//Status
		formattedResult += '<td><span class="d-lg-none"><strong>Status: </strong></span><span class="' + ((isMempool) ? 'text-warning' : 'text-success' ) + '">' + ((isMempool) ? 'Pending' : 'Confirmed (' + item.numConfirmations + ')') + '</span></td>';
		
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
		let outputsAddress = (isSmart ? walletAddress : toAddress);
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == outputsAddress) {

				value = item.outputs[j].value;
				
				//Sort
				let tokensArray = sortTokens(item.outputs[j].assets);
				
				for (let k = 0; k < tokensArray.length; k++) {
					let assetsString = '<br><strong>' + formatAssetValueString(tokensArray[k].amount, tokensArray[k].decimals, 4) + '</strong> ' + getAssetTitle(tokensArray[k], false) + ' ';

					assetsFull += assetsString;
					
					if (k > tokensToShow) continue;

					assets += assetsString;

					if (k == tokensToShow && tokensArray.length > tokensToShow + 1) {
						assets += '<p>...</p><p><strong><a href="#" onclick="showFullValue(event, ' + i + ')">Show all</a></strong></p>';
					}
				}

				assetsFull += '<p> </p><p><strong><a href="#" onclick="hideFullValue(event, ' + i + ')">Hide</a></strong></p>';

				break;
			}
		}

		valueFields[i] = formatErgValueString(value, 5) + assets;
		valueFieldsFull[i] = formatErgValueString(value, 5) + assetsFull;

		formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span><span id="txValue' + i + '">' + valueFields[i] + '</span></td></tr>';
	}

	return formattedResult;
}

function onGotNftInfo(nftInfo, message) {
	if (nftInfo == null) {
		return;
	} 

	let imgSrc = '';
	let formattedHtml = '';
	let nftHolderId = '';
	let nftContentHolderId = '';

	switch (nftInfo.type) {
		case NFT_TYPE.Image:
			imgSrc = nftInfo.link;
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

	formattedHtml = $(nftContentHolderId).html() + '<a href="' + getTokenUrl(nftInfo.data[0].assets[0].tokenId) + '"><div class="card m-1" style="width: 100px;"><div class="cardImgHolder"><img src="' + imgSrc + '" class="card-img-top' + ((nftInfo.type == NFT_TYPE.Image) ? '' : ' p-4') + '"></div><div class="card-body p-2"><p class="card-text">' + nftInfo.name + '</p></div></div></a>';

	$(nftContentHolderId).html(formattedHtml);
	$(nftHolderId).show();
	$('#nftsHolder').show();

	nftsCount++;
	$('#nftsTitle').html('NFTs (+' + nftsCount + ') ');
	$('#hideAllNftsAction').hide();
}

function showNfts(e) {
	$('#nftsShowAll').show();
	$('#showAllNftsAction').hide();
	$('#hideAllNftsAction').show();
	$('#nftsTitle').html('<strong>NFTs</strong>');

	scrollToElement($('#nftsTitle'));

	e.preventDefault();
}

function hideNfts(e) {
	$('#nftsShowAll').hide();
	$('#showAllNftsAction').show();
	$('#hideAllNftsAction').hide();
	$('#nftsTitle').html('NFTs (+' + nftsCount + ') ');

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
	let jqxhr = $.get(API_HOST + 'mempool/transactions/byAddress/' + walletAddress, function(data) {
    		mempoolData = data;

   			totalTransactions += mempoolData.total;
   			formattedResult += getFormattedTransactionsString(mempoolData, true);
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
	var jqxhr = $.get(API_HOST + 'addresses/' + walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE, function(data) {
        	transactionsData = data;
        	totalTransactions += transactionsData.total;

        	formattedResult += getFormattedTransactionsString(transactionsData, false);

			setupPagination(transactionsData.total);
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
	if (!mempoolRequestDone || !transactionsRequestDone) return;

	$('#totalTransactions').html('<strong>Total transactions:</strong> ' + totalTransactions);

	if (totalTransactions > 0) {
		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();
	}

	$('#txLoading').hide();
}

function getOfficialExplorereAddressUrl(address) {
	return 'https://explorer.ergoplatform.com/addresses/' + address;
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