var tokenData = undefined;
var tokenId = '';
var nftType = undefined;
var decimals = 0;
var nowTime = Date.now();
var from24h = nowTime - (24 * 60 * 60 * 1000);
var from7d = nowTime - (7 * 24 * 60 * 60 * 1000);
var from30d = nowTime - (30 * 24 * 60 * 60 * 1000);
var priceData = undefined;
var chart = undefined;
var chartType = undefined;
var tempDate = -1;

$(function() {
	tokenId = getWalletAddressFromUrl();

	getNftInfo(tokenId, onGetNftInfoDone);
	getPrices(getPriceHistory);	
	setErgLogoImageColor('loadingImgHolders', 150);

	setDocumentTitle(tokenId);
});

function getPriceHistory() {
	$.post(ERGEXPLORER_API_HOST + 'tokens/getPriceHistory',
		{from: from30d, ids : [tokenId]},
		function(data) {
		if (data.items.length == 0) {
			return;
		}

		priceData = data;
		printGainersLosers(from24h);
	});
}

function getHolders() {
	let timeout = setTimeout(getHoldersFallback, 2000);

	$.ajax({
		url: 'https://api.ergo.watch/lists/addresses/by/balance?token_id=' + tokenId + '&limit=10',
		success: function(data) {	
			if (timeout) {
				clearTimeout(timeout);
			}

			printHolders(data);
		}
	});
}

function getHoldersFallback() {
	$.get(ERGEXPLORER_API_HOST + 'tokens/getHolders?id=' + tokenId,
		function(data) {
			printHolders(data.items);
		}
	);
}

function printHolders(data) {
	let formattedResult = '';

	for (let i = 0; i < data.length; i++) {
		formattedResult += '<tr>';

		//Address
		addAddress(data[i].address);
		formattedResult += '<td><span class="d-lg-none"><strong>Address: </strong></span><a class="address-string" addr="' + data[i].address + '" href="' + getWalletAddressUrl(data[i].address) + '">' + formatAddressString(data[i].address, 10) + '</a></td>';

		//Balance
		formattedResult += '<td class=""><span class="d-lg-none"><strong>Balance: </strong></span>' + formatAssetValueString(data[i].balance, decimals) + ' ' + getAssetTitleParams(tokenData.id, tokenData.name, false) + ' <span class="text-light">' + formatDollarPriceString(data[i].balance / Math.pow(10, tokenData.decimals) * prices[tokenData.id]) + '</span></td>';

		//Percent
		let percent = formatValue(data[i].balance * 100 / tokenData.emissionAmount, 2);
		formattedResult += '<td><span class="d-lg-none"><strong>Percent: </strong></span>' + percent + '%</td>';

		formattedResult += '</tr>';
	}

	$('#holdersTableBody').html(formattedResult);
	$('#holdersLoading').hide();
	$('#holdersTable').show();

    getAddressesInfo();
}

function onGetNftInfoDone(nftInfo, message) {
	$('#txLoading').hide();

	if (nftInfo == null) {
    	showLoadError('No results matching your query.');
    	return;
	}

	tokenData = nftInfo.data;

	//Id
	$('#tokenHeader').html('<p><a href="Copy to clipboard!" onclick="copyTokenAddress(event)">' + tokenData.id + ' &#128203;</a></p>');

	//Name
	$('#tokenName').html('<p>' + tokenData.name + '</p>');

	//Emission amount
	decimals = tokenData.decimals;
	let emissionAmount = getAssetValue(tokenData.emissionAmount, tokenData.decimals);
	$('#tokenEmissionAmount').html('<p>' + formatValue(emissionAmount) + '</p>');

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
	let tImg = getIcon(tokenData.id);
	if (tImg == undefined) {
		tImg = 'https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/' + tokenData.id + '.svg';
	}
	$('#tokenIconImg').attr('src', tImg);

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

		addAddress(mintAddress);
		$('#nftMintedAddress').html('<p><a class="address-string" addr="' + mintAddress + '" href="' + getWalletAddressUrl(mintAddress) + '">' + mintAddress + '</a></p>');

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

	getHolders();
}

