const TX_PER_PAGE = 30;
var walletAddress = undefined;
var tokensContentFull = '';
var tokensContent = '';

$(function() {
      printAddressSummary(getWalletAddressFromUrl());
      printTransactions(getWalletAddressFromUrl(), 0);
});

function getFormattedTransactionsString(transactionsJson, isMempool) {
	if (transactionsJson == undefined || transactionsJson == '' || transactionsJson.total == 0) {
		return '';
	}

	let formattedResult = '';
	for (let i = 0; i < transactionsJson.items.length; i++) {
		const item = transactionsJson.items[i];

		formattedResult += '<tr>';

		//Timestamp
		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString((isMempool) ? item.creationTimestamp : item.timestamp) + '</td>';

		//Block nr.
		formattedResult += '<td><span class="d-lg-none"><strong>Block: </strong></span>' + ((isMempool) ? item.outputs[0].creationHeight : item.inclusionHeight) + '</td>';
		
		// In or Out tx.
		let isTxOut = false;
		for (let j = 0; j < item.inputs.length; j++) {
			if (item.inputs[j].address == walletAddress) {
				isTxOut = true;
				break;
			}
		}

		formattedResult += '<td class="' + ((isTxOut) ? 'text-danger' : 'text-success') + '">' + ((isTxOut) ? 'Out' : 'In') + '</td>';
		
		//From
		let fromAddress = ((isTxOut) ? walletAddress : item.inputs[0].address );
		formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span><a href="' + getWalletAddressUrl(fromAddress) + '" >' + formatAddressString(fromAddress, 15) + '</a></td>';
		
		//To
		let toAddress = ((isTxOut) ? item.outputs[0].address : walletAddress);
		formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span><a href="' + getWalletAddressUrl(toAddress) + '">' + formatAddressString(toAddress, 15) + '</a></td>';

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
		for (let j = 0; j < item.outputs.length; j++) {
			if (item.outputs[j].address == toAddress) {
				value = item.outputs[j].value;
				
				for (let k = 0; k < item.outputs[j].assets.length; k++) {
					assets += '<br>' + formatAssetValueString(item.outputs[j].assets[k].amount, item.outputs[j].assets[k].decimals) + ' ' + item.outputs[j].assets[k].name + ' ';
				}

				break;
			}
		}

		formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span>' + formatErgValueString(value, 5) + assets + '</td></tr>';
	}

	return formattedResult;
}

function printAddressSummary(address) {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/addresses/' + address + '/balance/total',
	function(data) {
		$('#finalBalance').html('Final balance: <strong>' + formatErgValueString(data.confirmed.nanoErgs, 2) + '</strong>');

		if (data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			let tokensToShow = 2;
			tokensContent = '';
			tokensContentFull = '';

			let i = 0;
			for (i = 0; i < data.confirmed.tokens.length; i++) {
				tokensContentFull += formatAssetNameAndValueString(data.confirmed.tokens[i].name, formatAssetValueString(data.confirmed.tokens[i].amount, data.confirmed.tokens[i].decimals));

				if (i > tokensToShow) continue;

				tokensContent += formatAssetNameAndValueString(data.confirmed.tokens[i].name, formatAssetValueString(data.confirmed.tokens[i].amount, data.confirmed.tokens[i].decimals));

				if (i == tokensToShow && data.confirmed.tokens.length > tokensToShow) {
					tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
				}
			}

			if (i > tokensToShow && data.confirmed.tokens.length > tokensToShow) {
				tokensContentFull += '<br><p><strong><a href="#" onclick="hideAllTokens(event)">Show less</a></strong></p>';
			}

			$('#tokens').html(tokensContent);
		}

		$('#address').html(address + ' &#128203;');
		$('#officialLink').html(getOfficialExplorereAddressUrl(address));
		$('#officialLink').attr('href', getOfficialExplorereAddressUrl(address));

		$('#summaryOk').show();
    })
    .fail(function() {
    	$('#summaryError').show();
    	console.log('Address summary fetch failed.');
    });
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

function printTransactions(address, offset) {
	walletAddress = address;
	let formattedResult = '';
	var totalTransactions = 0;
	let txJson = undefined;

	document.title = 'Erg Explorer - ' + address;

    var jqxhr = $.get('https://api.ergoplatform.com/api/v1/mempool/transactions/byAddress/' + address, function(data) {
    		txJson = data;
    		totalTransactions += data.total;
        })
        .fail(function() {
        	console.log('Mempool transactions fetch failed.');
        })
        .always(function() {
            formattedResult += getFormattedTransactionsString(txJson, true);

            txJson = undefined;
	        var jqxhr = $.get('https://api.ergoplatform.com/api/v1/addresses/' + address + '/transactions?offset=' + offset + '&limit=30', function(data) {
	        	txJson = data;
	        	totalTransactions += data.total;

				setupPagination(totalTransactions / TX_PER_PAGE);

	 			$('#totalTransactions').html('<strong>Total transactions:</strong> ' + totalTransactions);

	 			if (totalTransactions > 0) {
	 				$('#txView').show();
	 			}
	        })
	        .fail(function() {
                console.log('Transactions fetch failed.');
	        })
	        .always(function() {
				formattedResult += getFormattedTransactionsString(txJson, false);

				$('#transactionsTableBody').html(formattedResult);
	 			$('#txLoading').hide();
	        });
        });
}

function setupPagination(numPages) {
	let currentPageNum = window.location.href.split('#')[1].split('&')[1];

	if (currentPageNum == undefined) {
		currentPageNum = 1;
	} else {
		currentPageNum = currentPageNum.split('=')[1];
		currentPageNum = Math.ceil(currentPageNum);

		if (currentPageNum == 0) {
			currentPageNum = 1;
		} else {
			currentPageNum = currentPageNum / 30;
			currentPageNum++;
		}
	}

	$('#pageNum').html(currentPageNum + ' of ' + Math.ceil(numPages));
	$('#firstPage').attr('href', getAddressWithOffset(0));
	$('#previousPage').attr('href', getAddressWithOffset((currentPageNum - 2) * 30));
	$('#nextPage').attr('href', getAddressWithOffset(currentPageNum * 30));
	$('#lastPage').attr('href', getAddressWithOffset((Math.ceil(numPages) - 1) * 30));

	if (currentPageNum <= 1) {
		$('#firstPageHolder').addClass('disabled');
		$('#previousPageHolder').addClass('disabled');
	}

	if (currentPageNum >= Math.ceil(numPages)) {
		$('#nextPageHolder').addClass('disabled');
		$('#lastPageHolder').addClass('disabled');
	}
}

function getAddressWithOffset(offset) {
	return 'addresses/' + walletAddress + '&offset=' + offset;
}

function copyWalletAddress(e) {
	e.preventDefault();

	navigator.clipboard.writeText(walletAddress);

	showToast();
}