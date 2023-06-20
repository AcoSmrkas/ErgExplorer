$(function() {	
	getPrices(onGotPrices);

    $('#searchType').val('0');
});

function onGotPrices() {
    getProtocolInfo();
    getStats();

    if (gotPrices != undefined && gotPrices) {
    	$('#ergPrice').html('$' + formatValue(prices['ERG'], 2));
	}
}

function getProtocolInfo() {
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergVersion').html(data.version);
	    $('#ergSupply').html(formatErgValueString(data.supply, 0));
	    $('#ergTotal').html(formatErgValueString(97739924000000000, 0)); //+ ' <span class="text-light">' + formatDollarPriceString(97739924000000000) + '</span>'
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
		$('#statsCoinsMined').html('<p class="text-white">' + formatErgValueString(data.blockSummary.totalCoins, 0) + ' <span class="text-light">' + formatAssetDollarPriceString(data.blockSummary.totalCoins, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Transactions summary
		//Number of transactions
		$('#statsNumberOfTransactions').html('<p>' + data.transactionsSummary.total + '</p>');

		//Total transaction fees
		$('#statsTotalTransactionFees').html('<p class="text-white">' + formatErgValueString(data.transactionsSummary.totalFee) + ' <span class="text-light">' + formatAssetDollarPriceString(data.transactionsSummary.totalFee, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Total output volume
		$('#statsTotalOutputVolume').html('<p class="text-white">' + formatErgValueString(data.transactionsSummary.totalOutput) + ' <span class="text-light">' + formatAssetDollarPriceString(data.transactionsSummary.totalOutput, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Mining cost
		//Blocks mined
		$('#statsTotalMinersRevenue').html('<p class="text-white">' + formatErgValueString(data.miningCost.totalMinersRevenue) + ' <span class="text-light">' + formatAssetDollarPriceString(data.miningCost.totalMinersRevenue, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Average mining time
		$('#statsEarnedFromTransactionFees').html('<p>' + data.miningCost.percentEarnedTransactionsFees + '%</p>');

		//Coins mined
		$('#statsOfTransactionVolume').html('<p>' + data.miningCost.percentTransactionVolume + '%</p>');

		//Number of transactions
		$('#statsCostPerTransaction').html('<p class="text-white">' + formatErgValueString(data.miningCost.costPerTransaction) + ' <span class="text-light">' + formatAssetDollarPriceString(data.miningCost.costPerTransaction, ERG_DECIMALS, 'ERG') + '</span></p>');

		//Total transaction fees
		$('#statsDifficulty').html('<p>' + data.miningCost.difficulty + '</p>');

		//Total output volume
		$('#statsHashRate').html('<p>' + formatHashRateString(data.miningCost.hashRate) + '</p>');

		$('#statsHolder').show();
    });;
}