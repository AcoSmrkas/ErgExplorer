var prices = new Array();
var pricesNames = new Array();
var gotPrices = false;

function getPrices(callback) {
	var jqxhr = $.get('https://api.spectrum.fi/v1/price-tracking/markets',
	function(data) {
		for (let i = 0; i < data.length; i++) {
			if (data[i]['baseSymbol'] == 'ERG' && data[i]['quoteSymbol'] == 'SigUSD') {
				prices['ERG'] = data[i]['lastPrice'];
				pricesNames['ERG'] = 'ERG';
				break;
			}
		}

		for (let i = 0; i < data.length; i++) {
			if (data[i]['baseSymbol'] == 'ERG') {
				if (prices[data[i]['quoteId']] != undefined) continue;

				let price = prices['ERG'] / data[i]['lastPrice'];
				prices[data[i]['quoteId']] = price;
				pricesNames[data[i]['quoteSymbol']] = price;
			}
		}

		$.get('https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd', function (data) {
			prices['ERG'] = data.ergo.usd;
			pricesNames['ERG'] = 'ERG';
		}).always(function () {
			callback();
		});

		gotPrices = true;
	}).fail(function () {
		callback();
	});
}