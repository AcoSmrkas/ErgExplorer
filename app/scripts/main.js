var qrCode = null;
var networkType = 'mainnet';
var addresses = new Array();
var addressbook = new Array();
var shownNotificationPermissionToast = false;

setupMainnetTestnet();

$.ajaxSetup({
    cache: false
});

$(function() {
	$('#searchInput').val('');

	setOfficialLink();

	if (IS_DEV_ENVIRONMENT) {
		// ERGEXPLORER_API_HOST = 'https://localhost/ergexplorer-api/'
	}

	if (window.location.host == 'dev.ergexplorer.com') {
		ERGEXPLORER_API_HOST = 'https://devapi.ergexplorer.com/';
	}

	    // Function to toggle between two divs
    function toggleDivs() {
    //    $('#ad1').toggle();
    //    $('#ad2').toggle();
    }

    // Call the toggle function every 5 seconds
    //setInterval(toggleDivs, 9000);

	$('#cyear').html(new Date().getFullYear());

});

window.addEventListener('hashchange', () => {
		if (IS_DEV_ENVIRONMENT) {
			window.location.reload();
		}
	}, false
);

function setDocumentTitle(text) {
	document.title = 'Erg Explorer - ' + text;
}

function setErgLogoImageColor(elementId, width) {
	// Get references to the canvas and its context
	const canvas = document.getElementById(elementId);
	const ctx = canvas.getContext('2d');

	// Load the image
	const img = new Image();
	img.src = '/images/logo-white.png'; // Replace with your image URL
	img.onload = () => {
	    // Set canvas size to match the image dimensions
	    canvas.width = width;
	    canvas.height = width;
	    
	    // Draw the image on the canvas
	    ctx.drawImage(img, 0, 0, width, width);
	    
	    // Get the image data
	    const imageData = ctx.getImageData(0, 0, img.width, img.height);
	    const data = imageData.data;
	    
	    // Define the hex color to replace white
	    // Get the computed styles of an element (can be any element, even hidden)
		const rootStyles = getComputedStyle(document.documentElement);

		// Get the value of the global CSS variable
		const primaryColor = rootStyles.getPropertyValue('--main-color').trim();

	    const hexColor = primaryColor; // Replace with the desired hex color
	    
	    // Loop through the image data and replace white pixels with the new color
	    for (let i = 0; i < data.length; i += 4) {
	        const red = data[i];
	        const green = data[i + 1];
	        const blue = data[i + 2];
	        const alpha = data[i + 3];
	        
	        // Check if the pixel is white (255, 255, 255)
	        if (alpha > 0) {
	            data[i] = parseInt(hexColor.slice(1, 3), 16);
	            data[i + 1] = parseInt(hexColor.slice(3, 5), 16);
	            data[i + 2] = parseInt(hexColor.slice(5, 7), 16);
	        }
	    }
	    
	    // Put the modified image data back on the canvas
	    ctx.putImageData(imageData, 0, 0);
	};
}

function getWalletAddressFromUrl() {
	let addressFromUrl = undefined;

	if (Object.keys(params)[0] = params[Object.keys(params)[0]]) {
		addressFromUrl = Object.keys(params)[0];
	}

	return addressFromUrl;
}

function getWalletAddressUrl(address) {
	return getSearchQueryPage('addresses', address);
}

function goToWalletAddressUrl(address) {
    window.location.assign(getWalletAddressUrl(address));
}

function getTransactionsUrl(txId) {
	return getSearchQueryPage('transactions', txId);
}

function goToTransactionUrl(txId) {
    window.location.assign(getSearchQueryPage('transactions', txId));
}

function getBoxUrl(txId) {
	return getSearchQueryPage('boxes', txId);
}

function goToBoxUrl(txId) {
    window.location.assign(getSearchQueryPage('boxes', txId));
}

function getBlockUrl(blockId) {
	return getSearchQueryPage('blocks', blockId);
}

function goToBlockUrl(blockId) {
    window.location.assign(getBlockUrl(blockId));
}

function getTokenUrl(tokenId) {
	return getSearchQueryPage('token', tokenId);
}

function goToTokenUrl(tokenId) {
    window.location.assign(getSearchQueryPage('token', tokenId));
}

