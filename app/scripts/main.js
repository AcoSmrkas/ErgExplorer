const FEE_ADDRESS = '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';
const DONATION_ADDRESS = '9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk';
const API_HOST = 'https://api.ergoplatform.com/api/v1/';
const IS_DEV_ENVIRONMENT = window.location.host == 'localhost:9000';

var qrCode = null;

$(function() {
	$('#searchInput').val('');

	let searchType = localStorage.getItem('searchType');

	if (searchType != undefined) {
		$('#searchType').val(searchType);
	}
});

window.addEventListener('hashchange', () => {
		if (IS_DEV_ENVIRONMENT) {
			window.location.reload();
		}
	}, false
);

function setDocumentTitle(text) {
	document.title = 'Erg Explorer (Alpha) - ' + text;
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
	let url = '';

	if (IS_DEV_ENVIRONMENT) {
		url = '/issued-tokens#query=' + query;
	} else {
		url = '/issued-tokens/query=' + query;
	}

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

	if (searchQuery == '') return;

	localStorage.setItem('searchType', $('#searchType').val());

	switch ($('#searchType').val()) {
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
	let minimumFractionDigits = 2;
	if (maxDecimals < minimumFractionDigits) {
		minimumFractionDigits= maxDecimals;
	}

	return '<strong>' + (value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: minimumFractionDigits }) + '</strong> ERG';

	// icon, looks fugly, will hold
	// ' + '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/0000000000000000000000000000000000000000000000000000000000000000.svg"/>';
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

function formatDollarValueString(value) {
	return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 1 });
}

function formatValue(value, decimals) {
	return '<span title="' + value.toLocaleString('en-US', { maximumFractionDigits: 4, minimumFractionDigits: 2 }) + '">' + nFormatter(value, decimals) + '</span>';
}

function formatAssetValueString(value, decimals, digits = 2) {
	return formatValue(value / Math.pow(10, decimals), digits);
}

function formatAssetNameAndValueString(name, valueString, tokenId) {
	return '<p><strong>' + name + '</strong>: ' + valueString + '</p>';
}

function formatNftDescription(description) {
	if (isJson(description)) {
		const jsonString = JSON.stringify(JSON.parse(description), null, '<br>');
		let result = jsonString.replace(/[{}"]/g, '');
		result = result.replaceAll(',\n', '');

		do {
			result = result.replaceAll('<br><br>', '<br>');
		} while (result.includes('<br><br>'));

		while (result.substring(result.length - 4) == '<br>') {
			result = result.substring(0, result.length - 4);
		}

		while (result.substring(result.length - 5) == '<br>\n') {
			result = result.substring(0, result.length - 5);
		}

		while (result.substring(0, 5) == '\n<br>') {
			result = result.substring(5);
		}

		while (result.substring(0, 4) == '<br>') {
			result = result.substring(4);
		}

		return result;
	} else {
		return description;
	}
}

function getAssetTitle(asset, iconIsToTheLeft) {
	let imgSrc = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/' + asset.tokenId + '.svg';

	if (asset.tokenId == 'ba553573f83c61be880d79db0f4068177fa75ab7c250ce3543f7e7aeb471a9d2') {
		imgSrc = 'https://cloudflare-ipfs.com/ipfs/bafybeifjq7aaleq2eg4o4vhqsg2zjow6pkbb3upb7vpz6g24r777ikh5ua';
	}

	let iconHtml = '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="' + imgSrc + '"/>';

	return '<a href="' + getTokenUrl(asset.tokenId) + '">' + (iconIsToTheLeft ? iconHtml + ' ' : '') + ((asset.name == '' || asset.name == null) ? formatAddressString(asset.tokenId, 15) : asset.name) + (iconIsToTheLeft ? '' : ' ' + iconHtml) + '</a>';
}

function onTokenIconLoad(element) {
	$(element).show();
}

function zeroPad (num, places) {
	return String(num).padStart(places, '0');
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
			width: 256,
			height: 256,
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
		formattedData += '<div class="row div-cell">';
		
		//Address
		formattedData += '<div class="col-9"><span><strong>Address: </strong></span><a href="' + getWalletAddressUrl(data[i].address) + '" >' + formatAddressString(data[i].address, 15) + '</a></div>';

		//Status
		formattedData += '<div class="col-3 d-flex justify-content-end">' + (data[i].spentTransactionId == null ? '<span class="text-danger">Unspent' : '<span class="text-success">Spent') + '</span></div>';

		//Value
		formattedData += '<div style="padding-bottom:10px;" class="col-10"><span><strong>Value: </strong></span><span class="gray-color">' + formatErgValueString(data[i].value, 5) + '</span></div>';
		
		//Output transaction
		if (data[i].outputTransactionId != undefined) {
			formattedData += '<div class="col-2 d-flex justify-content-end"><a href="' + getTransactionsUrl(data[i].outputTransactionId) + '" >Output</a></div>';
		}
	
		//Assets
		if (data[i].assets != undefined && data[i].assets.length > 0 ) {
			formattedData += '<h5><strong>Tokens:</strong></h5>';
			for (let j = 0; j < data[i].assets.length; j++) {
				formattedData += '<p><strong>' + getAssetTitle(data[i].assets[j], true) + '</strong>: ' + formatAssetValueString(data[i].assets[j].amount, data[i].assets[j].decimals) + '</p>';
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
	const toastLiveExample = document.getElementById('liveToast')
	const toast = new bootstrap.Toast(toastLiveExample)

	toast.show()
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

function nFormatter(num, digits) {
	const lookup = [
		{ value: 1, symbol: '' },
	//	{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'G' },
		{ value: 1e12, symbol: 'T' },
		{ value: 1e15, symbol: 'P' },
		{ value: 1e18, symbol: 'E' }
	];

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
		return a.amount / Math.pow(10, a.decimals) < b.amount / Math.pow(10, b.decimals);
	});

	let tempArray = new Array();
	for (let i = 0; i < tokensArray.length; i++) {
		if (tokensArray[i].amount > 1000000000000) {
			tempArray.push(tokensArray[i]);
		}
	}

	for (let i = 0; i < tempArray.length; i++) {
		tokensArray.shift();
		tokensArray.push(tempArray[i]);
	}

	return tokensArray
}