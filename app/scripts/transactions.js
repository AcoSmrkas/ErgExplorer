var totalCoinsTransferred = 0;
var txId = '';

$(function() {
	txId = getWalletAddressFromUrl();

	getPrices(printTransaction);

	setDocumentTitle(txId);

    $('#searchType').val('1');
});

function printTransaction() {
	var jqxhr = $.get(API_HOST + 'transactions/' + txId, function(data) {

		//Id
		$('#txHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.id + ' &#128203;</a></p>');

		//Time
		$('#txTime').html('<p>' + formatDateString(data.timestamp) + '</p>');

		//Inputs
		$('#txInputs').html(formatInputsOutputs(data.inputs));

		//Outputs
		$('#txOutputs').html(formatInputsOutputs(data.outputs));

		//Size
		$('#txSize').html(formatKbSizeString(data.size));

		//Date received
		$('#txReceivedTime').html(formatDateString(data.timestamp));
		
		//Inclusion height
		$('#txIncludedInBlocks').html(data.inclusionHeight);
		
		//Confirmations nr.
		$('#txConfirmations').html(data.numConfirmations);

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
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function copyTransactionAddress(e) {
	copyToClipboard(e, txId);
}