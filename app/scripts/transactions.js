var totalCoinsTransferred = 0;
var txId = '';
var mempoolInterval = undefined;
var txNotification = undefined;

const treasuryOriginTx = '{"id":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","inclusionHeight":3850,"timestamp":1562142058940,"index":2,"globalIndex":3888,"numConfirmations":1067072,"inputs":[],"dataInputs":[],"outputs":[{"boxId":"8e130114a671171e566382911404a67fc37ccbfe637212eaab90037e19c3336c","transactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","value":4330776400000000,"index":0,"globalIndex":7778,"creationHeight":5,"settlementHeight":3850,"ergoTree":"100e040004c094400580809cde91e7b0010580acc7f03704be944004808948058080c7b7e4992c0580b4c4c32104fe884804c0fd4f0580bcc1960b04befd4f05000400ea03d192c1b2a5730000958fa373019a73029c73037e997304a305958fa373059a73069c73077e997308a305958fa373099c730a7e99730ba305730cd193c2a7c2b2a5730d00d5040800","address":"4L1ktFSzm3SH1UioDuUf5hyaraHird4D2dEACwQ1qHGjSKtA6KaNvSzRCZXZGf9jkfNAEC1SrYaZmCuvb2BKiXk5zW9xuvrXFT7FdNe2KqbymiZvo5UQLAm5jQY8ZBRhTZ4AFtZa1UF5nd4aofwPiL7YkJuyiL5hDHMZL1ZnyL746tHmRYMjAhCgE7d698dRhkdSeVy","assets":[],"additionalRegisters":{"R4":{"serializedValue":"0e6f98040483030808cd039bb5fe52359a64c99a60fd944fc5e388cbdc4d37ff091cc841c3ee79060b864708cd031fb52cf6e805f80d97cde289f4f757d49accf0c83fb864b27d2cf982c37f9a8b08cd0352ac2a471339b0d23b3d2c5ce0db0e81c969f77891b9edf0bda7fd39a78184e7","sigmaType":"Coll[SByte]","renderedValue":"98040483030808cd039bb5fe52359a64c99a60fd944fc5e388cbdc4d37ff091cc841c3ee79060b864708cd031fb52cf6e805f80d97cde289f4f757d49accf0c83fb864b27d2cf982c37f9a8b08cd0352ac2a471339b0d23b3d2c5ce0db0e81c969f77891b9edf0bda7fd39a78184e7"}},"spentTransactionId":"6be0b3878681e211afbc255584692c7720f8df5058ca86c818a1da6dd0b277cf","mainChain":true},{"boxId":"eb73a48270b490529ccf052e70c667c4836a2799e65ab974eceda82df30b5438","transactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","value":5000000000,"index":1,"globalIndex":7779,"creationHeight":5,"settlementHeight":3850,"ergoTree":"0008cd039bb5fe52359a64c99a60fd944fc5e388cbdc4d37ff091cc841c3ee79060b8647","address":"9heP7nBJRtSD9nEgJ4LSexPMtsoweLX8Gtp92LNLMcu2xdUp1EH","assets":[],"additionalRegisters":{},"spentTransactionId":"d6b0908e01371f93042158be18249130afcf2b74d9b99298ac63c5d37797ffed","mainChain":true},{"boxId":"16c29667d28f7cacadd0bb02165575a25f06eb396f4fbe0e311523129061ff2a","transactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","value":5000000000,"index":2,"globalIndex":7780,"creationHeight":5,"settlementHeight":3850,"ergoTree":"0008cd031fb52cf6e805f80d97cde289f4f757d49accf0c83fb864b27d2cf982c37f9a8b","address":"9ghmd4QqqMYVDsZ8t4bZFqDCGtM5dh5UQjakKGBPRWgsYzBN9CP","assets":[],"additionalRegisters":{},"spentTransactionId":"d6b0908e01371f93042158be18249130afcf2b74d9b99298ac63c5d37797ffed","mainChain":true},{"boxId":"b312a84766b397fa1c6e08e3e9a39a5c14ad43a8eb265e479dd93d928be17246","transactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","value":5000000000,"index":3,"globalIndex":7781,"creationHeight":5,"settlementHeight":3850,"ergoTree":"0008cd0352ac2a471339b0d23b3d2c5ce0db0e81c969f77891b9edf0bda7fd39a78184e7","address":"9h6DT44xdB6C6nTosNZQVDZusMscGuEFqccQNocKrj165C7G6hf","assets":[],"additionalRegisters":{},"spentTransactionId":"d6b0908e01371f93042158be18249130afcf2b74d9b99298ac63c5d37797ffed","mainChain":true},{"boxId":"3777697d3e41c41e95b7ab475845f59053af02327ecf1b9f7990bf921b1a1783","transactionId":"e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83","blockId":"307a42f9811f03514a6296113f0f3932ea418974a1de279b321f346fe806bf5f","value":100000000,"index":4,"globalIndex":7782,"creationHeight":5,"settlementHeight":3850,"ergoTree":"1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304","address":"2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe","assets":[],"additionalRegisters":{},"spentTransactionId":"7eb2fbc86e8bfa7bfe431933a716e8d71f0bc71f11171881aa4b3f195bff9843","mainChain":true}],"size":692}';

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
	if (txId == 'e179f12156061c04d375f599bd8aea7ea5e704fab2d95300efb2d87460d60b83') {
		printTransaction(JSON.parse(treasuryOriginTx), false);
		return;
	}

	getTransaction(false);
}

function getTxUrl(mempool) {
	let txUrl = API_HOST_2 + 'transactions/' + txId;

	if (networkType == 'testnet') {
		txUrl = API_HOST_2 + 'api/v1/transactions/' + txId;
	}

	if (mempool) {
		txUrl = 'https://api.ergoplatform.com/transactions/unconfirmed/' + txId;

		if (networkType == 'testnet') {
			txUrl = 'https://api-testnet.ergoplatform.com/transactions/unconfirmed/' + txId;
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
	if (mempool) {
		showNotificationPermissionToast();
	}

	//Id
	$('#txHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.id + ' &#128203;</a></p>');
	$('#txHeaderMobile').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.id.substr(0, 8) + '...' + data.id.substr(data.id.length - 4) + ' &#128203;</a></p>');

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