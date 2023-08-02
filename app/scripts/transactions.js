var totalCoinsTransferred = 0;
var txId = '';
var mempoolInterval = undefined;

$(function() {
	txId = getWalletAddressFromUrl();

	getPrices(onGotPrices);

	setDocumentTitle(txId);

    $('#searchType').val('1');
});

function onGotPrices() {
	printTransaction(false);
}

function printTransaction(mempool) {
	let txUrl = API_HOST + 'transactions/' + txId;

	if (networkType == 'testnet') {
		txUrl = API_HOST + 'api/v1/transactions/' + txId;
	}

	if (mempool) {
		txUrl = 'https://api.ergoplatform.com/transactions/unconfirmed/' + txId;

		if (networkType == 'testnet') {
			txUrl = 'https://api-testnet.ergoplatform.com/transactions/unconfirmed/' + txId;
		}		
	}

	var jqxhr = $.get(txUrl, function(data) {
		if (mempool) {
			showNotificationPermissionToast();
		}

		//Id
		$('#txHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.id + ' &#128203;</a></p>');

		//Time
		if (mempool) {
			$('#txTime').html('<p>' + formatDateString(data.creationTimestamp) + '</p>');
		} else {
			$('#txTime').html('<p>' + formatDateString(data.timestamp) + '</p>');
		}

		//Inputs
		$('#txInputs').html(formatInputsOutputs(data.inputs));

		//Outputs
		$('#txOutputs').html(formatInputsOutputs(data.outputs));

		//Size
		$('#txSize').html(formatKbSizeString(data.size));

		//Date received
		if (mempool) {
			$('#txReceivedTime').remove();
			$('#receivedTimeLeft').remove();
		} else {
			$('#txReceivedTime').html(formatDateString(data.timestamp));
		}

		//Inclusion height
		if (mempool) {
			$('#includedInBlocksLeft').remove();
			$('#txIncludedInBlocks').remove();
		} else {
			$('#txIncludedInBlocks').html('<a href="' + getBlockUrl(data.outputs[0].blockId) + '">' + data.inclusionHeight + '</a>');
		}

		//Confirmations nr.
		if (mempool) {
			$('#txConfirmations').html('<span class="text-warning">Pending</a>');
		} else {
			$('#txConfirmations').html(data.numConfirmations);
		}

		//Total coins transferred
		for (let i = 0; i < data.outputs.length; i++) {
			totalCoinsTransferred += data.outputs[i].value;
		}

		$('#txTotalCoinsTransferred').html(formatErgValueString(totalCoinsTransferred, 6) + ' ' + formatAssetDollarPriceString(totalCoinsTransferred, ERG_DECIMALS, 'ERG'));

		//Fee
		let fee = 0;
		for (let j = 0; j < data.outputs.length; j++) {
			if (data.outputs[j].address == FEE_ADDRESS) {
				fee = data.outputs[j].value;
			}
		}

		$('#txFees').html(formatErgValueString(fee, 5) + ' ' + formatAssetDollarPriceString(fee, ERG_DECIMALS, 'ERG'));
		
		//Fees per byte
		$('#txFeesPerByte').html(formatErgValueString(fee / (data.size), 9));
		
		//Tx scripts
		$('#txScripts').html('Scripts');

		//Raw input
		$('#txRawInput').html(JSON.stringify(data.inputs, null, 4));

		//Raw output
		$('#txRawOutput').html(JSON.stringify(data.outputs, null, 4));

		$('#txDataHolder').show();

		getAddressesInfo();

        $('#txLoading').hide();
    })
    .fail(function() {
    	if (mempool) {
    		showLoadError('No results matching your query.');
	        $('#txLoading').hide();
    	} else {
    		printTransaction(true);
    	}
    });
}

function checkMempoolChanged() {
	let txUrl = API_HOST + 'transactions/' + txId;

	if (networkType == 'testnet') {
		txUrl = API_HOST + 'api/v1/transactions/' + txId;
	}

	var jqxhr = $.get(txUrl, function(data) {
		if (Notification.permission === 'granted') {
    		const img = 'https://ergexplorer.com/images/logo.png';
			const text = 'Transaction  ' + txId + ' has been confirmed.';
			const notification = new Notification('Transaction confirmed', { body: text, icon: img });
			
			notification.onclick = function(x) {
				window.focus();
				this.close();
				location.reload();
			};
		}

		if (mempoolInterval != undefined) {
			clearInterval(mempoolInterval);
		}

		if (document.hasFocus()) {
  			location.reload();
  		}
	});
}

function trackTransaction() {
	if (Notification.permission !== 'granted') {
		return;
	}

	if (mempoolInterval != undefined) {
		return;
	}

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

function copyTransactionAddress(e) {
	copyToClipboard(e, txId);
}