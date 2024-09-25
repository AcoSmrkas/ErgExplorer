var prices = new Array();
var pricesNames = new Array();
var gotPrices = false;
var callbackCalled = false;
var theCallback = undefined;
var pricesData = undefined;
var poolsData = undefined;

function getPrices(callback) {
	theCallback = callback;

	$.get('https://api.ergexplorer.com/tokens/getErgPrice', function (data) {
		erg24hDiff = data.items[0].difference;
		prices['ERG'] = data.items[0].value;
		pricesNames['ERG'] = 'ERG';

		$.get('https://api.spectrum.fi/v1/price-tracking/markets',
		function(data) {
			pricesData = data;

			handlePrices();
		}).fail(function () {
			doCallback();
		});

		$.get('https://api.spectrum.fi/v1/amm/pools/stats',
		function(data) {
			poolsData = data;

			handlePrices();
		}).fail(function () {
			doCallback();
		});
	}).fail(function () {
		doCallback();
	});
}

function handlePrices() {
	if (poolsData == undefined || pricesData == undefined) {
		return;
	}

	for (let i = 0; i < pricesData.length; i++) {
		let pairData = pricesData[i];
		if (pairData['baseSymbol'] == 'ERG') {
			if (prices[pairData['quoteId']] != undefined) continue;

			let skip = true;
			for (let j = 0; j < poolsData.length; j++) {
				let poolData = poolsData[j];

				if (poolData.lockedX.id == pairData['baseId']
					&& poolData.lockedY.id == pairData['quoteId']
					&& poolData.lockedX.amount / Math.pow(10, 9) >= 1000) {
					skip = false;
					break;
				}
			}
			if (skip) continue;
			
			let price = prices['ERG'] / pairData['lastPrice'];
			prices[pairData['quoteId']] = price;
			pricesNames[pairData['quoteSymbol']] = price;
		}
	}
	
	gotPrices = true;
	console.log(prices);
	doCallback();
}

function doCallback() {
	if (callbackCalled) {
		return;
	}

	theCallback();
}