$(function() {	
    getErgPrice();
    getProtocolInfo();
    getStats();
});

function getProtocolInfo() {
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergVersion').html(data.version);
	    $('#ergSupply').html(formatErgValueString(data.supply, 0));
	    $('#ergTotal').html(formatErgValueString(97739924000000000, 0));
	    $('#ergHashRate').html(formatHashRateString(data.hashRate));
	    $('#ergTxAvg').html(data.transactionAverage);
	  }
	});

	xhr.open('GET', 'https://api.ergoplatform.com/info');
	xhr.setRequestHeader('content-type', 'application/json');

	xhr.withCredentials = false;

	xhr.send();
}

function getStats() {
	var jqxhr = $.get('https://api.ergoplatform.com/stats', function(data) {
		
		//Blocks summary
		//Blocks mined
		$('#statsBlocksMined').html('<p>' + data.blockSummary.total + '</p>');

		//Average mining time
		$('#statsAverageMiningTime').html('<p>' + millisToMinutesAndSeconds(data.blockSummary.averageMiningTime) + '</p>');

		//Coins mined
		$('#statsCoinsMined').html('<p>' + formatErgValueString(data.blockSummary.totalCoins, 0) + '</p>');

		//Transactions summary
		//Number of transactions
		$('#statsNumberOfTransactions').html('<p>' + data.transactionsSummary.total + '</p>');

		//Total transaction fees
		$('#statsTotalTransactionFees').html('<p>' + formatErgValueString(data.transactionsSummary.totalFee) + '</p>');

		//Total output volume
		$('#statsTotalOutputVolume').html('<p>' + formatErgValueString(data.transactionsSummary.totalOutput) + '</p>');

		//Mining cost
		//Blocks mined
		$('#statsTotalMinersRevenue').html('<p>' + formatErgValueString(data.miningCost.totalMinersRevenue) + '</p>');

		//Average mining time
		$('#statsEarnedFromTransactionFees').html('<p>' + data.miningCost.percentEarnedTransactionsFees + '%</p>');

		//Coins mined
		$('#statsOfTransactionVolume').html('<p>' + data.miningCost.percentTransactionVolume + '%</p>');

		//Number of transactions
		$('#statsCostPerTransaction').html('<p>' + formatErgValueString(data.miningCost.costPerTransaction) + '</p>');

		//Total transaction fees
		$('#statsDifficulty').html('<p>' + data.miningCost.difficulty + '</p>');

		//Total output volume
		$('#statsHashRate').html('<p>' + formatHashRateString(data.miningCost.hashRate) + '</p>');

		$('#statsHolder').show();
    });;
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