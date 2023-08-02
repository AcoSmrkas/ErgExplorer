var qrCode = null;
var networkType = 'mainnet';
var addresses = new Array();
var addressbook = new Array();

setupMainnetTestnet();

$(function() {
	$('#searchInput').val('');

	setOfficialLink();

	if (IS_DEV_ENVIRONMENT) {
		ERGEXPLORER_API_HOST = 'https://localhost/ergexplorer-api/'
	}

	if (window.location.host == 'dev.ergexplorer.com') {
		ERGEXPLORER_API_HOST = 'https://devapi.ergexplorer.com/';
	}
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
		params['query'] = query;
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

function searchAddress() {
	let searchQuery = $('#searchInput').val().trim();
	let searchType = $('#searchType').val();

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

		default:
			break;
	}
}

//Format strings
function formatErgValueString(value, maxDecimals = 4) {
    let ergValue = value / 1000000000;

    if (ergValue > 10) {
            maxDecimals = 2;
    }

    let minimumFractionDigits = 2;
    if (maxDecimals < minimumFractionDigits) {
            minimumFractionDigits= maxDecimals;
    }

	return '<strong title="' + ergValue + '"><span class="text-white">' + ergValue.toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: minimumFractionDigits }) + '</span></strong> ERG';
}

function formatTimeString(dateString, seconds) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + (seconds ? ':' + zeroPad(date.getSeconds(), 2) : '');
}

function formatDateString(dateString) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + ':' + zeroPad(date.getSeconds(), 2) + ', ' + date.toLocaleDateString();
}

function formatKbSizeString(size) {
	return (size / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' kB';
}

function formatAddressString(address, length = 15) {
	return address.substring(0, length) + '...' + address.substring(address.length - 4);
}

function formatHashRateString(value) {
	return (value / 1000000000000).toLocaleString('en-US') + ' TH/s'
}

function formatValue(value, digits, autodigits = false) {
	if (autodigits) {
		let temp = value.toString().split('.');
		if (temp.length > 1) {
			let realSmall = temp[1].split('-');
			if (realSmall.length > 1) {
				digits = parseInt(realSmall[1]) + 1;
			} else {
				for (let j = 0; j < temp[1].length; j++) {
					if (temp[1][j] != '0' && j > 1) {
						digits = j + 2;
						break;
					}
				}
			}
		}
	}

	return '<span title="' + value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 2 }) + '">' + nFormatter(value, digits) + '</span>';
}

function formatAssetValueString(value, decimals, digits = 2) {
	let assetValue = getAssetValue(value, decimals);

	if (assetValue > 0.1) {
		digits = 2;
	}

	return formatValue(assetValue, digits);
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
	if (gotPrices == undefined || !gotPrices) {
		return '';
	}

	if (value >= 0.1) {
		digits = 2;
	}

	return '($' + formatValue(value, digits) + ')';
}

function formatAssetDollarPrice(tokenAmount, tokenDecimals, tokenId) {
	if (gotPrices == undefined || !gotPrices || prices[tokenId] == undefined) {
		return -1;
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
		description = description.replaceAll('<br><br>','<br>');

		return description;
	}
}

