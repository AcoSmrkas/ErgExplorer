var tokenData = undefined;
var tokenId = '';

$(function() {
	tokenId = getWalletAddressFromUrl();

	printToken();
	getNftInfo(tokenId, onGetNftInfoDone);

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
		$('#tokenDescription').html('<pre class="tokenDescriptionPre">' + formatNftDescription(tokenData.description) + '</pre>');

		//Icon
		$('#tokenIconImg').attr('src', 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/' + tokenData.id + '.svg');

		$('#tokenDataHolder').show();
    })
    .fail(function() {
    	showLoadError('No results matching your query.');
    })
    .always(function() {
        $('#txLoading').hide();
    });
}

function onGetNftInfoDone(nftInfo, message) {
	if (nftInfo == null || nftInfo.type == undefined) {
		return;
	}

	$('#nftType').html('<p>' + nftInfo.type + '</p>');
	$('#nftLink').html('<p>' + nftInfo.rawLink + '</p>');
	$('#nftMintedAddress').html('<p><a href="' + getWalletAddressUrl(nftInfo.data.address) + '">' + nftInfo.data.address + '</a></p>');
	$('#nftMintedTransaction').html('<p><a href="' + getTransactionsUrl(nftInfo.data.txId) + '">' + nftInfo.data.txId + '</a></p>');
	$('#nftCreationHeight').html('<p>' + nftInfo.data.creationHeight + '</p>');

	if (nftInfo.type == NFT_TYPE.Image) {
		$('#nftPreviewImg').attr('src', nftInfo.link);
		$('#nftImageFull').attr('src', nftInfo.link);
		$('#nftPreviewImg').show();
	} else if (nftInfo.type == NFT_TYPE.Audio) {
		$('#nftPreviewAudioSource').attr('src', nftInfo.link);
		$('#nftPreviewAudio').show();
	} else {
		$('#nftPreviewImgHolder').hide();
		$('#nftInfoHolder').removeClass('col-md-9');
		$('#nftInfoHolder').addClass('col-12');
	}

	$('#nftHolder').show();
}

function onTokenIconLoaded() {
	$('#tokenDescriptionHolderRight').removeClass('col-xl-10 col-9');
	$('#tokenDescriptionHolderRight').addClass('col-xl-8 col-7');

	$('#tokenIcon').addClass('col-12');
	$('#tokenIcon').addClass('col-md-2');

	$('#tokenIcon').addClass('d-flex');
	$('#tokenIcon').show();
}

function copyTokenAddress(e) {
	copyToClipboard(e, tokenId);
}

function showFullImgPreview() {
	$('#nftImageFullBack').fadeIn();
	$('#nftImageFullBack').css('display', 'flex');

	$('body').css('height', '100%');
	$('body').css('overflow-y', 'hidden');

	window.scrollTo(0, 0);
}

function hideFullImgPreview() {
	$('#nftImageFullBack').fadeOut();

	$('body').css('height', 'inherit');
	$('body').css('overflow-y', 'auto');

	scrollToElement($('#nftPreviewImg'));
}