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
var hasPrice = false;
var amountsData = undefined;
var imageUrl = null;
var currentAddress = '';
var tempDateIndex = 0;
var chartUsd = true;

$(function() {
	tokenId = getWalletAddressFromUrl();

	getNftInfo(tokenId, onGetNftInfoDone);
	getCruxData();
	checkAddressbook();

	setDocumentTitle(tokenId);
});

function getCruxData() {
	$.get('https://api.cruxfinance.io/crux/token_info/' + tokenId,
		function (data) {

		amountsData = data;

		getPrices(getPriceHistory, true);
	});
}

function getSwapsData() {
	$.get('https://api.mewfinance.com/dex/getSwapsByTokenId?tokenId=' + tokenId,
		function (data) {
			printSwaps(data.items);
		});
}

function printSwaps(data) {
	if (data.length > 0) {
		$('#swapsHolder').show();
		$('#swapsLoading').hide();

		let html = '';

		for (let i = 0; i < data.length; i++) {
			let item = data[i];

			if (item.buyasset == tokenId) {
				item.type = 'Buy';
				item.amount = item.buyamount;
			} else {
				item.type = 'Sell';
				item.amount = item.sellamount
			}
			
			html += '<tr>';
			html += '<td><a class="address-string" addr="' + item.address + '" href="' + getWalletAddressUrl(item.address) + '">' + formatAddressString(item.address, 4) + '</a></td>';
			html += '<td><span class="' + (item.type == 'Sell' ? 'text-danger' : 'text-success') + '">' + item.type + '</span></td>';
			html += '<td>'
				+ '<span class="text-white">'
					+ formatAssetValueString(item.amount * Math.pow(10, tokenData.decimals), tokenData.decimals, 4)
					+ ' '
					+ getAssetTitleParams(tokenData, tokenData.id, tokenData.name, false)
					+ ' '
					+ '<span class="text-light">'
						+ formatAssetDollarPriceString(item.amount * Math.pow(10, tokenData.decimals), tokenData.decimals, tokenId)
					+ '</span>'
				+ '</span>'
			+ '</td>';
			html += '<td>' + item.dexname + '</td>';
			html += '<td><a class="" href="' + getTransactionsUrl(item.txid) + '">' + formatAddressString(item.txid, 4) + '</a></td>';
			html += '<td>' + item.timestamp.substr(0, item.timestamp.indexOf('.')) + '</td>';
			html += '</tr>';
		}

		$('#swapsTableBody').html(html);

		$('#swapsTable').show();
	}
}

function checkAddressbook() {
	$.get(ERGEXPLORER_API_HOST + 'addressbook/getTokenAddresses?tokenId=' + tokenId,
	function (data) {
		if (data.total > 0) {
			let formattedData = '';

			for (var i = 0; i < data.items.length; i++) {
				let addressData = data.items[i];
				formattedData += printAddressbookAddress(addressData, i == 0, i == data.items.length - 1);
			}

			$('#addressbookInfoHolder').html(formattedData);

			$('#addressbookInfo').show();

			if (data.items[0].url != '') {
				$('#addressbookUrl').html('<strong class="">URL:</strong> <a target="_new" href="' + data.items[0].url + '">' + data.items[0].url + '</a>');
				$('#addressbookUrl').show();
			}
		}
	});
}

function printAddressbookAddress(item, first, last) {
	let classString = '';

	if (first && last) {
		classString = ' border-no-flat';
	} else if (first && !last) {
		classString = ' border-bottom-flat';
	} else if (!first && last) {
		classString = ' border-top-flat';
	}

    return '<div class="' + classString + '"><div class="p-2' + classString + '"><p><a href="' + getWalletAddressUrl(item.address) + '">' + formatAddressString(item.address, 35) + '</a>' + (item.urltype == '' ? '' : ' <span class="text-light">(' + item.urltype + ')</span>') + '</p></div></div>';
}

function setLinks() {
	if (tokenData.isMeme == 't') {
		$('#spectrumLink').attr('href', 'https://dex.crooks-fi.com/ergo/swap?base=0000000000000000000000000000000000000000000000000000000000000000&quote=' + tokenId);
		$('#spectrumLink').html('Crooks Finance <i class="erg-span fa-solid fa-up-right-from-square"></i>');
	} else {
		$('#spectrumLink').attr('href', 'https://dex.mewfinance.com/ergo/swap?base=0000000000000000000000000000000000000000000000000000000000000000&quote=' + tokenId);
	}
	$('#cruxLink').attr('href', 'https://cruxfinance.io/tokens/' + tokenId);
}

