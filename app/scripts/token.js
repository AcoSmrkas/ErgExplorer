var tokenData = undefined;
var tokenId = '';
var nftType = undefined;

$(function() {
	tokenId = getWalletAddressFromUrl();

	getNftInfo(tokenId, onGetNftInfoDone);

	setDocumentTitle(tokenId);
});

function onGetNftInfoDone(nftInfo, message) {
	$('#txLoading').hide();

	if (nftInfo == null) {
    	showLoadError('No results matching your query.');
    	return;
	}

	let tokenData = nftInfo.data;

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

	if (!nftInfo.isNft) {
		return;
	}

	nftType = nftInfo.type;

	//NFT type
	$('#nftType').html('<p>' + nftInfo.type + '</p>');
	
	//SHA256 hash
	$('#nftHash').html('<p>' + nftInfo.hash + '</p>');
	if (nftInfo.type == NFT_TYPE.ArtCollection) {
		$('#nftHashHolder').hide();
	}


	//Mint address
	$('#nftMintedAddress').html('<p><a href="' + getWalletAddressUrl(tokenData.address) + '">' + tokenData.address + '</a></p>');

	/*
	let currentAddress = tokenData[tokenData.length - 1].address;
	if (currentAddress.length > 70) {
		currentAddress = formatAddressString(currentAddress, 60);
	}
	$('#nftCurrentAddress').html('<p><a href="' + getWalletAddressUrl(tokenData[tokenData.length - 1].address) + '">' + currentAddress + '</a></p>');
	*/

	$('#nftMintedTransaction').html('<p><a href="' + getTransactionsUrl(tokenData.transactionId) + '">' + tokenData.transactionId + '</a></p>');
	$('#nftCreationHeight').html('<p><a href="' + getBlockUrl(tokenData.blockId) + '">' + tokenData.creationHeight + '</a></p>');

	if (nftInfo.additionalLinks.length > 0) {
		let formattedLinksHtml = '<p>Link 01: <a  target="_new" href="' + nftInfo.link + '">' + nftInfo.link + '</a></p>';

		for (let i = 0; i < nftInfo.additionalLinks.length; i++) {
			formattedLinksHtml += '<p>Link ' + i + 2 + ': <a  target="_new" href="' + nftInfo.additionalLinks[i] + '">' + nftInfo.additionalLinks[i] + '</a></p>'
		}

		$('#nftLink').html(formattedLinksHtml);
	} else {
		$('#nftLink').html('<p><a  target="_new" href="' + nftInfo.link + '">' + nftInfo.link + '</a></p>');
	}

	if (nftInfo.type == NFT_TYPE.Image) {
		$('#nftPreviewImg').attr('src', nftInfo.link);
		$('#nftImageFull').attr('src', nftInfo.link);
		$('#nftPreviewImg').show();
	} else if (nftInfo.type == NFT_TYPE.Audio) {
		$('#nftPreviewAudioSource').attr('src', nftInfo.link);
		$('#nftPreviewAudio').show();
		document.getElementById('nftAudio').load();

		$('#nftPreviewImgHolder').hide();
		$('#nftPreviewImgHolder').removeClass('col-lg-3');
		$('#nftInfoHolder').removeClass('col-lg-9');

		if (nftInfo.additionalLinks.length > 0) {
			$('#nftPreviewImg').attr('src', nftInfo.additionalLinks[0]);
		$('#nftImageFull').attr('src', nftInfo.additionalLinks[0]);
		}
	} else if (nftInfo.type == NFT_TYPE.Video) {
		$('#nftPreviewVideoSource').attr('src', nftInfo.link);
		$('#nftPreviewVideo').show();
		document.getElementById('nftPreviewVideo').load();

		$('#nftPreviewImgHolder').removeClass('col-lg-3');
		$('#nftInfoHolder').removeClass('col-lg-9');

		$('#nftPreviewImgHolder').addClass('col-xl-5');
		$('#nftInfoHolder').addClass('col-xl-7');
		$('#nftPreviewImgHolder').css('min-height', '0');
	} else {
		$('#nftPreviewImgHolder').hide();
		$('#nftInfoHolder').removeClass('col-lg-9');
		$('#nftInfoHolder').addClass('col-12');
		$('#nftPreviewImgHolder').css('min-height', '0');
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

function onNftImageLoad() {
	if (nftType != NFT_TYPE.Audio) {
		return;
	}

	$('#nftPreviewImgHolder').show();
	$('#nftPreviewImg').show();
	$('#nftPreviewImgHolder').removeClass('col-lg-3');
	$('#nftInfoHolder').removeClass('col-lg-9');

	$('#nftPreviewImgHolder').addClass('col-lg-4');
	$('#nftInfoHolder').addClass('col-lg-8');
}