function getIssuedTokensSearchUrl(query) {
	if (query.trim() == '') {
		delete(params['query']);
	} else {
		params['query'] = query.replace(/#/g, '%23');
	}

	delete(params['offset']);
	delete(params['limit']);

	let url = getUrlWithParams('issued-tokens', false);

	return url;
}

function goToIssuedTokensSearch(query) {
	window.location.assign(getIssuedTokensSearchUrl(query));
}

//Search box
function submitSearch(key) {
	if (key.keyCode != 13) return;

	searchAddress();
}

function getSearchQueryPage(page, query) {
	let newPage = '';

	if (IS_DEV_ENVIRONMENT) {
		newPage = '/' + page + '#' + query;
	} else {
		newPage = '/' + page + '/' + query;
	}

	return newPage;
}

var searchType = null;
async function searchAddress() {
	let searchQuery = $('#searchInput').val().trim();
	searchType = $('#searchType').val();

	if (searchType == "*") {
		checkErgoIdentifier(searchQuery);

		do {
			await sleep(100);
		} while (searchType == '*')
	}

	if (searchType != '2' && searchQuery == '') return;

	switch (searchType) {
		case '0':
			goToWalletAddressUrl(searchQuery);
			break;
		case '1':
			goToTransactionUrl(searchQuery);
			break;
		case '2':
			if (searchQuery.length == 64) {
				goToTokenUrl(searchQuery);
			} else {
				goToIssuedTokensSearch(searchQuery);
			}
			break;
		case '3':
			goToBlockUrl(searchQuery);
			break;
		case '4':
			goToBoxUrl(searchQuery);
			break;

		default:
			break;
	}
}

function checkErgoIdentifier(input) {
  try {
    qfleetSDKcore.ErgoAddress.fromBase58(input);

    searchType = "0";
    return;
  } catch {}

	if (input.length == 64) {
		try {
			$.get(`${API_HOST}transactions/${input}`,
	  		function (data) {
	  			searchType = "1";
	  		});
		} catch {}

		if (MEMPOOL_API_HOST) {
			$.get(`${MEMPOOL_API_HOST}transactions/${input}`,
			function (data) {
				searchType = "1";
			});
		}

		try {
			$.get(`${API_HOST}tokens/${input}`,
	  		function (data) {
	  			searchType = "2";
	  		});
		} catch {}

		try {
			$.get(`${API_HOST}blocks/${input}`,
	  		function (data) {
	  			searchType = "3";
	  		});
		} catch {}
	} else {
		searchType = "2";
	}
}

//Format strings
function formatErgValueString(value, maxDecimals = 4, force = false, ergSpan = false) {
    let ergValue = parseFloat(new BigNumber(value).dividedBy(1000000000).toString());
	
    let tempMaxDecimals = getDecimals(ergValue, 1);

	if (tempMaxDecimals > maxDecimals && maxDecimals > 0) {
		maxDecimals = tempMaxDecimals;
	}

    if ((ergValue > 10 || ergValue < -10) && !force) {
		maxDecimals = 2;
    }

    let minimumFractionDigits = 2;
    if (maxDecimals < minimumFractionDigits) {
            minimumFractionDigits= maxDecimals;
    }
	
	return '<strong title="' + ergValue + '"><span class="text-white">' + ergValue.toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: minimumFractionDigits }) + '</span></strong> <strong' + (ergSpan ? ' class="erg-span"' : '') + '>ERG</strong>';
}

function utcToLocal(utcDateString) {
	// Convert to Date object
const utcDate = new Date(utcDateString.replace(" ", "T") + "Z"); // Ensure it's in a valid format

// Convert to current locale date string
const localeDateString = utcDate.toLocaleString();

return localeDateString;
}

function unixTimestampToDateTimeString(timestamp) {
    // Create a new Date object from the Unix timestamp (in milliseconds)
    const date = new Date(timestamp);

    // Get the date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    // Construct the date-time string in the desired format
    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

    return dateTimeString;
}

function unixTimestampToDateTimeUTCString(timestamp) {
    // Create a new Date object from the Unix timestamp (in milliseconds)
    const date = new Date(timestamp);

    // Get the date components
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');

    // Construct the date-time string in the desired format
    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;

    return dateTimeString;
}

function getCurrentUTCDate() {
    const currentDate = new Date();
    return new Date(Date.UTC(
        currentDate.getUTCFullYear(), 
        currentDate.getUTCMonth(), 
        currentDate.getUTCDate(),
        currentDate.getUTCHours(),
        currentDate.getUTCMinutes(),
        currentDate.getUTCSeconds()
    ));
}

function parseDate(dateString) {
    const components = dateString.split(/[- :]/);
    return new Date(Date.UTC(
        components[0], components[1] - 1, components[2],
        components[3], components[4], components[5]
    ));
}

function formatTimeString(dateString, seconds) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + (seconds ? ':' + zeroPad(date.getSeconds(), 2) : '');
}

function formatDateString(dateString) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + ':' + zeroPad(date.getSeconds(), 2) + ', ' + date.toLocaleDateString(getLang());
}

