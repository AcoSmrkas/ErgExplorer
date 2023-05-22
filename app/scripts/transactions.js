var totalCoinsTransferred = 0;

$(function() {
	printTransaction(getWalletAddressFromUrl());
});

function printTransaction(txId) {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/transactions/' + txId, function(data) {
		$('#txHeader').html('<p>' + data.id + '</p>');

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

		$('#txDataHolder').show();
    })
    .fail(function() {
    	$('txLoadError').show();
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

		formattedData += '<tr>';
		
		//Address
		formattedData += '<td><a href="' + getWalletAddressUrl(data[i].address) + '" >' + formatAddressString(data[i].address, 15) + '</a></td>';

		//Value
		formattedData += '<td><p>' + formatErgValueString(data[i].value, 5) + '</p>';

		//Assets
		if (data[i].assets.length > 0 ) {
			for (let j = 0; j < data[i].assets.length; j++) {
				formattedData += '<p><strong>' + formatAddressString(data[i].assets[j].tokenId, 15) + '</strong>: ' + formatAssetValueString(data[i].assets[j].amount, data[i].assets[j].decimals) + '</p>';
			}
		}

		formattedData += '</td></tr>';
	}

	return formattedData;
}