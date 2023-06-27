var blockData = undefined;
var blockId = '';

$(function() {
	blockId = getWalletAddressFromUrl();

	getPrices(printBlock)

	setDocumentTitle(blockId);

    $('#searchType').val('3');
});

function printBlock() {
	var jqxhr = $.get(API_HOST + 'blocks/' + blockId, function(data) {
		blockData = data.block;

		printBlockSummary();
		printBlockTransactions();

		$('#blockDataHolder').show();
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function printBlockSummary() {
	//Id
	$('#blockHeader').html('<p><a href="Copy to clipboard!" onclick="copyBlockAddress(event)">' + blockData.header.id + ' &#128203;</a></p>');

	//Time
	$('#blockTime').html('<p>' + formatDateString(blockData.header.timestamp) + '</p>');

	//Height
	$('#blockHeight').html('<p>' + blockData.header.height + '</p>');

	//Previous
	$('#blockPrevious').html('<p><a href="' + getBlockUrl(blockData.header.parentId) + '">' + blockData.header.parentId + '</a></p>');

	//Difficulty
	$('#blockDifficulty').html('<p>' + blockData.header.difficulty + '</p>');

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
	$('#blockBits').html('<p>' + blockData.header.nBits + '</p>');

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
		formattedData += '<div class="row w-100 div-cell-dark"><div class="col-9"><a href="' + getTransactionsUrl(transactionData.id) + '">' + transactionData.id + '</a></div><div id="txTime" class="col-3 d-flex justify-content-end">' + formatDateString(transactionData.timestamp) + '</div></div>';

		formattedData += '<div class="row w-100"><div class="col-md-6 div-cell-dark p-0 block-tx-holder">';

		//Inputs
		formattedData += formatInputsOutputs(transactionData.inputs);

		formattedData += '</div><div class="col-md-6 div-cell-dark p-0 block-tx-holder">';

		//Outputs
		formattedData += formatInputsOutputs(transactionData.outputs);

		formattedData += '</div></div></div><br>';
	}

	$('#blockTransactions').html(formattedData);
}

function copyBlockAddress(e) {
	copyToClipboard(e, blockId);
}