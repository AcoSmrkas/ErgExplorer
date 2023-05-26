var totalCoinsTransferred = 0;
var txId = '';

$(function() {
	printTransaction(getWalletAddressFromUrl());
});

function printTransaction(txId) {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/transactions/' + txId, function(data) {
		txId = data.id;

		//Id
		$('#txHeader').html('<p><a href="Copy to clipboard!" onclick="copyTransactionAddress(event)">' + data.id + ' &#128203;</a></p>');

		//Time
		$('#txTime').html('<p>' + formatDateString(data.timestamp) + '</p>');

		//Inputs
		$('#txInputs').html(formatInputsOutputs(data.inputs));

		//Outputs
		$('#txOutputs').html(formatInputsOutputs(data.outputs));

		//Summary
		$('#txSize').html(formatKbSizeString(data.size));

		//Date received
		$('#txReceivedTime').html(formatDateString(data.timestamp));
		
		//Inclusion height
		$('#txIncludedInBlocks').html(data.inclusionHeight);
		
		//Confirmations nr.
		$('#txConfirmations').html(data.numConfirmations);

		//Total coins transferred
		$('#txTotalCoinsTransferred').html(formatErgValueString(totalCoinsTransferred, 6));

		//Fee
		let fee = 0;
		for (let j = 0; j < data.outputs.length; j++) {
			if (data.outputs[j].address == FEE_ADDRESS) {
				fee = data.outputs[j].value;
			}
		}

		$('#txFees').html(formatErgValueString(fee, 5));
		
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
    	$('#txLoadError').show();
    	console.log('Transaction data fetch failed.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function formatInputsOutputs(data) {
	let formattedData = '';

	for (let i = 0; i < data.length; i++) {
		totalCoinsTransferred += data[i].value;

		formattedData += '<div class="row div-cell">';
		
		//Address
		formattedData += '<div class="col-9"><span><strong>Address: </strong></span><a href="' + getWalletAddressUrl(data[i].address) + '" >' + formatAddressString(data[i].address, 15) + '</a></div>';

		//Status
		formattedData += '<div class="col-3 d-flex justify-content-end">' + (data[i].spentTransactionId == null ? '<span class="text-danger">Unspent' : '<span class="text-success">Spent') + '</span></div>';

		//Value
		formattedData += '<div style="padding-bottom:10px;" class="col-10"><span><strong>Value: </strong></span><span class="gray-color">' + formatErgValueString(data[i].value, 5) + '</span></div>';
		
		//Output transaction
		if (data[i].outputTransactionId != undefined) {
			formattedData += '<div class="col-2 d-flex justify-content-end"><a href="' + getTransactionAddressUrl(data[i].outputTransactionId) + '" >Output</a></div>';
		}
	
		//Assets
		if (data[i].assets.length > 0 ) {
			formattedData += '<h5><strong>Tokens:</strong></h5>';
			for (let j = 0; j < data[i].assets.length; j++) {
				formattedData += '<p><strong>' + getAssetTitle(data[i].assets[j]) + '</strong>: ' + formatAssetValueString(data[i].assets[j].amount, data[i].assets[j].decimals) + '</p>';
			}
		}

		formattedData += '</div></div>';
	}

	return formattedData;
}

function copyTransactionAddress(e) {
	copyToClipboard(e, txId);
}