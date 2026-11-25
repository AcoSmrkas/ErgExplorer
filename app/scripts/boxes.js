var totalCoinsTransferred = 0;
var boxId = '';
// Missing when a browser pairs this script with an older cached copy of the page
const boxScriptsLoaded = typeof appendBoxScript == 'function';

$(function() {
	boxId = getWalletAddressFromUrl();

	getTokenIcons(onGotPrices);
	getPrices(onGotPrices);

	setDocumentTitle(boxId);
});

function onGotPrices() {
	if (!gotTokenIcons || !gotPrices) return;

	// Neither explorer API serves the genesis boxes by id. genesis.js is missing when a browser pairs
	// this script with an older cached copy of the page.
	const genesisBox = typeof getGenesisBox == 'function' ? getGenesisBox(boxId) : null;

	if (genesisBox) {
		printBox(genesisBox, false);
		return;
	}

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
	if (mempool && MEMPOOL_API_HOST) {
		getPendingBox();
		return;
	}

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

// An output of a pending tx, from our node's pool.
function getPendingBox() {
	fetch(MEMPOOL_API_HOST + 'boxes/' + boxId)
	.then(async response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}

		const buffer = new TextDecoder("utf-8").decode(await response.arrayBuffer());
		printBox(JSONbig.parse(buffer), true);
	})
	.catch(function() {
		showLoadError('No results matching your query.');
		$('#txLoading').hide();
	});
}

function printBox(data, mempool) {	
	//Id
	$('#boxHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId + ' &#128203;</a></p>');
	$('#boxHeaderMobile').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.boxId.substr(0, 8) + '...' + data.boxId.substr(data.boxId.length - 4) + ' &#128203;</a></p>');

	// A copy from before formatBox adds fields of its own
	const box = { ...data };

	delete data.boxId;

	let html = $('#boxHolder').html() + formatBox(data, true);

	html += '<div class="row div-cell border-flat p-2"><div class="raw-head mb-1"><strong class="text-white">Raw:</strong>'
		+ (boxScriptsLoaded ? '<a title="Copy raw box" aria-label="Copy raw box" href="Copy to clipboard!" onclick="copyRaw(event, \'#boxRaw\')">&#128203;</a>' : '')
		+ '</div><div style="word-wrap:break-word;background: var(--striped-1);" class="div-cell-dark"><pre id="boxRaw"></pre></div></div>';

	$('#boxHolder').html(html);

	if (boxScriptsLoaded) {
		showRaw('#boxRaw', box);
		appendBoxScript(box, $('#boxHolder .box-card'));
		printContextVariables(box);
	} else {
		$('#boxRaw').text(JSON.stringify(box, null, 4));
	}

	$('#boxDataHolder').show();

	getAddressesInfo();

    $('#txLoading').hide();
   
	$('#infoBottom').html($('#infoTop').html());
}

// What the tx that spent the box passed to its contract, above its ErgoTree. Mainnet only.
async function printContextVariables(box) {
	if (!box.spentTransactionId || networkType == 'testnet') return;

	try {
		const extensions = await getContextExtensions(box.spentTransactionId, false);
		const extension = extensions && extensions.get(box.boxId);

		if (!extension || Object.keys(extension).length == 0) return;

		$('#boxHolder .box-tree').prev().before(formatContextVariables(extension));
		getAddressesInfo();
	} catch (error) {
		console.error('Context variables failed:', error);
	}
}

function copyTransactionAddress(e) {
	copyToClipboard(e, boxId);
}