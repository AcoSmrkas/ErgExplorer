var prices = new Array();
var gotPrices = false;

function getPrices(callback) {
	var jqxhr = $.get('https://api.spectrum.fi/v1/price-tracking/markets',
	function(data) {
		for (let i = 0; i < data.length; i++) {
			if (data[i]['baseSymbol'] == 'ERG' && data[i]['quoteSymbol'] == 'SigUSD') {
				prices['ERG'] = data[i]['lastPrice'];
				break;
			}
		}

		for (let i = 0; i < data.length; i++) {
			if (data[i]['baseSymbol'] == 'ERG') {
				if (prices[data[i]['quoteId']] != undefined) continue;

				prices[data[i]['quoteId']] = prices['ERG'] / data[i]['lastPrice'];
			}
		}

		gotPrices = true;
	}).always(function () {
		callback()
	});
}