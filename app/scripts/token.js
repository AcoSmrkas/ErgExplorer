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
	let emissionAmount = tokenData.emissionAmount;
	$('#tokenEmissionAmount').html('<p>' + formatValue(tokenData.emissionAmount) + '</p>');

	if (tokenData.emissionAmount == 1) {
		getCurrentAddress();
	} else {
		$('#nftCurrentAddressHolder').remove();
	}

	//Decimals
	$('#tokenDecimals').html('<p>' + tokenData.decimals + '</p>');

	//Type
	$('#tokenType').html('<p>' + tokenData.type + '</p>');

	//Burned
	let isBurned = tokenData.isBurned == 't';
	if (isBurned) {
		$('#tokenBurned').show();
	} else {
		checkIfBurned();
	}

	//Description
	let asciiArt = isAsciiArt(tokenData.description);

	$('#tokenDescription').html('<pre class="tokenDescriptionPre' + (asciiArt ? ' pre-ascii' : '') + '">' + formatNftDescription(tokenData.description) + '</pre>');

	//Icon
	$('#tokenIconImg').attr('src', 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/' + tokenData.id + '.svg');

	$('#tokenDataHolder').show();

	if (networkType == 'testnet') {
//		return;
	}

	if (nftInfo.isNft) {
		$('#tokenHolder').remove();

		nftType = nftInfo.type;

		//NFT type
		$('#nftType').html('<p>' + nftInfo.type + '</p>');
		
		//SHA256 hash
		$('#nftHash').html('<p>' + nftInfo.hash + '</p>');
		if (nftInfo.type == NFT_TYPE.ArtCollection) {
			$('#nftHashHolder').hide();
		}

		//Mint address
		let mintAddress = tokenData.address;
		if (tokenData.mintWallet != null) {
			mintAddress = tokenData.mintWallet;
		}

		$('#nftMintedAddress').html('<p><a href="' + getWalletAddressUrl(mintAddress) + '">' + mintAddress + '</a></p>');

		$('#nftMintedTransaction').html('<p><a href="' + getTransactionsUrl(tokenData.transactionId) + '">' + tokenData.transactionId + '</a></p>');
		$('#nftCreationHeight').html('<p><a href="' + getBlockUrl(tokenData.blockId) + '">' + tokenData.creationHeight + '</a></p>');

		let linkString = nftInfo.link;
		if (linkString.length > 100) {
			linkString = formatAddressString(linkString, 95);
		}
		if (nftInfo.additionalLinks.length > 0) {

			let formattedLinksHtml = '<p>Link 01: <a  target="_new" href="' + nftInfo.link + '">' + linkString + '</a></p>';

			for (let i = 0; i < nftInfo.additionalLinks.length; i++) {
				linkString = nftInfo.additionalLinks[i];
				if (linkString.length > 100) {
					linkString = formatAddressString(linkString, 95);
				}

				formattedLinksHtml += '<p>Link ' + i + 2 + ': <a  target="_new" href="' + nftInfo.additionalLinks[i] + '">' + linkString + '</a></p>'
			}

			$('#nftLink').html(formattedLinksHtml);
		} else {
			$('#nftLink').html('<p><a  target="_new" href="' + nftInfo.link + '">' + linkString + '</a></p>');
		}

		if (nftInfo.type == NFT_TYPE.Image) {
			$('#nftPreviewImg').attr('src', nftInfo.link);
			$('#nftImageFull').attr('src', nftInfo.link);
			$('#nftPreviewImg').show();

			if (nftInfo.link.substr(0, 19) == 'data:image/svg+xml;') {
				$('#nftPreviewImg').css('width', '200px');
				$('#nftImageFull').css('width', '400px');
			}
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

		if (networkType == 'mainnet') {
			$('#nftAuction').html('<p>See on <a  target="_new" href="https://www.skyharbor.io/token/' + tokenData.id + '">SkyHarbor.io</a></p><p>See on <a  target="_new" href="https://ergoauctions.org/artwork/' + tokenData.id + '">Ergoauctions.org</a></p>');
		} else {
			$('#marketplaceHolder').remove();
		}

		$('#nftHolder').show();
	} else {
		$('#nftHolder').remove();
		
		$('#nftType').html('<p>Token</p>');
		
		//Mint address
		let mintAddress = tokenData.address;
		if (tokenData.mintWallet != null) {
			mintAddress = tokenData.mintWallet;
		}

		$('#nftMintedAddress').html('<p><a href="' + getWalletAddressUrl(mintAddress) + '">' + mintAddress + '</a></p>');
		$('#nftMintedTransaction').html('<p><a href="' + getTransactionsUrl(tokenData.transactionId) + '">' + tokenData.transactionId + '</a></p>');
		$('#nftCreationHeight').html('<p><a href="' + getBlockUrl(tokenData.blockId) + '">' + tokenData.creationHeight + '</a></p>');

		$('#tokenHolder').show();
	}
}

function getCurrentAddress() {
	var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId, function(data) {
		if (data.total == 0) {
			return;
		}

		let txOFfset = data.total - 1;

		var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId + '?offset=' + txOFfset, function(data) {
			let currentAddress = data.items[0].address;
			$('#nftCurrentAddress').html('<p><a href="' + getWalletAddressUrl(currentAddress) + '">' + currentAddress + '</a></p>');
			$('#nftCurrentAddressHolder').show();
		})
		.fail(function() {
			console.log('Failed to fetch current address (2).');
		});
	})
	.fail(function() {
		console.log('Failed to fetch current address. (1)');
	});
}

function checkIfBurned() {
	var jqxhr = $.get(API_HOST + 'boxes/unspent/byTokenId/' + tokenId, function(data) {
		if (data.total == 0) {
			$('#tokenBurned').show();
			$.get(ERGEXPLORER_API_HOST + 'tokens/updateSingle?id=' + tokenId);
		}
	});
}

function onTokenIconLoaded() {
	$('#tokenDescriptionHolderRight').removeClass('col-xl-10 col-9');
	$('#tokenDescriptionHolderRight').addClass('col-xl-8 col-7');

	$('#tokenIcon').addClass('col-12');
	$('#tokenIcon').addClass('col-md-2');

	$('#tokenIcon').addClass('d-flex');
	$('#tokenIcon').show();

	if (!hasIcon(tokenId)) {
		addIcon(tokenId);
	}
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