function formatShortDateString(dateString) {
	const date = new Date(dateString);
	const sameYear = date.getFullYear() === new Date().getFullYear();

	return formatTimeString(dateString, false) + ' \u00b7 ' + date.toLocaleDateString(getLang(), sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

function getLang() {
	if (navigator.languages != undefined) {
		return navigator.languages[0];
	}
	
	return 'en-GB';
}

function formatKbSizeString(size) {
	return (size / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' kB';
}

function formatLongAddressString(address, length = 15) {
	return (address.length > 64 ? address.substring(0, length) + '...' + address.substring(address.length - 4) : address);
}

function formatAddressString(address, length = 15) {
	if (address == 'Multiple') return 'Multiple';

	return address.substring(0, length) + '...' + address.substring(address.length - 4);
}

function formatHashRateString(value) {
	return (value / 1000000000000).toLocaleString('en-US') + ' TH/s'
}

function formatIpfsCidHtmlString(cid) {
	let urlHtml = '';

	for (let i = 0; i < IPFS_PROVIDER_HOSTS.length; i++) {
		let mirrorUrl = IPFS_PROVIDER_HOSTS[i] + '/ipfs/' + cid;
		let linkString = mirrorUrl;
		
		if (mirrorUrl.length > NFT_LINK_MAX_LENGTH) {
			linkString = formatAddressString(mirrorUrl, NFT_LINK_MAX_LENGTH);
		}

		urlHtml += `<p>Mirror 0${i+1}: <a  target="_new" href="` + 
		mirrorUrl + '">' + linkString + '</a></p>'
	}

	return urlHtml;
}


function formatValue(value, digits, autodigits = false, same = false) {
	if (autodigits) {
		digits = getAutoDigits(value, digits);
	}

	let vstring = '';
	let minimumFractionDigits = 2;
	if (digits < minimumFractionDigits) {
		minimumFractionDigits = digits;
	}

	if (!isFloat(value) && isLargerThanMaxSafeInteger(value)) {
		vstring = formatBigIntToLocaleString(value);
	} else {
		vstring = value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits });
	}

	if (same) {
		return '<span title="' + vstring + '">' + vstring + '</span>';
	} else {
		return '<span title="' + vstring + '">' + nFormatter(value, digits) + '</span>';
	}
}

function isFloat(value) {
  return typeof value === 'number' && !Number.isInteger(value) && !isNaN(value);
}

function isLargerThanMaxSafeInteger(numberAsString) {
  let parsedNumber = BigInt(numberAsString);
  return parsedNumber > Number.MAX_SAFE_INTEGER;
}

function formatBigIntToLocaleString(bigIntNumber) {
  // Convert BigInt to a string
  let bigIntAsString = bigIntNumber.toString();

  // Split the string into chunks of 3 digits (for formatting)
  let chunks = [];
  while (bigIntAsString.length > 0) {
    chunks.unshift(bigIntAsString.slice(-3));
    bigIntAsString = bigIntAsString.slice(0, -3);
  }

  // Join the chunks with the appropriate locale-specific separator
  let formattedString = chunks.join(',');

  return formattedString;
}

function getAutoDigits(value, digits = 2, additionalDigits = 2) {
	let temp = value.toString().split('.');
	if (temp.length > 1) {
		let realSmall = temp[1].split('-');
		if (realSmall.length > 1) {
			digits = parseInt(realSmall[1]) + 1;
		} else {
			for (let j = 0; j < temp[1].length; j++) {
				if (temp[1][j] != '0' && j > 1) {
					digits = j + additionalDigits;

					if ((j + 1) < temp[1].length && temp[1][j] != '0') {
						digits = j + additionalDigits + 1;
					}

					break;
				}
			}
		}
	}

	return digits;
}

function formatAssetValueString(value, decimals, digits = 2, noshort = false) {
	let assetValue = getAssetValue(value, decimals);

	if (assetValue > 0.1 && decimals > 2) {
		digits = 2;
	}

	digits = getDecimals(assetValue, 1);

	if (decimals < 2) {
		digits = decimals;
	}
	
	return formatValue(assetValue, digits, false, noshort);
}

function formatAssetNameAndValueString(name, valueString, tokenId) {
	return '<p><strong>' + name + '</strong>: <span class="text-white">' + valueString + '</span></p>';
}

function formatAssetDollarPriceString(tokenAmount, tokenDecimals, tokenId) {
	if (gotPrices == undefined || !gotPrices) {
		return '';
	}

	return formatDollarPriceString(formatAssetDollarPrice(tokenAmount, tokenDecimals, tokenId));
}

function formatDollarPriceString(value, digits = 5) {
	if (gotPrices == undefined || !gotPrices || isNaN(value)) {
		return '';
	}

	if (value >= 0.1) {
		digits = 2;
	}

	digits = getDecimals(value, 1);

	return '($' + formatValue(value, digits) + ')';
}

function formatAssetDollarPrice(tokenAmount, tokenDecimals, tokenId) {
	if (gotPrices == undefined || !gotPrices || prices[tokenId] == undefined) {
		return -1;
	}

	if (tokenAmount < 0) {
		tokenAmount *= -1;
	}

	return getAssetValue(tokenAmount, tokenDecimals) * prices[tokenId];
}

function formatNftDescription(description) {
	if (description == null) {
		return description;
	}

	if (isJson(description) && isNaN(description)) {
		let jsonObject = JSON.parse(description);
		let result = '';
		result = parseNftJson(jsonObject, result, 0);

		return result;
	} else {
		description = description.replaceAll('\n', '<br>');

		return description;
	}
}

function parseNftJson(jsonObject, result, indent) {
	let keys = Object.keys(jsonObject);
	let values = Object.values(jsonObject);

	for (let i = 0; i < keys.length; i++) {
		if (typeof values[i] === 'object') {
			result += formatNftDescriptonJson(keys[i], '', indent) + '<br>';

			if (values[i] != null) {
				result = parseNftJson(values[i], result, indent + 1);
			} else {
				result += '    null';
			}
		} else {
			result += formatNftDescriptonJson(keys[i], values[i], indent); 
		}

		if (i < keys.length - 1) {
			result += '<br>';
		}
	}

	return result
}

function formatNftDescriptonJson(key, value, indent) {
	let tab = '';
	for (let i = 0; i < indent; i++) {
		tab += '    ';
	}

	return tab + '<strong>' + key + '</strong>: ' + value;
}

function getAssetTitle(asset, iconIsToTheLeft, scam = false) {
	return getAssetTitleParams(asset, asset.tokenId, asset.name, iconIsToTheLeft, scam);
}

function getAssetTitleParams(token, tokenId, name, iconIsToTheLeft, scam = false) {
	let imgSrc = '';
	if (hasIcon(tokenId)) {
		imgSrc = getIcon(tokenId);
	}

	if (name == 'Crooks Finance Stake Key') {
		imgSrc = 'https://crooks-fi.com/images/logo.png';
	}

	if (name == 'Mew Fun Lottery Ticket') {
		imgSrc = 'https://api.ergexplorer.com/nftcache/bafybeie6z4zm7ahjvlawjfq4idojdrahklksygpfmb4zvlrx3id3h5dyty.png';
	}

	if (token && token.iconurl) {
		imgSrc = token.iconurl;
	}

	let iconHtml = '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="' + imgSrc + '"/>';

	if (tokenId == 'ERG') {
		return name;
	}

	let displayName = (name == '' || name == null) ? formatAddressString(tokenId, 15) : name;
	let dataName = ('' + displayName).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	return '<a title="' + (scam ? 'Reported as suspicious by users.' : '') + '" class="token-link' + (scam ? ' text-danger' : '') + '" href="' + getTokenUrl(tokenId) + '" data-token-id="' + tokenId + '" data-token-name="' + dataName + '"' + (scam ? ' data-token-scam="1"' : '') + '>' + (iconIsToTheLeft ? iconHtml + ' ' : '') + displayName + (iconIsToTheLeft ? '' : ' ' + iconHtml) + '</a>';
}

function getAssetValue(amount, decimals) {
	if (!isFloat(amount) && isLargerThanMaxSafeInteger(amount)) {
		return (BigInt(amount) / (BigInt(Math.pow(10, decimals)))).toString();
	} else {
		return amount / Math.pow(10, decimals);
	}
}

function onTokenIconLoad(element) {
	$(element).show();
}

function zeroPad (num, places) {
	return String(num).padStart(places, '0');
}

//Mainnet/Testnet
function setupMainnetTestnet() {
	networkType = localStorage.getItem('network');
	
	if (networkType == undefined) {
		networkType = 'mainnet';
	}

	if (networkType == 'testnet') {
		$('.networkType').html('Testnet')
		$('.networkType').removeClass('text-light');
		$('.networkType').addClass('erg-span-important');
		localStorage.setItem('network', 'testnet');
		API_HOST = API_HOST_2 = 'https://api-testnet.ergoplatform.com/';
		MEMPOOL_API_HOST = null;
		FEE_ADDRESS = 'Bf1X9JgQTUtgntaer91B24n6kP8L2kqEiQqNf1z97BKo9UbnW3WRP9VXu8BXd1LsYCiYbHJEdWKxkF5YNx5n7m31wsDjbEuB3B13ZMDVBWkepGmWfGa71otpFViHDCuvbw1uNicAQnfuWfnj8fbCa4';
	} else {
		$('.networkType').html('Mainnet')
	}
}

function switchToMainnet(e) {
	e.preventDefault();

	if (networkType == 'mainnet') return;

	localStorage.setItem('network', 'mainnet');

	window.location.assign('/');
}

function switchToTestnet(e) {
	e.preventDefault();

	if (networkType == 'testnet') return;

	localStorage.setItem('network', 'testnet');

	window.location.assign('/');
}

function setOfficialLink() {
	if (networkType == 'testnet') {
		$('#officialLink').html('https://testnet.ergoplatform.com');
		$('#officialLink').attr('href', 'https://testnet.ergoplatform.com');
	}
}

//Utils
function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
}

