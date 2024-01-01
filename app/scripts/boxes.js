var totalCoinsTransferred = 0;
var txId = '';
var mempoolInterval = undefined;
var txNotification = undefined;

$(function() {
	txId = getWalletAddressFromUrl();

	getPrices(onGotPrices);

	setDocumentTitle(txId);

    $('#searchType').val('1');
});

window.onfocus = (event) => {
	if (txNotification != undefined) {
		txNotification.close();
		location.reload();
	}
};

function onGotPrices() {
	getTransaction(false);
}

function getTxUrl(mempool) {
	let txUrl = API_HOST_2 + 'boxes/' + txId;

	if (networkType == 'testnet') {
		txUrl = API_HOST_2 + 'api/v1/boxes/' + txId;
	}

	if (mempool) {
		txUrl = 'https://api.ergoplatform.com/boxes/unconfirmed/' + txId;

		if (networkType == 'testnet') {
			txUrl = 'https://api-testnet.ergoplatform.com/boxes/unconfirmed/' + txId;
		}		
	}

	return txUrl;
}

function getTransaction(mempool) {
	let txUrl = getTxUrl(mempool);

	$.get(txUrl, function(txData) {
		if (mempool) {
			let walletAddress = txData.inputs[0].address;

			let addressMempoolUrl = API_HOST_2 + 'mempool/transactions/byAddress/' + walletAddress;

		    if (networkType == 'testnet') {
		        addressMempoolUrl = API_HOST_2 + 'api/v1/mempool/transactions/byAddress/' + walletAddress
		    }

			$.get(addressMempoolUrl, function(data) {
				for (let i = 0; i < data.items.length; i++) {
					if (data.items[i].id == txId) {
						printTransaction(data.items[i], mempool);
						break;
					}
				}

				printTransaction(txData, mempool);
			}).fail(function() {
				printTransaction(txData, mempool);
			});
		} else {
			printTransaction(txData, mempool);
		}
	})
    .fail(function() {
    	if (mempool) {
    		showLoadError('No results matching your query.');
	        $('#txLoading').hide();
    	} else {
    		getTransaction(true);
    	}
    });
}

function printTransaction(data, mempool) {	
	//Id
	$('#txHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId + ' &#128203;</a></p>');
	$('#txHeaderMobile').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId.substr(0, 8) + '...' + data.boxId.substr(data.boxId.length - 4) + ' &#128203;</a></p>');

	delete data.boxId;

	$('#boxHolder').html($('#boxHolder').html() + formatBox(data, true));

	$('#txDataHolder').show();

	getAddressesInfo();

    $('#txLoading').hide();
   
	$('#infoBottom').html($('#infoTop').html());
}

function checkMempoolChanged() {
	var jqxhr = $.get(getTxUrl(false), function(data) {
		onMempoolTxConfirmed();
	});
}

function onMempoolTxConfirmed() {
	if (Notification.permission === 'granted') {
		const img = 'https://ergexplorer.com/images/logo.png';
		const text = 'Transaction  ' + txId + ' has been confirmed.';
		txNotification = new Notification('Transaction confirmed', { body: text, icon: img });
		
		txNotification.onclick = function(x) {
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

function copyTransactionAddress(e) {
	copyToClipboard(e, txId);
}