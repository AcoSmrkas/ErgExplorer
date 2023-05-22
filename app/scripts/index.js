$(function() {	
    getErgPrice();
    getProtocolInfo();
});

function getProtocolInfo() {
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergVersion').html(data.version);
	    $('#ergSupply').html(formatErgValueString(data.supply));
	    $('#ergHashRate').html(formatHashRateString(data.hashRate));
	    $('#ergTxAvg').html(data.transactionAverage);
	  }
	});

	xhr.open('GET', 'https://api.ergoplatform.com/info');
	xhr.setRequestHeader('content-type', 'application/json');

	xhr.withCredentials = false;

	xhr.send();
}

function getErgPrice() {
	const data = JSON.stringify({
		'currency': 'USD',
		'code': 'ERG',
		'meta': false
	});

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergPrice').html(formatDollarValueString(data.rate));
	  }
	});

	xhr.open('POST', 'https://api.livecoinwatch.com/coins/single');
	xhr.setRequestHeader('content-type', 'application/json');
	xhr.setRequestHeader('x-api-key', '85ec3258-17d5-417f-b5d3-295dee1e5ee4');

	xhr.withCredentials = false;

	xhr.send(data);
}