function copyToClipboard(e, text) {
	e.preventDefault();

	if (navigator.clipboard != undefined) {
		navigator.clipboard.writeText(text);
		$('#toastBody').html('Copied to clipboard!');
	} else {
		$('#toastBody').html('Copy to clipboard failed.');
	}

	showToast();
}

function copyAddress(e, element) {
	copyToClipboard(e, $(element).attr('title'));
}

function showCustomToast(text) {
	$('#customToastBody').html(text);

	bootstrap.Toast.getOrCreateInstance(document.getElementById('customToast')).show();
}

function hideCustomToast() {
	bootstrap.Toast.getOrCreateInstance(document.getElementById('customToast')).hide();
}

function showQRcode(text) {
	if (qrCode == null) {
		 qrCode = new QRCode(document.getElementById('qrcode'), {
			text: text,
			width: 400,
			height: 400,
			colorDark : '#000000',
			colorLight : '#ffffff',
			correctLevel : QRCode.CorrectLevel.H
		});
	}

	$('#qrCodeBack').fadeIn();
	$('#qrCodeBack').css('display', 'flex');

	$('body').css('height', '100%');
	$('body').css('overflow-y', 'hidden');

	window.scrollTo(0, 0);
}

//Pass a tx's inputs with its outputs to tag the outputs that return change to a spending wallet
function formatInputsOutputs(data, inputs = null) {
	let formattedData = '';
	const changeAddresses = new Set();

	for (const input of inputs || []) {
		if (isWalletBox(input)) {
			changeAddresses.add(getBoxAddress(input));
		}
	}

	for (let i = 0; i < data.length; i++) {
		const change = isWalletBox(data[i]) && changeAddresses.has(getBoxAddress(data[i]));

		formattedData += formatBox(data[i], false, false, change);
	}

	return formattedData;
}

//A box guarded by a single public key (P2PK), i.e. a plain wallet rather than a contract.
//Block API inputs come without an ErgoTree; a P2PK address is 51 chars from 9 (mainnet) or 3 (testnet)
function isWalletBox(box) {
	if (box.ergoTree) {
		return box.ergoTree.startsWith('0008cd');
	}

	return typeof box.address == 'string' && box.address.length == 51 && /^[93]/.test(box.address);
}

/**
 * A box's real address.
 *
 * The explorer API substitutes a placeholder address for ErgoTrees its sigma
 * version cannot parse. LithosDex's fee vault is the live example: it comes
 * back as 4MQyMKvMbnCJG3aJ on mainnet and Ms7smJmdbakqfwNo on testnet, both of
 * which are the 7-byte sigmaProp(false) script rather than the box's own. The
 * ergoTree served beside it is correct, and building an address from it needs
 * no script parsing at all -- an address is a network prefix, the tree bytes
 * and a checksum -- so derive it rather than trust the field.
 *
 * The network argument is not optional: Fleet defaults to mainnet, so omitting
 * it would hand back mainnet addresses while the explorer is in testnet mode.
 *
 * Falls back to whatever the API said when there is no tree, or if the
 * derivation throws, so a box always renders something.
 */
function getBoxAddress(box) {
	if (!box) {
		return undefined;
	}

	if (!box.ergoTree) {
		return box.address;
	}

	try {
		return qfleetSDKcore.ErgoAddress.fromErgoTree(box.ergoTree, getFleetNetwork()).toString();
	} catch (e) {
		return box.address;
	}
}

function getFleetNetwork() {
	return networkType == 'testnet'
		? qfleetSDKcore.Network.Testnet
		: qfleetSDKcore.Network.Mainnet;
}

