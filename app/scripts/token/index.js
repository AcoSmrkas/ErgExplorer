import { TokenState } from './state.js';
import { TokenApiClient } from './api-client.js';
import { TokenUIDisplay } from './ui-display.js';
import { TokenUIControllers } from './ui-controllers.js';
import { TokenAnalyzer } from './token-analyzer.js';

// Main initialization
$(function() {
	TokenState.tokenId = typeof getWalletAddressFromUrl === 'function' ? getWalletAddressFromUrl() : undefined;
	console.log('[Token Module] Token ID:', TokenState.tokenId);

	if (!TokenState.tokenId) {
		if (typeof showLoadError === 'function') {
			showLoadError('No token ID provided');
		}
		return;
	}

	// Set page title
	if (typeof setDocumentTitle === 'function') {
		setDocumentTitle(TokenState.tokenId);
	}

	// Start loading NFT info
	if (typeof getNftInfo === 'function') {
		getNftInfo(TokenState.tokenId, window.onGetNftInfoDone);
	}

	// Fetch supply and market data from Crux (will also trigger price loading)
	TokenApiClient.getCruxData();

	// Check addressbook for token addresses
	TokenApiClient.checkAddressbook();
});

// Main NFT info callback - displays token details
window.onGetNftInfoDone = function(nftInfo, message) {
	$('#txLoading').hide();

	if (nftInfo == null) {
		if (typeof showLoadError === 'function') {
			showLoadError('No results matching your query.');
		}
		return;
	}

	TokenState.tokenData = nftInfo.data;

	// Display collection info if exists
	if (TokenState.tokenData.collectionid && TokenState.tokenData.collectionid != '') {
		if (typeof getTokenUrl === 'function') {
			$('#nftCollectionId').html('<p><a href="' + getTokenUrl(TokenState.tokenData.collectionid) + '">' + TokenState.tokenData.collectionid + '</p>');
			$('#nftCollectionName').html('<p>' + TokenState.tokenData.collectionname + '</p>');
			$('#nftCollectionHolder').show();
		}
	}

	// Show scam warning if applicable
	if (TokenState.tokenData.scam) {
		$('#tokenScamHolder').show();
	}

	// Display royalty
	if (TokenState.tokenData.royaltypercent && TokenState.tokenData.royaltypercent > 0) {
		$('#royaltyHolder').show();
		$('#nftRoyalty').html('<p>' + TokenState.tokenData.royaltypercent + "%</p>");
	} else {
		$('#royaltyHolder').remove();
	}

	// Display token ID header
	$('#tokenHeader').html('<p><a href="Copy to clipboard!" onclick="copyTokenAddress(event)">' + TokenState.tokenData.id + ' &#128203;</a></p>');

	// Display token name
	$('#tokenName').html('<p>' + TokenState.tokenData.name + '</p>');

	// Display emission amount
	TokenState.decimals = TokenState.tokenData.decimals;
	if (typeof getAssetValue === 'function') {
		let emissionAmount = getAssetValue(TokenState.tokenData.emissionAmount, TokenState.tokenData.decimals);
		$('#tokenEmissionAmount').html('<p>' + (typeof nFormatter === 'function' ? nFormatter(emissionAmount, 0, true, true) : emissionAmount) + '</p>');
	}

	// Check for single NFT (1/1)
	if (TokenState.tokenData.emissionAmount == 1) {
		TokenAnalyzer.getCurrentAddress();
	} else {
		$('[id="nftCurrentAddressHolder"]').remove();
	}

	// Display decimals
	$('#tokenDecimals').html('<p>' + TokenState.tokenData.decimals + '</p>');

	// Display type
	$('#tokenType').html('<p>' + TokenState.tokenData.type + '</p>');

	// Check if token is burned
	let isBurned = TokenState.tokenData.isBurned == 't';
	if (isBurned) {
		$('#tokenBurned').show();
		$('[id="nftCurrentAddressHolder"]').remove();
		TokenAnalyzer.getBurnTx();
	} else {
		TokenAnalyzer.checkIfBurned();
	}

	// Display description
	if (typeof isAsciiArt === 'function' && typeof formatNftDescription === 'function') {
		let asciiArt = isAsciiArt(TokenState.tokenData.description);
		$('#tokenDescription').html('<pre style="max-height:200px;overflow-y:auto;" class="tokenDescriptionPre' + (asciiArt ? ' pre-ascii' : '') + '">' + formatNftDescription(TokenState.tokenData.description) + '</pre>');
	}

	// Set token icon
	let tImg = typeof getIcon === 'function' ? getIcon(TokenState.tokenData.id) : undefined;
	if (tImg == undefined) {
		tImg = 'https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/' + TokenState.tokenData.id + '.svg';
	}

	if (TokenState.tokenData.name == 'Crooks Finance Stake Key') {
		tImg = 'https://crooks-fi.com/images/logo.png';
	}

	if (TokenState.tokenData.iconurl) {
		tImg = TokenState.tokenData.iconurl;
	}

	$('#tokenIconImg').attr('src', tImg);
	$('#tokenDataHolder').show();

	// Handle NFTs (special tokens with media)
	if (nftInfo.isNft) {
		$('#tokenHolder').remove();
		TokenState.nftType = nftInfo.type;

		$('#nftType').html('<p>' + nftInfo.type + '</p>');
		$('#nftHash').html('<p>' + nftInfo.hash + '</p>');
		if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.ArtCollection : 'Art collection')) {
			$('[id="nftHashHolder"]').remove();
		}

		// Mint address
		let mintAddress = TokenState.tokenData.address;
		if (TokenState.tokenData.mintWallet != null) {
			mintAddress = TokenState.tokenData.mintWallet;
		}

		if (typeof addAddress === 'function') addAddress(mintAddress);
		$('#nftMintedAddress').html('<p><a class="address-string" addr="' + mintAddress + '" href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(mintAddress) : '#') + '">' + (typeof formatLongAddressString === 'function' ? formatLongAddressString(mintAddress) : mintAddress) + '</a></p>');

		$('#nftMintedTransaction').html('<p><a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(TokenState.tokenData.transactionId) : '#') + '">' + TokenState.tokenData.transactionId + '</a></p>');
		$('#nftCreationHeight').html('<p><a href="' + (typeof getBlockUrl === 'function' ? getBlockUrl(TokenState.tokenData.blockId) : '#') + '">' + (typeof nFormatter === 'function' ? nFormatter(TokenState.tokenData.creationHeight, 0, true, true) : TokenState.tokenData.creationHeight) + '</a></p>');

		// NFT links display logic
		let fullUrl = '';
		if (!nftInfo.link.ipfsCid) {
			fullUrl = nftInfo.link.url;
		}
		let additionalFullUrl = Array();

		let linkString = fullUrl;
		const nftLinkMaxLength = typeof NFT_LINK_MAX_LENGTH !== 'undefined' ? NFT_LINK_MAX_LENGTH : 40;
		if (linkString.length > nftLinkMaxLength) {
			linkString = typeof formatAddressString === 'function' ? formatAddressString(linkString, nftLinkMaxLength) : linkString;
		}

		let urlHtml = '';
		let cidHtml = '';

		if (nftInfo.link.ipfsCid) {
			urlHtml = typeof formatIpfsCidHtmlString === 'function' ? formatIpfsCidHtmlString(nftInfo.link.url) : nftInfo.link.url;

			const ipfsHosts = typeof IPFS_PROVIDER_HOSTS !== 'undefined' ? IPFS_PROVIDER_HOSTS : ['https://nftstorage.link', 'https://gateway.pinata.cloud'];
			for (let i = 0; i < ipfsHosts.length; i++) {
				fullUrl = ipfsHosts[i] + '/ipfs/' + nftInfo.link.url;

				if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Image : 'Image')) {
					let urlToCheck = fullUrl;
					if (typeof checkLinkExists === 'function') {
						checkLinkExists(urlToCheck).then(exists => {
							if (exists) {
								TokenState.imageUrl = urlToCheck;
								if (!nftInfo.data.nsfw) {
									$('#nftPreviewImg').attr('src', TokenState.imageUrl);
									$('#nftImageFull').attr('src', TokenState.imageUrl);
								}
							}
						});
					}
				}

				if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Audio : 'Audio') && typeof isAudioPlayable === 'function' && isAudioPlayable(fullUrl)) {
					break;
				} else if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Video : 'Video') && typeof isVideoPlayable === 'function' && isVideoPlayable(fullUrl)) {
					break;
				} else {
					if (i == ipfsHosts.length - 1) {
						fullUrl = ipfsHosts[0] + '/ipfs/' + nftInfo.link.url;
					}
				}
			}

			cidHtml = `<p>CID 1: ${nftInfo.link.url}</p>`;
		} else {
			urlHtml = '<p><a  target="_new" href="' + fullUrl + '">' + linkString + '</a></p>';
			$('#ipfsCidHolder').remove();
		}

		if (nftInfo.additionalLinks && nftInfo.additionalLinks.length > 0) {
			let formattedLinksHtml = '<p>URL 1:</p>' + urlHtml;

			for (let i = 0; i < nftInfo.additionalLinks.length; i++) {
				let additionalLink = nftInfo.additionalLinks[i];
				let fullAdditionalUrlString = '';
				
				if (additionalLink.ipfsCid) {
					fullAdditionalUrlString = typeof formatIpfsCidHtmlString === 'function' ? formatIpfsCidHtmlString(additionalLink.url) : additionalLink.url;
					const ipfsHosts = typeof IPFS_PROVIDER_HOSTS !== 'undefined' ? IPFS_PROVIDER_HOSTS : ['https://nftstorage.link'];
					additionalFullUrl.push(ipfsHosts[0] + '/ipfs/' + additionalLink.url);
					cidHtml += `<p>CID ${i + 2}: ${additionalLink.url}</p>`;
				} else {
					let additionalLinkString = typeof formatAddressString === 'function' ? formatAddressString(additionalLink.url, nftLinkMaxLength) : additionalLink.url;
					fullAdditionalUrlString = '<a  target="_new" href="' + additionalLink.url + '">' + additionalLinkString + '</a>';
					additionalFullUrl.push(additionalLink.url);
				}

				formattedLinksHtml += '<br><p>URL ' + (i + 2) + ': </p>' + fullAdditionalUrlString;
			}

			$('#nftLink').html(formattedLinksHtml);
			$('#ipfsCid').html(cidHtml);
		} else {
			$('#nftLink').html(urlHtml);
			if (nftInfo.link.ipfsCid) {
				$('#ipfsCid').html(`<p>${nftInfo.link.url}</p>`);
			}
		}

		TokenState.imageUrl = fullUrl;
		if (nftInfo.cachedurl) {
			TokenState.imageUrl = nftInfo.cachedurl;
		}

		if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Image : 'Image')) {
			if (!nftInfo.data.nsfw) {
				$('#nftPreviewImg').attr('src', TokenState.imageUrl);
				$('#nftImageFull').attr('src', TokenState.imageUrl);
			} else {
				$('#nftPreviewImgNsfw').attr('src', 'https://thumbs.dreamstime.com/b/nsfw-sign-not-safe-work-censorship-vector-stock-illustration-nsfw-sign-not-safe-work-censorship-vector-stock-illustration-245733305.jpg');
				$('#nftPreviewImgNsfw').show();
			}

			$('#nftPreviewImg').show();

			if (nftInfo.link.url.substr(0, 19) == 'data:image/svg+xml;') {
				$('#nftPreviewImg').css('width', '200px');
				$('#nftImageFull').css('width', '400px');
			}
		} else if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Audio : 'Audio')) {
			$('#nftPreviewAudioSource').attr('src', fullUrl);
			$('#nftPreviewAudio').show();
			let audioElem = document.getElementById('nftAudio');
			if (audioElem) audioElem.load();

			$('#nftPreviewImgHolder').hide();
			$('#nftPreviewImgHolder').removeClass('col-lg-3');
			$('#nftInfoHolder').removeClass('col-lg-9');
			
			if (nftInfo.cachedurl) {
				$('#nftPreviewImg').attr('src', nftInfo.cachedurl);
				$('#nftImageFull').attr('src', nftInfo.cachedurl);
			} else if (additionalFullUrl.length > 0) {
				$('#nftPreviewImg').attr('src', additionalFullUrl[0]);
				$('#nftImageFull').attr('src', additionalFullUrl[0]);
			}
		} else if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Video : 'Video')) {
			$('#nftPreviewVideoSource').attr('src', fullUrl);
			$('#nftPreviewVideo').show();
			let videoElem = document.getElementById('nftPreviewVideo');
			if (videoElem) videoElem.load();

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

		if (typeof networkType !== 'undefined' && networkType == 'mainnet') {
			if (nftInfo.type == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.ArtCollection : 'Art collection')) {
				$('#nftAuction').html('<p>View on <a  target="_new" href="https://ergoauctions.org/collection/' + TokenState.tokenData.id + '">Ergoauctions.org</a></p>');
			} else {
				$('#nftAuction').html('<p>View on <a  target="_new" href="https://www.skyharbor.io/token/' + TokenState.tokenData.id + '">SkyHarbor.io</a></p><p>View on <a  target="_new" href="https://ergoauctions.org/artwork/' + TokenState.tokenData.id + '">Ergoauctions.org</a></p>');
			}
		} else {
			$('#marketplaceHolder').remove();
		}

		$('#nftHolder').show();
		TokenAnalyzer.reapplyNftInfoStriping();
	} else {
		$('#nftHolder').remove();
		$('#nftType').html('<p>Token</p>');
		
		// Mint address
		let mintAddress = TokenState.tokenData.address;
		if (TokenState.tokenData.mintWallet != null) {
			mintAddress = TokenState.tokenData.mintWallet;
		}

		$('#nftMintedAddress').html('<p><a href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(mintAddress) : '#') + '">' + mintAddress + '</a></p>');
		$('#nftMintedTransaction').html('<p><a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(TokenState.tokenData.transactionId) : '#') + '">' + TokenState.tokenData.transactionId + '</a></p>');
		$('#nftCreationHeight').html('<p><a href="' + (typeof getBlockUrl === 'function' ? getBlockUrl(TokenState.tokenData.blockId) : '#') + '">' + (typeof nFormatter === 'function' ? nFormatter(TokenState.tokenData.creationHeight, 0, true, true) : TokenState.tokenData.creationHeight) + '</a></p>');

		$('#tokenHolder').show();
	}

	// Fetch holders, transactions, and prices for ALL tokens (including NFTs)
	TokenApiClient.getPriceHistory().then(() => {
		TokenUIDisplay.printSupplyInfo();
		if (TokenState.hasPrice) {
			TokenUIControllers.printGainersLosers(0);
		}

		TokenApiClient.getTxsData().then(txs => {
			if (txs && txs.length > 0) TokenUIDisplay.printTxs(txs);
		}).catch(error => console.error('TXs error:', error));

		TokenApiClient.getSwapsData().then(swaps => {
			if (swaps && swaps.length > 0) TokenUIDisplay.printSwaps(swaps);
		}).catch(error => console.error('Swaps error:', error));

		TokenApiClient.getHolders().then(holders => {
			if (holders && holders.length > 0) TokenUIDisplay.printHolders(holders);
		}).catch(error => console.log('Error fetching holders:', error));

		TokenApiClient.getHolderCount().then(count => {
			if (count !== null && count !== undefined) TokenUIDisplay.printHolderCount(count);
		}).catch(error => console.log('Error fetching holder count:', error));
	});

	// Set external links
	TokenUIControllers.setLinks();

	// Fetch additional registers for NFT properties/social links
	const apiHost = typeof API_HOST !== 'undefined' ? API_HOST : 'https://api.ergoplatform.com/api/v1/';
	const baseUrl = apiHost.endsWith('/') ? apiHost : apiHost + '/';
	
	$.get(`${baseUrl}transactions/${TokenState.tokenData.transactionId}`, function (data) {
		if (!data || !data.inputs || data.inputs.length === 0) return;
		
		const hexString = data.inputs[0].additionalRegisters?.R6?.serializedValue;
		if (!hexString || typeof qfleetSDK === 'undefined') return;

		try {
			const Constant = qfleetSDK.SConstant;
			const bytes = typeof hexToBytes === 'function' ? hexToBytes(hexString) : [];
			const constant = Constant.from(bytes);

			if (TokenState.nftType == (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.ArtCollection : 'Art collection')) {
				if (constant && constant.data && constant.data.length > 0) {
					let hasTwitter = false;
					let hasInstagram = false;

					for (let array of constant.data) {
						if (typeof bytesToString !== 'function') break;
						let key = bytesToString(array[0]);
						let value = bytesToString(array[1]);
						
						if (key == 'instagram') {
							$('#instagramLink').prop('href', 'https://www.instagram.com/' + value.replace('@', ''));
							$('#instagramLink').html(value);
							$('#instagramHolder').show();
							hasInstagram = true;
						} else if (key == 'twitter') {
							$('#twitterLink').prop('href', 'https://twitter.com/' + value.replace('@', ''));
							$('#twitterLink').html(value);
							$('#twitterHolder').show();
							hasTwitter = true;
						}
					}

					if (!hasTwitter) $('#twitterHolder').remove();
					if (!hasInstagram) $('#instagramHolder').remove();
				}
			} else {
				let properties = '';
				let stats = '';
				let levels = '';
				
				if (constant && constant.data && (
					constant.data[0] || (constant.data[1] && (constant.data[1][0] || constant.data[1][1]))
				)) {
					// Properties
					try {
						if (constant.data[0] && constant.data[0].length > 0) {			    	
							for (let array of constant.data[0]) {
								if (typeof bytesToString !== 'function') break;
								properties += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box; place-content: space-between;text-align:center;">`
								properties += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								properties += `<p>${bytesToString(array[1])}</p>`;
								properties += '</div>';
							}
							$('#nftPropertiesHolder').show();
							$('#nftProperties').html(properties);
						}
					} catch (e) { $('#nftPropertiesHolder').hide(); }

					// Stats
					try {
						if (constant.data[1] && constant.data[1][0] && constant.data[1][0].length > 0) {			    	
							for (let array of constant.data[1][0]) {
								if (typeof bytesToString !== 'function') break;
								stats += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box; place-content: space-between;text-align:center;">`
								stats += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								stats += `<p>${array[1][0]} of ${array[1][1]}</p>`;
								stats += '</div>';
							}
							$('#nftStatsHolder').show();
							$('#nftStats').html(stats);
						}
					} catch (e) { $('#nftStatsHolder').hide(); }

					// Levels
					try {
						if (constant.data[1] && constant.data[1][1] && constant.data[1][1].length > 0) {			    	
							for (let array of constant.data[1][1]) {
								if (typeof bytesToString !== 'function') break;
								levels += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box; place-content: space-between;text-align:center;">`
								levels += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								levels += `<p>${array[1][0]} of ${array[1][1]}</p>`;
								levels += '</div>';
							}
							$('#nftLevelsHolder').show();
							$('#nftLevels').html(levels);
						}
					} catch (e) { $('#nftLevelsHolder').hide(); }
				}
			}
			TokenAnalyzer.reapplyNftInfoStriping();
		} catch (e) {
			console.error('Error deserializing R6:', e);
		}
	});
};


// Token icon loaded callback
window.onTokenIconLoaded = function() {
	$('#tokenDescriptionHolderRight').removeClass('col-xl-10 col-lg-9');
	$('#tokenDescriptionHolderRight').addClass('col-xl-8 col-lg-7');

	$('#tokenIcon').addClass('col-12');
	$('#tokenIcon').addClass('col-lg-2');
	$('#tokenIcon').addClass('d-flex');
	$('#tokenIcon').show();

	if (typeof hasIcon === 'function' && !hasIcon(TokenState.tokenId)) {
		if (typeof addIcon === 'function') {
			addIcon(TokenState.tokenId);
		}
	}
};

// NFT image loaded callback
window.onNftImageLoad = function() {
	if (TokenState.nftType != (typeof NFT_TYPE !== 'undefined' ? NFT_TYPE.Audio : 'Audio')) {
		return;
	}

	$('#nftPreviewImgHolder').show();
	$('#nftPreviewImg').show();
	$('#nftPreviewImgHolder').removeClass('col-lg-3');
	$('#nftInfoHolder').removeClass('col-lg-9');

	$('#nftPreviewImgHolder').addClass('col-lg-4');
	$('#nftInfoHolder').addClass('col-lg-8');
};

// Helper function to check if audio is playable
function isAudioPlayable(audioUrl) {
	const audio = new Audio();
	const mimeType = getMimeType(audioUrl);

	let a = audioUrl;
	audio.addEventListener("canplaythrough", (event) => {
		// If the main audio element doesn't have a source yet, or is using flaky nftstorage
		// and we've found a better working gateway, switch to it.
		const currentSrc = $('#nftAudio').attr('src') || $('#nftPreviewAudioSource').attr('src') || '';
		if ((!currentSrc || currentSrc.includes('nftstorage')) && !a.includes('nftstorage')) {
			console.log('[Audio] Switching to better gateway:', a);
			$('#nftAudio').attr('src', a);
			$('#nftPreviewAudioSource').attr('src', a);
			let audioElem = document.getElementById('nftAudio');
			if (audioElem) audioElem.load();
		}
	});

	audio.src = audioUrl;

	// Always return false to ensure the loop in onGetNftInfoDone continues to check all gateways
	return false;
}

// Helper function to check if video is playable
function isVideoPlayable(videoUrl) {
	const video = document.createElement('video');
	const mimeType = getMimeType(videoUrl);

	let v = videoUrl;
	video.addEventListener("canplaythrough", (event) => {
		const currentSrc = $('#nftPreviewVideo').attr('src') || $('#nftPreviewVideoSource').attr('src') || '';
		if ((!currentSrc || currentSrc.includes('nftstorage')) && !v.includes('nftstorage')) {
			console.log('[Video] Switching to better gateway:', v);
			$('#nftPreviewVideo').attr('src', v);
			$('#nftPreviewVideoSource').attr('src', v);
			let videoElem = document.getElementById('nftPreviewVideo');
			if (videoElem) videoElem.load();
		}
	});

	video.src = videoUrl;
	return false;
}

// Helper function to get the MIME type based on the file extension
function getMimeType(url) {
	if (!url) return '';
	if (url.includes('/ipfs/') && !url.includes('.')) return 'audio/mpeg';
	const extension = url.split('.').pop().toLowerCase();
	switch (extension) {
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		case 'ogg':
			return 'audio/ogg';
		case 'aac':
			return 'audio/aac';
		case 'mp4':
			return 'video/mp4';
		case 'webm':
			return 'video/webm';
		case 'ogv':
			return 'video/ogg';
		default:
			return '';
	}
}

// Expose UI controllers to window for HTML onclick handlers
window.copyTokenAddress = (e) => TokenUIControllers.copyTokenAddress(e);
window.showFullImgPreview = () => TokenUIControllers.showFullImgPreview();
window.hideFullImgPreview = () => TokenUIControllers.hideFullImgPreview();
window.showImage = () => TokenUIControllers.showImage();
window.toggleChart = () => TokenUIControllers.toggleChart();
window.printGainersLosers24h = () => TokenUIControllers.printGainersLosers24h();
window.printGainersLosers7d = () => TokenUIControllers.printGainersLosers7d();
window.printGainersLosers30d = () => TokenUIControllers.printGainersLosers30d();
window.calculateTransferredAmount = (tx) => TokenAnalyzer.calculateTransferredAmount(tx);
