const FEE_ADDRESS = '2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe';
const DONATION_ADDRESS = '9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk';
const LOCALHOST = 'http://localhost:9000';
const IS_DEV_ENVIRONMENT = window.location.host == 'localhost:9000';

$(function() {
	$('#searchInput').val('');
});

function getWalletAddressUrl(address, offset = undefined) {
	let newPage = walletAddressUrl(address);

	if (offset != undefined) {
		newPage += '&offset=' + offset;
	}

	return newPage;
}

function goToWalletAddress(address) {
	window.location.assign(walletAddressUrl(address));
}


function getWalletAddressFromUrl() {
	let addressFromUrl = window.location.href.split('#')[1];

	if (addressFromUrl.includes('offset')) {
		return addressFromUrl.split('&')[0];
	} else {
		return addressFromUrl;
	}
}

function walletAddressUrl(address) {
	let newPage = '';

	if (IS_DEV_ENVIRONMENT) {
		newPage = LOCALHOST + '/addresses#' + address;
	} else {
		newPage = '/addresses/' + address;
	}

	return newPage;
}

function getTransactionAddressUrl(txid) {
	let newPage = transactionAddressUrl(txid);

	return newPage;
}

function transactionAddressUrl(txid) {
	let newPage = '';

	if (IS_DEV_ENVIRONMENT) {
		newPage = LOCALHOST + '/transactions#' + txid;
	} else {
		newPage = '/transactions/' + txid;
	}

	return newPage;
}

function goToTransactionUrl(txid) {
	window.location.assign(transactionAddressUrl(txid));
}

function getHost() {
	let host = window.location.host;
	
	return host;
}

function showToast() {
	const toastLiveExample = document.getElementById('liveToast')
	const toast = new bootstrap.Toast(toastLiveExample)

	toast.show()
}

//Search box
function submitSearch(key) {
	if (key.keyCode != 13) return;

	searchAddress();
}

function searchAddress() {
	let searchQuery = $('#searchInput').val();

	if (searchQuery == '') return;

	switch ($('#searchType').val()) {
		case '0':
			goToWalletAddress(searchQuery);
			break;
		case '1':
			goToTransactionUrl(searchQuery);
			break;

		default:
			break;
	}
}

//Format strings
function formatErgValueString(value, maxDecimals = 4) {
	return '<strong>' + (value / 1000000000).toLocaleString('en-US', { maximumFractionDigits: maxDecimals, minimumFractionDigits: 1 }) + '</strong> ERG';
}

function formatDateString(dateString) {
	const date = new Date(dateString);

	return zeroPad(date.getHours(), 2) + ':' + zeroPad(date.getMinutes(), 2) + ':' + zeroPad(date.getSeconds(), 2) + ', ' + date.toLocaleDateString();
}

function formatKbSizeString(size) {
	return (size / 1000).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' kB';
}

function formatAddressString(address, length) {
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

function formatAssetNameAndValueString(name, valueString) {
	return '<p><strong>' + name + '</strong>: ' + valueString + '</p>';
}

function zeroPad (num, places) {
	return String(num).padStart(places, '0');
}

//Utils
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