function formatBox(box, trueBox = false, unspent = false, change = false) {
	if (box.id) {
		box.boxId = box.id;
	}

	const boxAddress = getBoxAddress(box);

	if (boxAddress == FEE_ADDRESS && !trueBox && !unspent) {
		return formatFeeBox(box);
	}

	addAddress(boxAddress);

	let html = '<div class="row div-cell border-flat p-2"><div class="col-12 box-card">';

	//Header: index and address, with spent status and the creating tx to the right
	let status = change ? '<span class="text-light" title="Goes back to an address that funded this transaction">Change</span>' : '';

	if (!unspent && box.spentTransactionId !== undefined) {
		status += box.spentTransactionId === null
			? '<span class="text-success">Unspent</span>'
			: '<a class="text-danger" title="Transaction that spent this box" href="' + getTransactionsUrl(box.spentTransactionId) + '">Spent</a>';
	}

	if (box.outputTransactionId != undefined) {
		status += '<a title="Transaction that created this box" href="' + getTransactionsUrl(box.outputTransactionId) + '">Output</a>';
	}

	//The address page lists its own unspent boxes, where the address would only repeat the page's
	if (!unspent) {
		html += '<div class="box-head">'
			+ '<div class="box-address">' + (box.index != undefined && !trueBox ? '<span class="box-index">#' + box.index + '</span>' : '')
			+ '<a class="address-string" addr="' + boxAddress + '" href="' + getWalletAddressUrl(boxAddress) + '" >' + formatAddressString(boxAddress, 8) + '</a> ' + copyIcon(boxAddress) + '</div>'
			+ (status ? '<div class="box-status">' + status + '</div>' : '')
			+ '</div>';
	}


	//Box id and heights. Inputs carry the height and block of the tx that created them under output* names
	const settlementHeight = box.settlementHeight || box.outputSettledAt;
	const settlementBlockId = box.blockId || box.outputBlockId;
	let meta = [];

	if (box.boxId && !trueBox) {
		meta.push('<strong>ID</strong> <a href="' + getBoxUrl(box.boxId) + '">' + formatAddressString(box.boxId, 8) + '</a> ' + copyIcon(box.boxId));
	}

	if (settlementHeight) {
		meta.push('<strong>Height</strong> <a href="' + getBlockUrl(settlementBlockId) + '">' + nFormatter(settlementHeight, 0, true, true) + '</a>');
	}

	if (meta.length > 0) {
		html += '<div class="box-meta">' + meta.join('<span class="box-dot">·</span>') + '</div>';
	}

	//Value
	html += '<div class="box-value">' + formatErgValueString(box.value, 9, true, true) + ' <span class="text-light">' + formatAssetDollarPriceString(box.value, ERG_DECIMALS, 'ERG') + '</span></div>';

	//The box page shows the full ids and heights
	if (trueBox) {
		html += '<div class="box-section">Details</div><div class="box-grid">';
		html += '<span>Transaction</span><span class="box-hex"><a href="' + getTransactionsUrl(box.transactionId) + '">' + box.transactionId + '</a> ' + copyIcon(box.transactionId) + '</span>';

		if (box.spentTransactionId) {
			html += '<span>Spent in</span><span class="box-hex"><a href="' + getTransactionsUrl(box.spentTransactionId) + '">' + box.spentTransactionId + '</a> ' + copyIcon(box.spentTransactionId) + '</span>';
		}

		html += '<span>Created at</span><span><a href="' + getBlockUrl(box.creationHeight) + '">' + nFormatter(box.creationHeight, 0, true, true) + '</a></span>';
		html += '</div>';
	}

	//Assets
	if (box.assets != undefined && box.assets.length > 0) {
		//Long lists scroll inside a fixed height, with faded edges
		const scrolls = box.assets.length > BOX_TOKENS_SHOWN;

		html += '<div class="box-section">Tokens <span class="box-count">(' + box.assets.length + ')</span></div><div class="box-tokens' + (scrolls ? ' box-tokens-scroll scroll-fade' : '') + '">';

		for (let j = 0; j < box.assets.length; j++) {
			let asset = box.assets[j];
			let assetPrice = formatAssetDollarPrice(asset.amount, asset.decimals, asset.tokenId);

			html += '<div class="box-token"><span class="box-token-name">' + getAssetTitle(asset, true) + '</span>'
				+ '<span class="box-token-amount">' + formatAssetValueString(asset.amount, asset.decimals, 4, !trueBox)
				+ (assetPrice == -1 ? '' : ' <span class="text-light">' + formatDollarPriceString(assetPrice) + '</span>') + '</span></div>';
		}

		html += '</div>';
	}

	//Registers
	html += formatBoxRegisters(box.additionalRegisters);

	if (trueBox) {
		html += '<div class="box-section">Ergo tree</div><div class="div-cell-dark box-hex box-tree">' + box.ergoTree + '</div>';
	}

	return html + '</div></div>';
}

const BOX_TOKENS_SHOWN = 6;

//A .scroll-fade list fades at the top once scrolled down and at the bottom until scrolled to its end
function updateScrollFade(list) {
	list.classList.toggle('scrolled-down', list.scrollTop > 2);
	list.classList.toggle('scrolled-end', list.scrollTop + list.clientHeight >= list.scrollHeight - 2);
}

//Scroll doesn't bubble, so one capturing listener serves every faded list
document.addEventListener('scroll', function(e) {
	const list = e.target;

	if (list.classList && list.classList.contains('scroll-fade')) {
		updateScrollFade(list);
	}
}, true);

//Lists whose height comes from the layout fade only while they overflow. This rechecks the container,
//or the lists inside it matching selector, whenever it resizes (including being shown) or is refilled
function watchScrollFade(container, selector) {
	if (!container) {
		return;
	}

	const refresh = function() {
		const lists = selector ? container.querySelectorAll(selector) : [container];

		for (const list of lists) {
			const overflows = list.scrollHeight > list.clientHeight + 2;

			list.classList.toggle('scroll-fade', overflows);

			if (overflows) {
				updateScrollFade(list);
			}
		}
	};

	if (typeof ResizeObserver != 'undefined') {
		new ResizeObserver(refresh).observe(container);
	}

	new MutationObserver(refresh).observe(container, { childList: true, subtree: !!selector });
	refresh();
}

