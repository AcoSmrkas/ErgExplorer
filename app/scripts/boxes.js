var totalCoinsTransferred = 0;
var boxId = '';

$(function() {
	boxId = getWalletAddressFromUrl();

	getPrices(onGotPrices);

	setDocumentTitle(boxId);
});

function onGotPrices() {
	getBox(false);
}

function getBoxUrl(mempool) {
	let boxUrl = API_HOST_2 + 'boxes/' + boxId;

	if (networkType == 'testnet') {
		boxUrl = API_HOST_2 + 'api/v1/boxes/' + boxId;
	}

	if (mempool) {
		boxUrl = 'https://api.ergoplatform.com/boxes/unconfirmed/' + boxId;

		if (networkType == 'testnet') {
			boxUrl = 'https://api-testnet.ergoplatform.com/boxes/unconfirmed/' + boxId;
		}		
	}

	return boxUrl;
}

function getBox(mempool) {
	let boxUrl = getBoxUrl(mempool);

	fetch(boxUrl)
	.then(async response => {
		if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let abuffer = await response.arrayBuffer();
		const buffer = new TextDecoder("utf-8").decode(abuffer);
        const stringFromBuffer = buffer.toString('utf8');

        txData = JSONbig.parse(stringFromBuffer);

		if (mempool) {
			let walletAddress = txData.inputs[0].address;

			let addressMempoolUrl = API_HOST_2 + 'mempool/transactions/byAddress/' + walletAddress;

		    if (networkType == 'testnet') {
		        addressMempoolUrl = API_HOST_2 + 'api/v1/mempool/transactions/byAddress/' + walletAddress
		    }

			$.get(addressMempoolUrl, function(data) {
				for (let i = 0; i < data.items.length; i++) {
					if (data.items[i].id == boxId) {
						printBox(data.items[i], mempool);
						break;
					}
				}

				printBox(txData, mempool);
			}).fail(function() {
				printBox(txData, mempool);
			});
		} else {
			printBox(txData, mempool);
		}
	})
    .catch(function() {
    	if (mempool) {
    		showLoadError('No results matching your query.');
	        $('#txLoading').hide();
    	} else {
    		getBox(true);
    	}
    });
}

function printBox(data, mempool) {	
	//Id
	$('#boxHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId + ' &#128203;</a></p>');
	$('#boxHeaderMobile').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId.substr(0, 8) + '...' + data.boxId.substr(data.boxId.length - 4) + ' &#128203;</a></p>');

	const rawData = JSON.stringify(data, null, 4);

	delete data.boxId;

	let html = $('#boxHolder').html() + formatBox(data, true);

	html += `<div class="row div-cell border-flat p-2"><p style="margin-bottom:5px;"><strong class="text-white">Raw:</strong></p><div style="word-wrap:break-word;background: var(--striped-1);" class="div-cell-dark"><pre style="overflow-wrap: anywhere;
  white-space: break-spaces; margin: 0;">${rawData}</pre></div></div>`;

	$('#boxHolder').html(html);

	$('#boxDataHolder').show();

	getAddressesInfo();

    $('#txLoading').hide();
   
	$('#infoBottom').html($('#infoTop').html());
}

function copyTransactionAddress(e) {
	copyToClipboard(e, boxId);
}