function getPriceHistory() {
	$.post(ERGEXPLORER_API_HOST + 'tokens/getPriceHistoryNew',
		{from: from30d, ids : [tokenData.name]},
		function(data) {

		getHolders();
		getHolderCount();
		getSwapsData();

		if (data.length == 0
			|| data[0].length == 0
		) {
			$('#priceLoading').hide();
			return;
		}

		priceData = data;
		printGainersLosers(0);
		hasPrice = true;
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

function getHolderCount() {
	let timeout = setTimeout(getHolderCountFallback, 2000);

	$.ajax({
		url: 'https://api.ergo.watch/p2pk/count?token_id=' + tokenId,
		success: function(data) {
			if (timeout) {
				clearTimeout(timeout);
			}

			printHolderCount(data);
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

function getHolderCountFallback() {
	$.get(ERGEXPLORER_API_HOST + 'tokens/getHolderCount?id=' + tokenId,
		function(data) {

		});
}

function printHolders(data) {
	let formattedResult = '';

	for (let i = 0; i < data.length; i++) {
		formattedResult += '<tr>';

		//Address
		addAddress(data[i].address);
		formattedResult += '<td>#' + (i+1) + ' <a class="address-string" addr="' + data[i].address + '" href="' + getWalletAddressUrl(data[i].address) + '">' + formatAddressString(data[i].address, 4) + '</a></td>';

		//Balance
		let dollarPrice = '';
		if (hasPrice) {
			dollarPrice = formatDollarPriceString(data[i].balance / Math.pow(10, tokenData.decimals) * prices[tokenData.id])
		}

		let percent = formatValue(data[i].balance * 100 / ((amountsData.liquid_supply + amountsData.locked_supply) * Math.pow(10, tokenData.decimals)), 2);
		formattedResult += '<td class="">' + formatAssetValueString(data[i].balance, decimals) + ' ' + getAssetTitleParams(tokenData, tokenData.id, tokenData.name, false) + ' <span class="text-light">' + dollarPrice + '</span><span style="text-align:right;float:right;" class="d-inline d-lg-none text-white"> ' + percent + '%</span></td>';

		//Percent
		formattedResult += '<td class="d-none d-lg-table-cell" style="text-align:right;">' + percent + '%</td>';

		formattedResult += '</tr>';
	}

	$('#holdersTableBody').html(formattedResult);
	$('#holdersLoading').hide();
	$('#holdersTable').show();

    getAddressesInfo();
	
    if (!hasPrice) {
    	$('#financeHeader').hide();
    	$('#chartColumn').hide();
    	$('#holdersColumn').removeClass('col-xl-6');
    }
}

function printHolderCount(data) {
	$('#totalHolderCount').html(`(of total ${nFormatter(data)})`);

	if (data == 0) {
		$('#priceInfo').hide();
	} else {
		$('#priceInfo').show();
	}

	$('#priceLoading').hide();
}

function onGetNftInfoDone(nftInfo, message) {
	$('#txLoading').hide();

	if (nftInfo == null) {
    	showLoadError('No results matching your query.');
    	return;
	}

	tokenData = nftInfo.data;
	
	if (tokenData.scam) {
		$('#tokenScamHolder').show();
	}

	if (tokenData.royaltypercent && tokenData.royaltypercent > 0) {
		$('#royaltyHolder').show();
		$('#nftRoyalty').html(tokenData.royaltypercent + "%");
	} else {
		$('#royaltyHolder').remove();
	}

	//Id
	$('#tokenHeader').html('<p><a href="Copy to clipboard!" onclick="copyTokenAddress(event)">' + tokenData.id + ' &#128203;</a></p>');

	//Name
	$('#tokenName').html('<p>' + tokenData.name + '</p>');

	//Emission amount
	decimals = tokenData.decimals;
	let emissionAmount = getAssetValue(tokenData.emissionAmount, tokenData.decimals);
	$('#tokenEmissionAmount').html('<p>' + nFormatter(emissionAmount, 0, true) + '</p>');

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

	$('#tokenDescription').html('<pre style="max-height:200px;overflow-y:auto;" class="tokenDescriptionPre' + (asciiArt ? ' pre-ascii' : '') + '">' + formatNftDescription(tokenData.description) + '</pre>');

	//Icon
	let tImg = getIcon(tokenData.id);
	if (tImg == undefined) {
		tImg = 'https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/' + tokenData.id + '.svg';
	}

	if (tokenData.name == 'Crooks Finance Stake Key') {
		tImg = 'https://crooks-fi.com/images/logo.png';
	}

	if (tokenData.iconurl) {
		tImg = tokenData.iconurl;
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
			$('#nftHashHolder').remove();
		}

		//Mint address
		let mintAddress = tokenData.address;
		if (tokenData.mintWallet != null) {
			mintAddress = tokenData.mintWallet;
		}

		addAddress(mintAddress);
		$('#nftMintedAddress').html('<p><a class="address-string" addr="' + mintAddress + '" href="' + getWalletAddressUrl(mintAddress) + '">' + formatLongAddressString(mintAddress) + '</a></p>');

		$('#nftMintedTransaction').html('<p><a href="' + getTransactionsUrl(tokenData.transactionId) + '">' + tokenData.transactionId + '</a></p>');
		$('#nftCreationHeight').html('<p><a href="' + getBlockUrl(tokenData.blockId) + '">' + nFormatter(tokenData.creationHeight, 0, true, true) + '</a></p>');

		let fullUrl = '';
		if (!nftInfo.link.ipfsCid) {
			fullUrl = nftInfo.link.url;
		}
		let additionalFullUrl = Array();

		let linkString = fullUrl;
		if (linkString.length > NFT_LINK_MAX_LENGTH) {
			linkString = formatAddressString(linkString, NFT_LINK_MAX_LENGTH);
		}

		let urlHtml = '';
		let cidHtml = '';

		if (nftInfo.link.ipfsCid) {
			urlHtml = formatIpfsCidHtmlString(nftInfo.link.url);

			for (let i = 0; i < IPFS_PROVIDER_HOSTS.length; i++) {
				fullUrl = IPFS_PROVIDER_HOSTS[i] + '/ipfs/' + nftInfo.link.url;

				if (nftInfo.type == NFT_TYPE.Image) {
					let urlToCheck = fullUrl;
					checkLinkExists(urlToCheck).then(exists => {
						if (exists) {
							imageUrl = urlToCheck;
							if (!nftInfo.data.nsfw) {
								$('#nftPreviewImg').attr('src', imageUrl);
								$('#nftImageFull').attr('src', imageUrl);
							}
						}
					});
				}

				if (nftInfo.type == NFT_TYPE.Audio && isAudioPlayable(fullUrl)) {
					break;
				} else {
					if (i == IPFS_PROVIDER_HOSTS.length - 1) {
						fullUrl = IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nftInfo.link.url;
					}
				}
			}

			cidHtml = `<p>CID 1: ${nftInfo.link.url}</p>`;
		} else {
			urlHtml = '<p><a  target="_new" href="' + fullUrl + '">' + linkString + '</a></p>';
			$('#ipfsCidHolder').remove();
		}

		if (nftInfo.additionalLinks.length > 0) {
			let formattedLinksHtml = '<p>URL 1:</p>' + urlHtml;

			for (let i = 0; i < nftInfo.additionalLinks.length; i++) {
				let additionalLink = nftInfo.additionalLinks[i];

				let fullAdditionalUrlString = '';
				if (additionalLink.ipfsCid) {
					fullAdditionalUrlString = formatIpfsCidHtmlString(additionalLink.url);
					additionalFullUrl.push(IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + additionalLink.url);
					cidHtml += `<p>CID ${i + 2}: ${additionalLink.url}</p>`
				} else {
					let additionalLinkString = formatAddressString(additionalLink.url, NFT_LINK_MAX_LENGTH);
					fullAdditionalUrlString = '<a  target="_new" href="' + additionalLink.url + '">' + additionalLinkString + '</a>';
					additionalFullUrl.push(additionalLink.url);
				}

				formattedLinksHtml += '<br><p>URL ' + (i + 2) + ': </p>' + fullAdditionalUrlString;

			}

			for (let i = 0; i < IPFS_PROVIDER_HOSTS.length; i++) {
				fullUrl = IPFS_PROVIDER_HOSTS[i] + '/ipfs/' + nftInfo.link.url;

				if (isAudioPlayable(fullUrl)) {
					break;
				} else {	
					if (i == IPFS_PROVIDER_HOSTS.length - 1) {
						fullUrl = IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nftInfo.link.url;
					}
				}
			}

			$('#nftLink').html(formattedLinksHtml);
			$('#ipfsCid').html(cidHtml);
		} else {
			$('#nftLink').html(urlHtml);

			if (nftInfo.link.ipfsCid) {
				$('#ipfsCid').html(`<p>${nftInfo.link.url}</p>`);
			}
		}

		imageUrl = fullUrl;
		if (nftInfo.cachedurl) {
			imageUrl = nftInfo.cachedurl;
		}

		if (nftInfo.type == NFT_TYPE.Image) {
			if (!nftInfo.data.nsfw) {
				$('#nftPreviewImg').attr('src', imageUrl);
				$('#nftImageFull').attr('src', imageUrl);
			} else {
				$('#nftPreviewImgNsfw').attr('src', 'https://thumbs.dreamstime.com/b/nsfw-sign-not-safe-work-censorship-vector-stock-illustration-nsfw-sign-not-safe-work-censorship-vector-stock-illustration-245733305.jpg');
				$('#nftPreviewImgNsfw').show();
			}

			$('#nftPreviewImg').show();

			if (nftInfo.link.url.substr(0, 19) == 'data:image/svg+xml;') {
				$('#nftPreviewImg').css('width', '200px');
				$('#nftImageFull').css('width', '400px');
			}
		} else if (nftInfo.type == NFT_TYPE.Audio) {
			$('#nftPreviewAudioSource').attr('src', fullUrl);
			$('#nftPreviewAudio').show();
			document.getElementById('nftAudio').load();

			$('#nftPreviewImgHolder').hide();
			$('#nftPreviewImgHolder').removeClass('col-lg-3');
			$('#nftInfoHolder').removeClass('col-lg-9');

			if (nftInfo.additionalLinks.length > 0) {
				$('#nftPreviewImg').attr('src', additionalFullUrl[0]);
				$('#nftImageFull').attr('src', additionalFullUrl[0]);
			}
		} else if (nftInfo.type == NFT_TYPE.Video) {
			$('#nftPreviewVideoSource').attr('src', fullUrl);
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
			if (nftInfo.type == NFT_TYPE.ArtCollection) {
				$('#nftAuction').html('<p>View on <a  target="_new" href="https://ergoauctions.org/collection/' + tokenData.id + '">Ergoauctions.org</a></p>');
			} else {
				$('#nftAuction').html('<p>View on <a  target="_new" href="https://www.skyharbor.io/token/' + tokenData.id + '">SkyHarbor.io</a></p><p>View on <a  target="_new" href="https://ergoauctions.org/artwork/' + tokenData.id + '">Ergoauctions.org</a></p>');
			}
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
		$('#nftCreationHeight').html('<p><a href="' + getBlockUrl(tokenData.blockId) + '">' + nFormatter(tokenData.creationHeight, 0, true, true) + '</a></p>');

		$('#tokenHolder').show();
	}

	setLinks();

	$.get(`${API_HOST}transactions/${tokenData.transactionId}`,
	function (data) {
		const Constant = qfleetSDK.SConstant;

		function deserializeHex(hex) {
		    const bytes = hexToBytes(hex);
		    const constant = Constant.from(bytes);

			if (nftInfo.type == NFT_TYPE.ArtCollection) {
				if (constant && constant.data && constant.data.length > 0) {
					let hasTwitter = false;
					let hasInstagram = false;

					for (let array of constant.data) {
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
					
					try {
						if (constant.data[0] && constant.data[0].length > 0) {			    	
							for (let array of constant.data[0]) {
								properties += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box;
		place-content: space-between;text-align:center;">`
								properties += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								properties += `<p>${bytesToString(array[1])}</p>`;
								properties += '</div>';
							}

							$('#nftPropertiesHolder').show();
							$('#nftProperties').html(properties);
						}
					} catch {
						$('#nftPropertiesHolder').hide();
					}

					try {
						if (constant.data[1] && constant.data[1][0] && constant.data[1][0].length > 0) {			    	
							for (let array of constant.data[1][0]) {
								stats += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box;
		place-content: space-between;text-align:center;">`
								stats += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								stats += `<p>${array[1][0]} of ${array[1][1]}</p>`;
								stats += '</div>';
							}

							$('#nftStatsHolder').show();
							$('#nftStats').html(stats);
						}
					} catch {
						$('#nftStatsHolder').hide();
					}

					try {
						if (constant.data[0] && constant.data[1][1] && constant.data[1][1].length > 0) {			    	
							for (let array of constant.data[1][1]) {
								levels += `<div class="bg-background" style="padding:5px; border-radius:5px;box-sizing: border-box;
		place-content: space-between;text-align:center;">`
								levels += `<p class="erg-span">${bytesToString(array[0])}</p>`;
								levels += `<p>${array[1][0]} of ${array[1][1]}</p>`;
								levels += '</div>';
							}

							$('#nftLevelsHolder').show();
							$('#nftLevels').html(levels);
						}
					}
					catch {
						$('#nftLevelsHolder').hide();
					}
				}
			}
		}

		const hexString = data.inputs[0].additionalRegisters?.R6?.serializedValue;

		if (hexString) deserializeHex(hexString);
	});
}

function getCurrentAddress() {
	var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId, function(data) {
		if (data.total == 0) {
			return;
		}

		let txOFfset = data.total - 1;

		var jqxhr = $.get(API_HOST + 'boxes/byTokenId/' + tokenId + '?offset=' + txOFfset, function(data) {
			currentAddress = data.items[0].address;

			addAddress(currentAddress);
			$('#nftCurrentAddress').html('<p><a class="address-string" addr="' + currentAddress + '" href="' + getWalletAddressUrl(currentAddress) + '">' + formatLongAddressString(currentAddress) + '</a></p>');
			$('#nftCurrentAddressHolder').show();

			if (currentAddress == '2sTiXsgg5x6T8pMqxruCsfKtQh5JcN9TgBWpT6PLkNUg6Gvkg923sXUbwm9iv4Yi2yH6f2e9a6HzY2WF3ScSBVKmCE1WJBvpRLugRY7xxDvYmkdPA1XV1rvhSQTPMoU6fwBuGxuzdjjmWGYyt3jqLJhEHh59X4vpd5GpeEyjvhTxiTc2a1UTpzaeasyLQmYdhGuLFeSvxGgxWMD8mer1aoEq1AiBwkBdSo2DCKo81UPrXFn934cNTpPcUGoG4cTwdhMX7z1N3VyZ74dBbWPDsN6V6oBVaaUW9ggWRwttmTAGQywEobFwgDswEu8XZSRDUXg77ivAywy9DfrjkbutRjNCgh1fExtKG8QWEHkPcALwLaKT7QsKJcEVmC3rGBQSeTHEozx9FPniM47847yxk4A9wG5MaUoFbwiBbFEusWaTsNN9jEP7M8Uw5RFkeyQhooEG1A32R59pgoouXiUc974VXeaP8J1rSey3FD5VjsQc6tFhEdcAN5ULSaWXrHxoHEaHJHZyPQmejzX7hdy'
				||
				currentAddress == '2DnYaspUNUtsGfFELT8Bhvn1pGGE3nuHxyzxdDML4P31NgVPYZYwG2tsXJLsAWEvZRcKyBYXc6kUuoUpYVPHRpMQen36R2hFx4pBF6DmbeKWbXExsbXxyNaiQre58GUfwB2qktmaHETbgSSX64H2zFvCpPnLD8nPWAivN9zidxuWJyu1o8MxLf88bzJRBj8P3x75Qrd65KbfcWvFF9trYu6CyFc8M81DZ9GbPJVTNjvC9gdaRvkFBEWL8fM4xFTjZru3UT7NkbPy27RJwxgMNun7NQw3bhz3L5AGre4RXo8Ur4m3fJZjXK3GLUAGcTmV4VvjwFTzrDfb2bShgGYjEANjM7Fx9b3CbQHdJWwfq88hUXeqcoDJ9fT97zRJCxLCTYTuA9CDVaENsGGiRWQHykDwcdPZRSEWL5tJUr5knHxejdkQqE6unn3pZnHdwWWXqUqMuYKpfaeSS4za8MYUx1AK927ouM4yxUewQPJpbeTt8YQKDdeRNRwahqbQjziLYfRc3A1e4fqAgtWSsWcwn4sNVAXTm3EE7wJgA14yezRiEdpdkiam3mFjYR6xne1GtcSfssF'
				||
				currentAddress == '2DnYaspUNUtsGfFELT8Bhvn1pGGE3nuHxyzxdDML4P31NgVPYZYwG2tsXJLsAWEvZRcKyBYXc6kUuoUpYVPHRpMQen36R2hFx4pBF6DmbeKWbXExsbXxyNaiQre58GUfwB2qktmaHETbgSSX64H2zFvCpPnLD8nPWAivN9zidxuWJyu1o8MxLf88bzJRBj8P3x75Qrd65KbfcWvFF9trYu6CyFc8M81DZ9GbPJVTNjvC9gdaRvkFBEWL8fM4xFTjZru3UT7NkbPy27RJwxgMNun7NQw3bhz3L5AGre4RXo8Ur4m3fJZjXK3GLUAGcTmV4VvjwF7WR3DDK2wiZGZnuWfkg8rXoyNBNf5NRe2FjoPWFU21R44ujLbnvsYRPZ5y24XzraKpLrYUhNDnMKHPqFo9CB6He8BnFWQzqQWJdWqYmdNgwbFC3yTuoyn1bNieRKPf2hXPMzQonRTcJBHLPXqgjhP39tbbc7fD83uDCxkyaT6TJzroCy7MU5TW159cDryPJQXwcbEir6EuACnqxs7e1BPzhFgDEdb3yw7m7rhvxYwcyk3mEamAdUJHxnnvi7M3uw8'
				||
				currentAddress == 'Qn2EsTdde6bMH91AoCaTV2dLbxBbepqZpZurA17XNZSF8nNLMF9cWxJQ6sDf9pNpeXiQ8T4Ay2G5xCiiz7u8CVNvJrxBSwpUDwPff3N2KJM1Bokazqqn2pVKNDbdRLc76L599kQxEBqGNcVeG9yMUGVLBeJNZyHsCRnCACKj9CPsGW63mtgUdzNTnLUhNYQETir8auYF2aQuAqzSGfFUuqqg89uXZBcXt4XVe49aoydo1ffjAmPH6g6NdErjB7FNmKEx3dxGGtgJSbniC1znoY2uvpyEZVorCobdQ9hy6uQG8Ho3VXftn324VdeLYi9jd23XuUKCsT4YPaVG6naH7N1WRuMMxyC3sRkX3qqp3DNgcGh1oxrUm9BGjJrTw2G3b9j4QV9XrXBPdNJAuzU5BVw5jwNLyGWsCp8Ap6666YDRX95wSxrwftZjo6PyfYHNra6D6LwtPKGJM2L5b5k1afidudtFjyJhnHyu5JgjX7JNV72QXhYM2TfngV77zGu6Pr8kSHutgJHFAU8jbVv9DPVSyLEXsUKvWYvHVB2BNVi7THmyeZnmsoXUv87fWLKpFDjmQeqFg'
			) {
				$('#nftAuction').html('<p>Available for purchase on <a class="erg-span" target="_new" href="https://mart.mewfinance.com/explore?tokenId=' + tokenId + '">Mew Mart</a></p>' + $('#nftAuction').html());
			}

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
	$('#tokenDescriptionHolderRight').removeClass('col-xl-10 col-lg-9');
	$('#tokenDescriptionHolderRight').addClass('col-xl-8 col-lg-7');

	$('#tokenIcon').addClass('col-12');
	$('#tokenIcon').addClass('col-lg-2');

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

function showImage() {
	$('#nftPreviewImg').attr('src', imageUrl);
	$('#nftImageFull').attr('src', imageUrl);
	$('#nftPreviewImgNsfw').hide();
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
	printGainersLosers(2);
	$('#showGainersLosers30d').removeClass('btn-primary');
	$('#showGainersLosers30d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
}

function printGainersLosers7d() {
	printGainersLosers(1);
	$('#showGainersLosers7d').removeClass('btn-primary');
	$('#showGainersLosers7d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers24h() {
	printGainersLosers(0);
	$('#showGainersLosers24h').removeClass('btn-primary');
	$('#showGainersLosers24h').addClass('btn-info');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function toggleChart() {
	chartUsd = !chartUsd;
	printGainersLosers(chartType);

	$('#chartToggleBtn').val(chartUsd ? 'USD' : 'ERG');
}

function printGainersLosers(timeframe) {
	let data = JSON.parse(JSON.stringify(priceData));
	chartType = timeframe;

	if (data.length == 0
		|| data[0].length == 0
	) {
		return;
	}

	for (var i = 0; i < data.length; i++) {
		if (data[i].length == 0) continue;

		let item = data[i][0];

		let oldPrice = chartUsd ? item.price : item.price_in_erg;
		let newPrice = chartUsd ? prices[tokenId] : prices[tokenId] / prices['ERG'];
		let difference = (newPrice * 100 / oldPrice) - 100;

		if (!difference || isNaN(difference)) {
			continue;
		}

		difference = toFixed(difference, 2);

		let classString = 'text-success';
		if (difference > 0) {
			difference = '+' + difference;
		} else {
			difference = difference;
			classString = 'text-danger';
		}

		if (i == 2) {
			$('#usdChange30d').html(difference + '%');
			$('#usdChange30d').addClass(classString);

			from30dset = true;
		}

		if (i == 1) {
			$('#usdChange7d').html(difference + '%');
			$('#usdChange7d').addClass(classString);

			from7dset = true;
		}

		if (i == 0) {
			$('#usdChange24h').html(difference + '%');
			$('#usdChange24h').addClass(classString);

			from24hset = true;
		}
	}

	data = data[timeframe];

	// let from7dset = false;
	// let from30dset = false;
	// let from24hset = false;
	

	if (prices[tokenId]) {
		let price = (chartUsd ? '$' + formatValue(prices[tokenId], 2, true) :
		formatValue(prices[tokenId] /prices['ERG'], 9, true) + ' <span class="erg-span">ERG</span>');
		$('#usdPrice').html(price);
	} else if (data.length > 0) {
		let price = (chartUsd ? '$' + formatValue(parseFloat(data[0].price), 2, true) :
		formatValue(data[0].price / prices['ERG'], 9, true) + ' <span class="erg-span">ERG</span>');
		$('#usdPrice').html(price);
	}

	//  for (var i = data.items.length - 1; i >= 0; i--) {
	// 	if (timeframe > data.items[i].timestamp) {
	// 		data.items.splice(i, 1);
	// 		continue;
	// 	}
	// }

	// let tI = 0;
	// let lastTimestamp = -1;
	// let step = 1;
	// let lastStep;
	// let diff = 0;
	// let diffI = 0;
	// if (data.items.length > 25) {
	// 	step = parseInt(data.items.length / 25);
	// }
	// data.items = data.items.filter(function (_, index) {
	// 	let item = data.items[index];
	// 	if (index == 0) {
	// 		lastStep = item.value;
	// 		diff = 0;

	// 		return true;
	// 	}

	// 	if (index == data.items.length - 1) {
	// 		return true;
	// 	}

	// 	let temp = Math.abs(lastStep - item.value);
	// 	if (temp > diff) {
	// 		diff = temp;
	// 		diffI = index;
	// 	}

	// 	if (index % step === 0) {
	// 		data.items[index].value = data.items[diffI].value;

	// 		lastStep = item.value;
	// 		diff = 0;

	// 		return true;
	// 	}

	// 	return false;
	// });

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
	//data.items = data.items.reverse();
	
	data.push({
		'price': prices[tokenId],
		'price_in_erg': prices[tokenId] /prices['ERG'],
		'timestamp': unixTimestampToDateTimeUTCString(getCurrentUTCDate().getTime())
	})

	if (chart != undefined) {
		chart.destroy();
	}

	tempDateIndex = 0;

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
	            		let formattedValue = (chartUsd ? '$' : '') + nFormatter(tooltip.parsed.y, getAutoDigits(tooltip.parsed.y)) + (chartUsd ? '' : ' ERG');

	            		return formattedValue;
	            	}
	            }
	          }
	        }
	      },
	      data: {
	        labels: data.map(mapLabel),
	        datasets: [
	          {
	            label: '$',
	            data: data.map(row => chartUsd ? row.price : row.price_in_erg)
	          }
	        ]
	      }
	    }
	  );
	  
	$('#priceInfo').show();
	$('#priceLoading').hide();
}

function mapLabel(row, index) {
	if (chartType == 0) {
		return formatTimeString(utcToLocal(row.timestamp));
	} else {
		let dateString = parseDate(row.timestamp).toLocaleDateString();
		return dateString;

		if (dateString != tempDate) {
			tempDate = dateString;
			tempDateIndex = index;
			return dateString;
		} else {
			return '';
		}
	}
}

function isAudioPlayable(audioUrl) {
  const audio = new Audio();

  const mimeType = getMimeType(audioUrl);

  if (audio.canPlayType(mimeType) !== '') {
    return true;
  } else {
    return false;
  }
}

// Helper function to get the MIME type based on the file extension
function getMimeType(url) {
  const extension = url.split('.').pop();
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    default:
      return '';
  }
}