//The miner fee output on one line: it never holds tokens or registers worth a card
function formatFeeBox(box) {
	return '<div class="row div-cell border-flat p-2"><div class="col-12 box-card"><div class="box-head box-fee">'
		+ '<div>' + (box.index != undefined ? '<span class="box-index">#' + box.index + '</span>' : '')
		+ '<a href="' + getWalletAddressUrl(FEE_ADDRESS) + '">Miner fee</a> ' + copyIcon(FEE_ADDRESS) + '</div>'
		+ '<div class="box-fee-value">' + formatErgValueString(box.value, 9, true, true) + ' <span class="text-light">' + formatAssetDollarPriceString(box.value, ERG_DECIMALS, 'ERG') + '</span></div>'
		+ '</div></div></div>';
}

function copyIcon(value) {
	return '<a title="' + value + '" onclick="copyId(event, this)" href="Copy to clipboard!">&#128203;</a>';
}

/**
 * Additional registers (R4-R9), decoded from serializedValue with fleet so every
 * type renders, including the ones the explorer leaves without a sigmaType and
 * the raw hex strings our node's mempool returns. Values are shown in their most
 * obvious form: text for readable bytes, addresses for public keys and P2PK
 * trees, a date next to millisecond timestamps. Whatever fleet cannot decode
 * falls back to the explorer's rendering, then to the raw hex.
 */
function formatBoxRegisters(registers) {
	if (!registers) {
		return '';
	}

	const keys = Object.keys(registers).sort();

	if (keys.length == 0) {
		return '';
	}

	let html = '<div class="box-section">Registers</div><div class="box-grid box-registers">';

	for (const key of keys) {
		const register = registers[key];
		const serialized = typeof register == 'string' ? register : register.serializedValue;
		let type = register.sigmaType;
		let value;

		try {
			const constant = qfleetSDK.SConstant.from(serialized);
			type = type || constant.type.toString();
			value = formatRegisterValue(constant.data, constant.type, true);
		} catch (e) {
			//SBox, SAvlTree and non-ProveDlog SigmaProps: as the explorer rendered them, or raw hex
			value = '<span class="box-hex">' + escapeHtmlString(register.renderedValue || serialized || '') + '</span>';
		}

		html += '<span' + (type ? ' title="' + escapeHtmlString(type) + '"' : '') + '>' + escapeHtmlString(key) + '</span><span>' + value + '</span>';
	}

	return html + '</div>';
}

//An SLong in this range is read as a millisecond timestamp: from mainnet launch to ten years ahead
const REGISTER_MIN_TIMESTAMP = 1561939200000;
const REGISTER_TIMESTAMP_SPAN = 10 * 365 * 24 * 3600 * 1000;

function formatRegisterValue(data, type, topLevel = false) {
	const typeName = type.toString();

	if (data instanceof Uint8Array) {
		if (typeName == 'SGroupElement' || typeName == 'SSigmaProp') {
			return formatRegisterPublicKey(bytesToHex(data));
		}

		return formatRegisterBytes(data, topLevel);
	}

	if (typeof data == 'bigint' || typeof data == 'number') {
		let html = data.toString();

		if (typeName == 'SLong' && data >= REGISTER_MIN_TIMESTAMP && data <= Date.now() + REGISTER_TIMESTAMP_SPAN) {
			html += ' <span class="text-light">(' + formatDateString(Number(data)) + ')</span>';
		}

		return html;
	}

	if (typeof data == 'boolean') {
		return data.toString();
	}

	if (data === undefined) {
		return '()';
	}

	if (Array.isArray(data)) {
		const isTuple = typeName.startsWith('(');
		const items = data.map((item, i) => formatRegisterValue(item, isTuple ? type.elementsType[i] : type.elementsType));

		return (isTuple ? '(' : '[') + items.join(', ') + (isTuple ? ')' : ']');
	}

	return escapeHtmlString(String(data));
}

//Coll[SByte]: readable UTF-8 as text, a P2PK ErgoTree as its address, anything else as hex
function formatRegisterBytes(bytes, topLevel) {
	if (bytes.length == 0) {
		return '<span class="text-light">empty</span>';
	}

	const hex = bytesToHex(bytes);

	if (bytes.length == 36 && hex.startsWith('0008cd')) {
		return formatRegisterPublicKey(hex.substring(6));
	}

	const text = decodeReadableText(bytes);

	if (text != undefined) {
		return escapeHtmlString(text);
	}

	return '<span class="box-hex">' + hex + '</span>' + (topLevel ? ' ' + copyIcon(hex) : '');
}

function formatRegisterPublicKey(publicKeyHex) {
	let address;

	try {
		address = qfleetSDKcore.ErgoAddress.fromPublicKey(publicKeyHex, getFleetNetwork()).toString();
	} catch (e) {
		return escapeHtmlString(publicKeyHex);
	}

	addAddress(address);

	return '<a class="address-string" addr="' + address + '" title="' + publicKeyHex + '" href="' + getWalletAddressUrl(address) + '">' + formatAddressString(address, 8) + '</a> ' + copyIcon(address);
}

