const FEE_ADDRESS = '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';
const DONATION_ADDRESS = '9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk';
const IS_DEV_ENVIRONMENT = window.location.host == 'localhost:9000';

var qrCode = null;

$(function() {
	$('#searchInput').val('');
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
	let searchQuery = $('#searchInput').val();

	if (searchQuery == '') return;

	switch ($('#searchType').val()) {
		case '0':
			goToWalletAddressUrl(searchQuery);
			break;
		case '1':
			goToTransactionUrl(searchQuery);
			break;
		case '2':
			goToTokenUrl(searchQuery);
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
	return '<strong>' + (value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: 1 }) + '</strong> ERG';

	// icon, looks fugly, will hold
	// ' + '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/0000000000000000000000000000000000000000000000000000000000000000.svg"/>';
}

function formatValue(value) {
	return value.toLocaleString('en-US');
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

function formatAssetValueString(value, decimals) {
	return (value / Math.pow(10, decimals)).toLocaleString('en-US', { maximumFractionDigits: 3, minimumFractionDigits: 2 });
}

function formatAssetNameAndValueString(name, valueString, tokenId) {
	return '<p><strong>' + name + '</strong>: ' + valueString + '</p>';
}

function getAssetTitle(asset, iconIsToTheLeft) {
	let iconHtml = '<img style="display: none;" onload="onTokenIconLoad(this)"  class="token-icon" src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/' + asset.tokenId + '.svg"/>';

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