function getCurrentAddress() {
	var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId, function(data) {
		if (data.total == 0) {
			return;
		}

		let txOFfset = data.total - 1;

		var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId + '?offset=' + txOFfset, function(data) {
			let currentAddress = data.items[0].address;

			addAddress(currentAddress);
			$('#nftCurrentAddress').html('<p><a class="address-string" addr="' + currentAddress + '" href="' + getWalletAddressUrl(currentAddress) + '">' + currentAddress + '</a></p>');
			$('#nftCurrentAddressHolder').show();

			getAddressesInfo();
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

function printGainersLosers30d() {
	printGainersLosers(from30d);
	$('#showGainersLosers30d').removeClass('btn-primary');
	$('#showGainersLosers30d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
}

function printGainersLosers7d() {
	printGainersLosers(from7d);
	$('#showGainersLosers7d').removeClass('btn-primary');
	$('#showGainersLosers7d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers24h() {
	printGainersLosers(from24h);
	$('#showGainersLosers24h').removeClass('btn-primary');
	$('#showGainersLosers24h').addClass('btn-info');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers(timeframe) {
	let data = JSON.parse(JSON.stringify(priceData));
	chartType = timeframe;

	let from7dset = false;
	let from30dset = false;
	for (var i = data.items.length - 1; i >= 0; i--) {
		let item = data.items[i];

		let oldPrice = item.price;
		let newPrice = prices[item.tokenid];
		let difference = (newPrice * 100 / oldPrice) - 100;
		difference = toFixed(difference, 2);

		let classString = 'text-success';
		if (difference > 0) {
			difference = '+' + difference;
		} else {
			difference = difference;
			classString = 'text-danger';
		}

		if (from30dset == false && from30d <= item.timestamp && item.tokenid == tokenId) {
			$('#usdChange30d').html(difference + '%');
			$('#usdChange30d').addClass(classString);

			from30dset = true;
		} else if (from7dset == false && from7d <= item.timestamp && item.tokenid == tokenId) {
			$('#usdChange7d').html(difference + '%');
			$('#usdChange7d').addClass(classString);

			from7dset = true;
		} else if (from7dset == true && from24h <= item.timestamp && item.tokenid == tokenId) {
			$('#usdChange24h').html(difference + '%');
			$('#usdChange24h').addClass(classString);
		}
	}

	 $('#usdPrice').html('$' + formatValue(prices[tokenId], 2, true));

	 for (var i = data.items.length - 1; i >= 0; i--) {
		if (timeframe > data.items[i].timestamp) {
			data.items.splice(i, 1);
			continue;
		}
	}

	let tI = 0;
	let lastTimestamp = -1;
	let step = 1;
	let lastStep;
	let diff = 0;
	let diffI = 0;
	if (data.items.length > 25) {
		step = parseInt(data.items.length / 25);
	}
	data.items = data.items.filter(function (_, index) {
		let item = data.items[index];
		if (index == 0) {
			lastStep = item.value;
			diff = 0;

			return true;
		}

		if (index == data.items.length - 1) {
			return true;
		}

		let temp = Math.abs(lastStep - item.value);
		if (temp > diff) {
			diff = temp;
			diffI = index;
		}

		if (index % step === 0) {
			data.items[index].value = data.items[diffI].value;

			lastStep = item.value;
			diff = 0;

			return true;
		}

		return false;
	});

	/*
	for (var i = data.items.length - 1; i >= 0; i--) {
		let item = data.items[i];

		if (timeframe == from7d
			&& i != data.items.length - 1
			&& i != 0
			&& tI % 6 != 0) {
			data.items.splice(i, 1);	
		}

		if (timeframe == from30d
			&& i != data.items.length - 1
			&& i != 0
			&& tI % 13 != 0) {
			data.items.splice(i, 1);	
		}

		if (lastTimestamp != data.items[i].timestamp) {
			lastTimestamp = data.items[i].timestamp;
			tI = 0;
		}

		tI++;
	}
	*/

	 //Chart
	data.items = data.items.reverse();
	data.items.push({
		'price': prices[tokenId],
		'timestamp': Date.now()
	})

	if (chart != undefined) {
		chart.destroy();
	}

	const rootStyles = getComputedStyle(document.documentElement);

	// Get the value of the global CSS variable
	const primaryColor = rootStyles.getPropertyValue('--main-color').trim();

	chart = new Chart(
	    document.getElementById('chart'),
	    {
	      type: 'line',
	      options: {
	      	responsive: true,
	        animation: {
	        	duration: 1000
	        },
	        fill: false,
	        borderColor: primaryColor,
	        plugins: {
	          legend: {
	            display: false
	          },
	          tooltip: {
	            enabled: true,
	            displayColors: false,
	            callbacks: {
	            	label: function (tooltip) {
	            		let formattedValue = '$' + nFormatter(tooltip.parsed.y, getAutoDigits(tooltip.parsed.y));

	            		return formattedValue;
	            	}
	            }
	          }
	        }
	      },
	      data: {
	        labels: data.items.map(mapLabel),
	        datasets: [
	          {
	            label: '$',
	            data: data.items.map(row => row.price)
	          }
	        ]
	      }
	    }
	  );

	$('#priceInfo').show();
}

function mapLabel(row, index) {
	if (chartType == from24h) {
		return formatTimeString(parseInt(row.timestamp), false);
	} else {
		let dateString = new Date(parseInt(row.timestamp)).toLocaleDateString();

		if (dateString != tempDate) {
			tempDate = dateString;
			return dateString;
		} else {
			return '';
		}
	}
}