//Text only for valid UTF-8 without control characters, so hashes and ids stay
//hex while names in any script (emoji included) read as text
function decodeReadableText(bytes) {
	let text;

	try {
		text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch (e) {
		return undefined;
	}

	if (/[\p{Cc}\p{Cf}\p{Co}\p{Cn}]/u.test(text.replace(/[\n\r\t]/g, ''))) {
		return undefined;
	}

	return text;
}

function bytesToHex(bytes) {
	return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function escapeHtmlString(value) {
	return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Pending txs are read from our node's mempool (MEMPOOL_API_HOST) and from
 * api.ergoplatform.com, then merged. The explorer's mempool misses txs that
 * entered the network through other nodes (Nautilus submits via sigmaspace) and
 * at times serves empty pages; ours pulls from several nodes but is mainnet-only.
 */
function mergeMempoolItems(lists) {
	const byId = new Map();

	for (const items of lists) {
		for (const tx of items || []) {
			if (tx && tx.id && !byId.has(tx.id)) {
				byId.set(tx.id, tx);
			}
		}
	}

	// Sources can hold different sides of a double-spend (e.g. a fee-bumped replacement
	// only one node has seen). Keep one tx per spent box: the best fee per byte, as nodes do.
	const spent = new Set();
	const kept = [];

	Array.from(byId.values())
		.sort((a, b) => mempoolFeePerByte(b) - mempoolFeePerByte(a))
		.forEach(tx => {
			const inputIds = (tx.inputs || []).map(input => input.boxId || input.id);

			if (inputIds.some(id => spent.has(id))) return;

			inputIds.forEach(id => spent.add(id));
			kept.push(tx);
		});

	const items = kept.sort((a, b) => (b.creationTimestamp || 0) - (a.creationTimestamp || 0));

	return { items: items, total: items.length };
}

function mempoolFeePerByte(tx) {
	let fee = 0;

	for (const output of tx.outputs || []) {
		if (output.address === FEE_ADDRESS) {
			fee += Number(output.value);
		}
	}

	return tx.size ? fee / tx.size : fee;
}

function showLoadError(message) {
	$('#loadErrorMessage').html(message);
	$('#loadError').show();
}

function animateDots() {
	let dots = $('#dots').html();

	if (dots == '...') { dots = ''; }
	else if (dots == '..') { dots = '...'; }
	else if (dots == '.') { dots = '..'; }
	else if (dots == '') { dots = '.'; }

	$('#dots').html(dots);
}

function showToast() {
	const toastLiveExample = document.getElementById('liveToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function showNotificationPermissionToast(text) {
	if (shownNotificationPermissionToast) {
		return;
	}

	if (text) {
		$('#notificationToastText').text(text);
	}

	bootstrap.Toast.getOrCreateInstance(document.getElementById('notificationToast')).show();

	shownNotificationPermissionToast = true;
}

// Through Bootstrap, not a jQuery fade: a faded-out toast keeps its `show` class and inline
// display:none, so it could never be shown again.
function hideNotificationPermissionToast() {
	bootstrap.Toast.getOrCreateInstance(document.getElementById('notificationToast')).hide();
}

// iOS Safari outside an installed web app has no Notification API at all.
function canShowSystemNotifications() {
	return 'Notification' in window;
}

function requestNotificationPermission(action) {
	if (!canShowSystemNotifications()) {
		return;
	}

	try {
		Notification.requestPermission(() => {
			if (action) action();
		});
	} catch (error) {
		console.warn('Notification permission request failed:', error);
	}
}

// Does nothing where no notification can be shown: no API, no permission, or Chrome on Android,
// whose Notification constructor throws (it only allows service worker notifications).
function showSystemNotification(title, body) {
	if (!canShowSystemNotifications() || Notification.permission !== 'granted') {
		return;
	}

	try {
		const notification = new Notification(title, { body: body, icon: 'https://ergexplorer.com/images/logo.png' });

		notification.onclick = function() {
			window.focus();
			this.close();
		};
	} catch (error) {
		console.warn('Notification failed:', error);
	}
}

function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }

    return true;
}

function scrollToElement(element) {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(element).offset().top
    }, 200);
}

function millisToMinutesAndSeconds(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ' min ' + (seconds < 10 ? '0' : '') + seconds + ' sec';
}

function clamp (num, min, max) {
	return Math.min(Math.max(num, min), max);
}

function nFormatter(num, digits, noLetter = false, noDecimal = false) {
	const lookup = [
		{ value: 1, symbol: '' },
	//	{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'B' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' }
	];

	let isMinus = num < 0;
	if (isMinus) {
		num = Math.abs(num);
	}

	if (num > 10) {
		digits = 2;
	}

	let minimumFractionDigits = 2;
	if (digits < minimumFractionDigits) {
		minimumFractionDigits = digits;
	}

	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
	var item = lookup.slice().reverse().find(function(item) {
		return num >= item.value;
	});

	if (noLetter) {
		item = null;
	}

	let options = {
		minimumFractionDigits: minimumFractionDigits,
		maximumFractionDigits: digits
	};

	if (noDecimal) {
		options = {};
	}
	
	return item ? (isMinus ? "-" : "") + (num / item.value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits }).replace(rx, '$1') + item.symbol
	:
	(isMinus ? "-" : "") + new Intl.NumberFormat("en-US", options).format(num);
}

function sortTokens(tokens) {
	if (tokens == undefined) {
		return new Array();
	}

	let tokensArray = tokens.sort((a, b) => {
		let aAmount = a.amount / Math.pow(10, a.decimals);
		let bAmount = b.amount / Math.pow(10, b.decimals);

		if (aAmount === bAmount) return 0;

		return aAmount > bAmount ? -1 : 1;
	});

	tokensArray.sort((a, b) => {
		let aAmount = a.amount / Math.pow(10, a.decimals);
		let bAmount = b.amount / Math.pow(10, b.decimals);

		if (aAmount > 10000000000) return 1;
	    if (bAmount > 10000000000) return -1;
	    return 0;
	});

	return tokensArray
}

function isAsciiArt(string) {
	return (string != null && string.includes('▉'));
}

function switchTheme(e) {
	e.preventDefault();

	if (theme == 'dark') {
		theme = 'light';
	} else if (theme == 'light') {
		theme = 'mew';
	} else {
		theme = 'dark';
	}

	$('html').attr('data-bs-theme', theme);

	localStorage.setItem('theme', theme);

	updateTheme();
	updateNav();
}

