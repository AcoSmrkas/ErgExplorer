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
		if (typeof getCurrentAddress === 'function') {
			getCurrentAddress();
		}
	} else {
		$('#nftCurrentAddressHolder').remove();
	}

	// Display decimals
	$('#tokenDecimals').html('<p>' + TokenState.tokenData.decimals + '</p>');

	// Display type
	$('#tokenType').html('<p>' + TokenState.tokenData.type + '</p>');

	// Check if token is burned
	let isBurned = TokenState.tokenData.isBurned == 't';
	if (isBurned) {
		$('#tokenBurned').show();
		$('#nftCurrentAddressHolder').remove();
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

		// Process NFT links and display appropriate media
		if (typeof processNftLinks === 'function') {
			processNftLinks(nftInfo);
		}

		$('#nftHolder').show();
	} else {
		// Regular token - first get price history, then fetch other data
		TokenApiClient.getPriceHistory().then(() => {
			// Display supply info after price history loaded
			TokenUIDisplay.printSupplyInfo();

			// Fetch and display transactions
			TokenApiClient.getTxsData().then(txs => {
				if (txs && txs.length > 0) {
					TokenUIDisplay.printTxs(txs);
				}
			}).catch(error => console.error('TXs error:', error));

			// Fetch and display swaps
			TokenApiClient.getSwapsData().then(swaps => {
				if (swaps && swaps.length > 0) {
					TokenUIDisplay.printSwaps(swaps);
				}
			}).catch(error => console.error('Swaps error:', error));

			// Fetch and display holders
			TokenApiClient.getHolders().then(holders => {
				if (holders && holders.length > 0) {
					TokenUIDisplay.printHolders(holders);
				}
			}).catch(error => {
				console.log('Error fetching holders:', error);
			});

			// Fetch and display holder count
			TokenApiClient.getHolderCount().then(count => {
				if (count !== null && count !== undefined) {
					TokenUIDisplay.printHolderCount(count);
				}
			}).catch(error => {
				console.log('Error fetching holder count:', error);
			});

			// Chart will be displayed when prices are loaded via getPrices callback in api-client.js
		});
	}
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
