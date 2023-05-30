var tokenData = undefined;
var tokenId = '';

$(function() {
	tokenId = getWalletAddressFromUrl();

	printToken();

	setDocumentTitle(tokenId);
});

function printToken() {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/tokens/' + tokenId, function(data) {
		tokenData = data;

		//Id
		$('#tokenHeader').html('<p><a href="Copy to clipboard!" onclick="copyTokenAddress(event)">' + tokenData.id + ' &#128203;</a></p>');

		//Name
		$('#tokenName').html('<p>' + tokenData.name + '</p>');

		//Emission amount
		$('#tokenEmissionAmount').html('<p>' + formatValue(tokenData.emissionAmount) + '</p>');

		//Decimals
		$('#tokenDecimals').html('<p>' + tokenData.decimals + '</p>');

		//Type
		$('#tokenType').html('<p>' + tokenData.type + '</p>');

		//Description
		$('#tokenDescription').html('<p>' + tokenData.description + '</p>');

		$('#tokenDataHolder').show();
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function copyTokenAddress(e) {
	copyToClipboard(e, tokenId);
}