function parseNftJson(jsonObject, result, indent) {
	let keys = Object.keys(jsonObject);
	let values = Object.values(jsonObject);

	for (let i = 0; i < keys.length; i++) {
		if (typeof values[i] === 'object') {
			result += formatNftDescriptonJson(keys[i], '', indent) + '<br>';
			result = parseNftJson(values[i], result, indent + 1);
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

function getAssetTitle(asset, iconIsToTheLeft) {
	return getAssetTitleParams(asset.tokenId, asset.name, iconIsToTheLeft);
}

function getAssetTitleParams(tokenId, name, iconIsToTheLeft) {
	let imgSrc = '';
	if (hasIcon(tokenId)) {
		imgSrc = getIcon(tokenId);
	}

	//$BASS
	if (tokenId == 'ba553573f83c61be880d79db0f4068177fa75ab7c250ce3543f7e7aeb471a9d2') {
		imgSrc = 'images/tokens/ba553573f83c61be880d79db0f4068177fa75ab7c250ce3543f7e7aeb471a9d2.png';
	}

	//GreasyCEX
	if (tokenId == 'd1d2ae2ac0456aa43550dd4fda45e4f866d523be9170d3a3e4cab43a83926334') {
		imgSrc = 'https://ergcube.com/uploads/posts/2023-04/gcel1-sp.png';
	}

	//Peperg
	if (tokenId == '91289d5cefb9d78e3ea248d4e9c5b0e3c3de54f64bfae85c0070580961995262') {
		imgSrc = 'https://raw.githubusercontent.com/spectrum-finance/token-logos/master/logos/ergo/91289d5cefb9d78e3ea248d4e9c5b0e3c3de54f64bfae85c0070580961995262.svg';
	}

	if (tokenId == '00bd762484086cf560d3127eb53f0769d76244d9737636b2699d55c56cd470bf') {
		imgSrc = 'https://www.tabbylab.io/upload/tabbyposlogo.png';
	}

	if (tokenId == '00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3') {
		imgSrc = 'https://i.ibb.co/rM43NVy/EGIO.png';
	}

	//Walrus
	if (tokenId == '59ee24951ce668f0ed32bdb2e2e5731b6c36128748a3b23c28407c5f8ccbf0f6') {
		imgSrc = 'https://gateway.pinata.cloud/ipfs/QmZkB935jDaHrBnCtzSAiX8zgt9LaxGcLtLSQfYs2tCqbB';
	}

	let iconHtml = '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="' + imgSrc + '"/>';

	if (tokenId == 'ERG') {
		return name;
	}

	return '<a href="' + getTokenUrl(tokenId) + '">' + (iconIsToTheLeft ? iconHtml + ' ' : '') + ((name == '' || name == null) ? formatAddressString(tokenId, 15) : name) + (iconIsToTheLeft ? '' : ' ' + iconHtml) + '</a>';
}

function getAssetValue(amount, decimals) {
	return amount / Math.pow(10, decimals);
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
		$('#networkType').html('Testnet')
		$('#networkType').removeClass('text-light');
		$('#networkType').addClass('erg-span-important');
		localStorage.setItem('network', 'testnet');
		API_HOST = API_HOST_2 = 'https://api-testnet.ergoplatform.com/';
		FEE_ADDRESS = 'Bf1X9JgQTUtgntaer91B24n6kP8L2kqEiQqNf1z97BKo9UbnW3WRP9VXu8BXd1LsYCiYbHJEdWKxkF5YNx5n7m31wsDjbEuB3B13ZMDVBWkepGmWfGa71otpFViHDCuvbw1uNicAQnfuWfnj8fbCa4';
	} else {
		$('#networkType').html('Mainnet')
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

function formatInputsOutputs(data) {
	let formattedData = '';

	for (let i = 0; i < data.length; i++) {
		formattedData += '<div class="row div-cell border-flat">';
		
		//Address
		addAddress(data[i].address);
		formattedData += '<div class="col-9"><span><strong>Address: </strong></span><a class="address-string" addr="' + data[i].address + '" href="' + getWalletAddressUrl(data[i].address) + '" >' + formatAddressString(data[i].address, 15) + '</a></div>';

		//Status
		formattedData += '<div class="col-3 d-flex justify-content-end">' + (data[i].spentTransactionId == undefined ? '' : data[i].spentTransactionId == null ? '<span class="text-danger">Unspent' : '<span class="text-success">Spent') + '</span></div>';

		//Value
		formattedData += '<div style="padding-bottom:10px;" class="col-10"><span><strong>Value: </strong></span><span class="">' + formatErgValueString(data[i].value, 5) + ' <span class="text-light">' + formatAssetDollarPriceString(data[i].value, ERG_DECIMALS, 'ERG') + '</span></span></div>';
		
		//Output transaction
		if (data[i].outputTransactionId != undefined) {
			formattedData += '<div class="col-2 d-flex justify-content-end"><a href="' + getTransactionsUrl(data[i].outputTransactionId) + '" >Output</a></div>';
		}
	
		//Assets
		if (data[i].assets != undefined && data[i].assets.length > 0 ) {
			formattedData += '<h5><strong>Tokens:</strong></h5>';
			for (let j = 0; j < data[i].assets.length; j++) {
				let asset = data[i].assets[j];
				let assetPrice = formatAssetDollarPrice(asset.amount, asset.decimals, asset.tokenId);
				formattedData += '<p><strong>' + getAssetTitle(asset, true) + '</strong>: <span class="text-white">' + formatAssetValueString(asset.amount, asset.decimals, 4) + ' ' + (assetPrice == -1 ? '' : '<span class="text-light">' + formatDollarPriceString(assetPrice) + '</span>') + '</span></p>';
			}
		}

		formattedData += '</div>';
	}

	return formattedData;
}

function showLoadError(message) {
	$('#loadErrorMessage').html(message);
	$('#loadError').show();
}

function showToast() {
	const toastLiveExample = document.getElementById('liveToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function showNotificationPermissionToast() {
	const toastLiveExample = document.getElementById('notificationToast');
	const toast = new bootstrap.Toast(toastLiveExample);

	toast.show();
}

function hideNotificationPermissionToast() {
	$('#notificationToast').fadeOut(200);
}

function requestNotificationPermission(action) {
	Notification.requestPermission((result) => {
		action();
	});
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

function nFormatter(num, digits) {
	const lookup = [
		{ value: 1, symbol: '' },
	//	{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'B' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' }
	];

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
	
	return item ? (num / item.value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits }).replace(rx, '$1') + item.symbol : num.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: minimumFractionDigits });
}

function sortTokens(tokens) {
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
	} else {
		theme = 'dark';
	}

	$('html').attr('data-bs-theme', theme);

	localStorage.setItem('theme', theme);

	updateTheme();
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

		$('.address-string').each(function(index) {
			$(this).html(getOwner($(this).attr('addr')));
		});
	});
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
				owner += ' (' + addressbook[i]['address'].substr(-4) + ')';
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