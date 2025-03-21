var blockData = undefined;
var blockId = '';

$(function() {
	blockId = getWalletAddressFromUrl();

	getPrices(printBlock)

	setDocumentTitle(blockId);
});

function printBlock() {
	fetch(API_HOST + 'blocks/' + blockId)
	.then(async response => {
		if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        let abuffer = await response.arrayBuffer();
		const buffer = new TextDecoder("utf-8").decode(abuffer);
        const stringFromBuffer = buffer.toString('utf8');

        let data = JSONbig.parse(stringFromBuffer);

		blockData = data.block;

		printBlockSummary();
		printBlockTransactions();

		$('#blockDataHolder').show();

		getAddressesInfo();
    })
    .catch(function() {
    	showLoadError('No results matching your query.');
    })
    .finally(function() {
        $('#txLoading').hide();
    });
}

function printBlockSummary() {
	//Id
	$('#blockHeader').html('<p><a href="Copy to clipboard!" onclick="copyBlockAddress(event)">' + blockData.header.id + ' &#128203;</a></p>');

	//Time
	$('#blockTime').html('<p>' + formatDateString(blockData.header.timestamp) + '</p>');

	//Height
	$('#blockHeight').html('<p>' + nFormatter(blockData.header.height, 0, true, true) + '</p>');

	//Previous
	$('#blockPrevious').html('<p><a href="' + getBlockUrl(blockData.header.parentId) + '">' + blockData.header.parentId + '</a></p>');

	//Difficulty
	$('#blockDifficulty').html('<p>' + nFormatter(blockData.header.difficulty) + '</p>');

	//Extension hash
	$('#blockExtHash').html('<p>' + blockData.header.extensionHash + '</p>');

	//Version
	$('#blockVersion').html('<p>' + blockData.header.version + '</p>');

	//Votes
	$('#blockVotes').html('<p>[' + blockData.header.votes[0] + ', '  + blockData.header.votes[1] + ', '+ blockData.header.votes[2] + ']</p>');

	//AD proofs
	$('#blockAdProofs').html('<p>' + blockData.header.adProofsRoot + '</p>');

	//Transactions root
	$('#blockTransactionsRoot').html('<p>' + blockData.header.transactionsRoot + '</p>');

	//State root
	$('#blockStateRoot').html('<p>' + blockData.header.stateRoot + '</p>');

	//Bits
	$('#blockBits').html('<p>' + nFormatter(blockData.header.nBits) + '</p>');

	//Size
	$('#blockSize').html(formatKbSizeString(blockData.header.size));

	//PoW solutions
	$('#blockPowSolutions').html('<p>pk: ' + blockData.header.powSolutions.pk + '<br>w: ' + blockData.header.powSolutions.w + '<br>n: ' + blockData.header.powSolutions.n + '<br>d: ' + blockData.header.powSolutions.d + '</p>');

	//Header Id
	$('#blockHeaderId').html('<p>' + blockData.extension.headerId + '</p>');

	//Digest
	$('#blockDigest').html('<p>' + blockData.extension.digest + '</p>');

	//Fields
	let fields = '';

	for (let i = 0; i < blockData.extension.fields.length; i++) {
		fields += '<p><strong>' + blockData.extension.fields[i][0] + ' </strong>: ' + blockData.extension.fields[i][1] + '</p>';
	}

	$('#blockFields').html(fields);

	//Ad Proofs
	$('#adProofs').html(blockData.adProofs);
}

function printBlockTransactions() {
	let formattedData = '';
	let blockTransactions = blockData.blockTransactions;

	for (let i = 0; i < blockTransactions.length; i++) {
		let transactionData = blockTransactions[i];

		//Header
		formattedData += '<div class="row w-100 div-cell-dark border-bottom-flat"><div class="col-9" style="word-break: break-all;"><a href="' + getTransactionsUrl(transactionData.id) + '">' + transactionData.id + '</a></div><div id="txTime" class="col-3 d-flex justify-content-end">' + formatDateString(transactionData.timestamp) + '</div></div>';

		formattedData += '<div class="row w-100 two-column-holder two-column-holder-md"><div class="col-md-6 div-cell-dark p-0" style="border-radius: 0 0 5px 5px;"><h2 class="p-3">Inputs</h2><div class="block-tx-holder">';

		//Inputs
		formattedData += formatInputsOutputs(transactionData.inputs);

		formattedData += '</div></div><div class="col-md-6 div-cell-dark p-0 mt-4 mt-md-0" style="border-radius: 0 0 5px 5px;"><h2 class="p-3">Outputs</h2><div class="block-tx-holder">';

		//Outputs
		formattedData += formatInputsOutputs(transactionData.outputs);

		formattedData += '</div></div></div><br>';
	}

	$('#blockTransactions').html(formattedData);
}

function copyBlockAddress(e) {
	copyToClipboard(e, blockId);
}