function getOwnerTypeClass(type) {
    switch (type) {
        case 'Exchange':
            return 'text-success';

        case 'Service':
            return 'text-warning';

        case 'NFT Artist':
        	return 'text-info';

        case 'Mining pool':
        	return 'text-danger';

		case 'Meme':
			return 'text-meme';

        default:
        	return '';
    }
}

//Addressbook
function getAddressesInfo() {
	var jqxhr = $.post(ERGEXPLORER_API_HOST + 'addressbook/getAddressesInfo',
		{'addresses' : addresses},
	function (data) {
		if (data.total == 0) return;

		addressbook = data.items;

		labelAddressStrings();
	});

	loadContractTemplates().then(function(analyzer) {
		contractAnalyzer = analyzer;
		labelAddressStrings();
	});
}

//The book's name wins; a contract template only names an address still shown as
//its shortened self, so it never replaces a label a page already chose (the
//address page names Lithos pool boxes after the fill they took part in).
function labelAddressStrings() {
	$('.address-string').each(function(index) {
		if ($(this).html() == 'This Address') {
			return;
		}

		let address = $(this).attr('addr');
		let label = getOwner(address);

		if (label == undefined && isShortenedAddress($(this).text(), address)) {
			label = getContractLabel(address);
		}

		if (label != undefined) {
			$(this).html(label);
		}
	});
}

function isShortenedAddress(text, address) {
	let parts = text.split('...');

	return text == address || (parts.length == 2 && address.startsWith(parts[0]) && address.endsWith(parts[1]));
}

//Contract templates (addresses/constants.js) are some 200 kB, so they load only
//once a page has addresses to label.
var contractAnalyzer = null;
var contractAnalyzerImport = null;

function loadContractTemplates() {
	if (contractAnalyzerImport == null) {
		contractAnalyzerImport = import('./addresses/transaction-analyzer.js').catch(function() {
			return null;
		});
	}

	return contractAnalyzerImport;
}

//A P2S address carries its whole ErgoTree, so the templates the address page
//matches against box trees match the address itself just as well.
function getContractLabel(address) {
	if (contractAnalyzer == null) {
		return undefined;
	}

	try {
		let ergoTree = qfleetSDKcore.ErgoAddress.fromBase58(address).ergoTree;

		return contractAnalyzer.detectContractFromErgotree(ergoTree) || undefined;
	} catch (e) {
		return undefined;
	}
}

function addAddress(address) {
	for (let i = 0; i < addresses.length; i++) {
		if (addresses[i] == address) {
			return;
		}
	}

	addresses.push(address);
}

function getOwner(address) {
	for (var i = 0; i < addressbook.length; i++) {
		if (addressbook[i]['address'] == address) {
			let owner = addressbook[i]['name'];

			if (addressbook[i]['urltype'] != '') {
				owner += ' (' + addressbook[i]['urltype'] + ')';
			} else {
				let shortAdd = addressbook[i]['address'].substr(0, 4);
				if (shortAdd == '88dh') {
					shortAdd = addressbook[i]['address'].substr(addressbook[i]['address'].length - 4);
				}

				owner += ' (' + shortAdd + ')';
			}

			return owner;
		}
	}

	return undefined;
}

function toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

function getDecimals(value, additional = 2) {
	if (value < 0) {
		value *= -1;
	}

	value = value.toString();
    if (value.includes('e-')) {
        let eIndex = value.indexOf('e-');
        return value.substr(eIndex + 2);
    }

	let decimals = 2;
	value = value.split('.');
	if (value.length > 1) {
		let realSmall = value[1].split('-');
		if (realSmall.length > 1) {
			decimals = parseInt(realSmall[1]) + 1;
		} else {
			for (let j = 0; j < value[1].length; j++) {
				if (value[1][j] != '0') {
					decimals = j + additional;

					if (value[1].length > j + 1
	                	&& value[1][j + 1] != '0') {
	                	decimals++;
	                }

					break;
				}
			}
		}
	} else {
		decimals = 2;
	}

	if (decimals < 2) {
		decimals = 2;
	}

	return decimals;
}

function copyId(e, element) {
	copyToClipboard(e, $(element).attr('title'));
}

function hex2a(hexx) {
	if (hexx == undefined) {
		return undefined;
	}

    let hex = hexx.toString();//force conversion
    let str = '';
    
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    return str;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function checkLinkExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' }); // Use HEAD for minimal data
        return response.ok; // `true` if the status code is 2xx or 3xx
    } catch (error) {
        console.error('Error checking link:', error);
        return false; // If there's an error, assume the link does not exist
    }
}

function hexToBytes(hex) {
	return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

function bytesToString(bytes) {
	return new TextDecoder().decode(bytes);
}

const AddressType = {
	NA: 'N/A',
	Multiple: 'Multiple'
}

function formatTxAddressString(address, formattedAddress = null, walletAddress = null) {	
	//The viewed address reads 'This Address' even when the address book names it
	if (address == walletAddress) {
		formattedAddress = 'This Address';
	} else if (getOwner(address) != undefined) {
		formattedAddress = getOwner(address);
	} else if (formattedAddress == null) {
		formattedAddress = formatAddressString(address, 10);
	}

	let addressString = '<a title="' + address + '" class="address-string" addr="' + address + '" href="' + getWalletAddressUrl(address) + '" >' + formattedAddress + '</a>';
	if (address == AddressType.NA) {
		addressString = '<span class="text-light">' + AddressType.NA + '</span>';
	} else if (address == AddressType.Multiple) {
		addressString = '<span class="text-light" title="This transaction has multiple receiving addresses. Check transaction link for more details.">' + AddressType.Multiple + '</span>';
	}

	// N/A and Multiple are placeholders, not addresses -- offering to copy the word itself is noise
	if (address != AddressType.NA && address != AddressType.Multiple) {
		addressString = '<a title="' + address + '" onclick="copyAddress(event, this)" href="Copy to clipboard!">&#128203;</a> ' + addressString;
	}

	return addressString;
}
