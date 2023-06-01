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

$(function() {
	walletAddress = getWalletAddressFromUrl();	

	setDocumentTitle(walletAddress);
	
    printAddressSummary();
    printTransactions();

    setupQrCode();
});

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

		let isSmart = isTxOut && !isWallet2Wallet && !isMempool;

		//Tx
		if (isMempool) {
			formattedResult += '<td></td>';
		} else {
			formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.id) + '"><i class="fas fa-link text-info"></i></a></td>';
		}

		//Timestamp
		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString((isMempool) ? item.creationTimestamp : item.timestamp) + '</td>';

		//Block nr.
		formattedResult += '<td><span class="d-lg-none"><strong>Block: </strong></span>' + ((isMempool) ? item.outputs[0].creationHeight : item.inclusionHeight) + '</td>';
		
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
				
				for (let k = 0; k < item.outputs[j].assets.length; k++) {
					assetsFull += '<br><strong>' + formatAssetValueString(item.outputs[j].assets[k].amount, item.outputs[j].assets[k].decimals) + '</strong> ' + getAssetTitle(item.outputs[j].assets[k], false) + ' ';

					if (k > tokensToShow) continue;

					assets += '<br><strong>' + formatAssetValueString(item.outputs[j].assets[k].amount, item.outputs[j].assets[k].decimals) + '</strong> ' + getAssetTitle(item.outputs[j].assets[k], false) + ' ';

					if (k == tokensToShow && item.outputs[j].assets.length > tokensToShow + 1) {
						assets += '<p>...</p><p><strong><a href="#" onclick="showFullValue(event, ' + i + ')">Show all</a></strong></p>';
					}
				}

				assetsFull += '<p> </p><p><strong><a href="#" onclick="hideFullValue(event, ' + i + ')">Show less</a></strong></p>';

				break;
			}
		}

		valueFields[i] = formatErgValueString(value, 5) + assets;
		valueFieldsFull[i] = formatErgValueString(value, 5) + assetsFull;

		formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span><span id="txValue' + i + '">' + valueFields[i] + '</span></td></tr>';
	}

	return formattedResult;
}

function printAddressSummary() {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/addresses/' + walletAddress + '/balance/total',
	function(data) {
		$('#finalBalance').html('Final balance: <strong>' + formatErgValueString(data.confirmed.nanoErgs, 2) + '</strong>');

		if (data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			let tokensToShow = 2;
			tokensContent = '';
			tokensContentFull = '';

			let i = 0;
			for (i = 0; i < data.confirmed.tokens.length; i++) {
				tokensContentFull += formatAssetNameAndValueString(getAssetTitle(data.confirmed.tokens[i], true), formatAssetValueString(data.confirmed.tokens[i].amount, data.confirmed.tokens[i].decimals), data.confirmed.tokens[i].tokenId);

				if (i > tokensToShow) continue;

				tokensContent += formatAssetNameAndValueString(getAssetTitle(data.confirmed.tokens[i], true), formatAssetValueString(data.confirmed.tokens[i].amount, data.confirmed.tokens[i].decimals), data.confirmed.tokens[i].tokenId);

				if (i == tokensToShow && data.confirmed.tokens.length > tokensToShow + 1) {
					tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
				}
			}

			if (i > tokensToShow && data.confirmed.tokens.length > tokensToShow + 1) {
				tokensContentFull += '<br><p><strong><a href="#" onclick="hideAllTokens(event)">Show less</a></strong></p>';
			}

			$('#tokens').html(tokensContent);
		}

		$('#address').html(walletAddress + ' &#128203;');
		$('#officialLink').html(getOfficialExplorereAddressUrl(walletAddress));
		$('#officialLink').attr('href', getOfficialExplorereAddressUrl(walletAddress));

		$('#summaryOk').show();
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    });
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
	let jqxhr = $.get('https://api.ergoplatform.com/api/v1/mempool/transactions/byAddress/' + walletAddress, function(data) {
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
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/addresses/' + walletAddress + '/transactions?offset=' + offset + '&limit=' + ITEMS_PER_PAGE, function(data) {
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

	e.preventDefault();
}

function hideAllTokens(e) {
	$('#tokens').html(tokensContent);
	window.scrollTo(0, 0);

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