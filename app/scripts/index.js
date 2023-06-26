$(function() {	
	getPrices(onGotPrices);
	getNetworkState();

    $('#searchType').val('0');
});

function onGotPrices() {
    getProtocolInfo();
    getStats();

    if (gotPrices != undefined && gotPrices) {
    	$('#ergPrice').html('$' + formatValue(prices['ERG'], 2));
	}

	setupTicker();
}

function getNetworkState() {
	let networkStateUrl = 'https://api.ergoplatform.com/api/v1/networkState';

	if (networkType == 'testnet') {
		networkStateUrl = 'https://api-testnet.ergoplatform.com/api/v1/networkState'
	}

	var jqxhr = $.get(networkStateUrl, function(data) {
		$('#blockHeight').html(data.height.toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 }));
		$('#totalTransactions').html(data.maxTxGix.toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 }));
	});
}

function setupTicker() {
	if (networkType == 'testnet') {
		$('#txHolder').remove();
		return;
	}

	let tickerMessages = new Array();
	let tickerIds = ['ERG',
		'03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04',
		'003bd19d0187117f130b62e1bcab0939929ff5c7709f843c5c4dd158949285d0',
		'9a06d9e545a41fd51eeffc5e20d818073bf820c635e2a9d922269913e0de369d',
		'd71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413',
		'1fd6e032e8476c4aa54c18c1a308dce83940e8f4a28f576440513ed7326ad489',
		'007fd64d1ee54d78dd269c8930a38286caa28d3f29d27cadcb796418ab15c283',
		'089990451bb430f05a85f4ef3bcb6ebf852b3d6ee68d86d78658b9ccef20074f',
		'00bd762484086cf560d3127eb53f0769d76244d9737636b2699d55c56cd470bf',
		'02f31739e2e4937bb9afb552943753d1e3e9cdd1a5e5661949cb0cef93f907ea',
		'18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d',
		'01dce8a5632d19799950ff90bca3b5d0ca3ebfa8aaafd06f0cc6dd1e97150e7f',
		'94180232cc0d91447178a0a995e2c14c57fbf03b06d5d87d5f79226094f52ffc',
//		'0f604d3d5e20d6ea5bc1eee9117230f8679fc36603468c79c8246df462893ae7',
//		'3e0b62c7bc36bc7abf2bf76303722c31788aa579d771e427a0b2c8357da160ba',
		'0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b',
		'36aba4b4a97b65be491cf9f5ca57b5408b0da8d0194f30ec8330d1e8946161c1',
		'5a34d53ca483924b9a6aa0c771f11888881b516a8d1a9cdc535d063fe26d065e',
		'fbbaac7337d051c10fc3da0ccb864f4d32d40027551e1c3ea3ce361f39b91e40',
		'0779ec04f2fae64e87418a1ad917639d4668f78484f45df962b0dec14a2591d2',
//		'0d9ef46408f11aed2a7f840d3928baefaf8153032f42296cbe9d640845d4082c',
		'e91cbc48016eb390f8f872aa2962772863e2e840708517d1ab85e57451f91bed',
//		'f35cc232da3e1d4fd0bf84da9908f6de5ed4f3d57a649629ffaf3fc0e858a3e5',
//		'9dbc8dd9d7ea75e38ef43cf3c0ffde2c55fd74d58ac7fc0489ec8ffee082991b',
		'3405d8f709a19479839597f9a22a7553bdfc1a590a427572787d7c44a88b6386',
		'185e217d80d797800bfa699afda708ee101ae664f8ea237d9fc3a3824b7c3ecb',
		'c0f315e4adcb1463ca27988cb1d61668a539a5dd516f996f1f576567fbb0b158',
//		'151f9e9e0cb4aca29b8c8eaa765661c9f6cb4e018131b09bc63680e3e2585576',
		'472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8',
		'00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3',
		'fcfca7654fb0da57ecf9a3f489bcbeb1d43b56dce7e73b352f7bc6f2561d2a1b'];
//		'6de6f46e5c3eca524d938d822e444b924dbffbe02e5d34bd9dcd4bbfe9e85940',

	let keys = Object.keys(prices);
	for (var i = 0; i < tickerIds.length; i++) {
		let imgId = tickerIds[i];
		let url = getTokenUrl(tickerIds[i]);

		if (tickerIds[i] == 'ERG') {
			imgId = '0000000000000000000000000000000000000000000000000000000000000000';
			url = 'https://coinmarketcap.com/currencies/ergo/';
		}

		let digits = 6;
		if (prices[tickerIds[i]] > 0.1) {
			digits = 2;
		}

		tickerMessages.push({
			id: 'msg' + i,
			content: '<a href="' + url + '"><img class="ticker-img" src="https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/' + imgId + '.svg"> <span>$' + formatValue(prices[tickerIds[i]], digits) + '</span></a>'
		});
	}

	var qtx = Telex.widget('tx',
		{
			pauseOnHover: true,
			speed: 80
		}, tickerMessages);
}

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

    	$('#marketCap').html('$' + (prices['ERG'] * getAssetValue(data.supply, ERG_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
	  }
	});

	xhr.open('GET', 'https://api.ergoplatform.com/info');
	xhr.setRequestHeader('content-type', 'application/json');

	xhr.withCredentials = false;

	xhr.send();
}

function getStats() {
	let statsUrl = 'https://api.ergoplatform.com/stats';

	if (networkType == 'testnet') {
		statsUrl = 'https://api-testnet.ergoplatform.com/stats';
	}

	var jqxhr = $.get(statsUrl, function(data) {
		
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
    });
}