var prices = new Array();
var pricesNames = new Array();
var gotPrices = false;
var callbackCalled = false;
var theCallback = undefined;
var pricesData = undefined;
var poolsData = undefined;

function getPrices(callback, force = false) {
	theCallback = callback;

	$.get('https://api.ergexplorer.com/tokens/getErgPrice', function (data) {
		erg24hDiff = data.items[0].difference;
		prices['ERG'] = data.items[0].value;
		pricesNames['ERG'] = 'ERG';

		$.ajax({
			url: 'https://api.cruxfinance.io/spectrum/token_list',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				sort_by: 'Volume',
				sort_order: 'Desc',
				limit: 500,
				offset: 0,
				filter_window: 'Day',
				name_filter: ''
			}),
			success: function(response) {
				pricesData = response;

				handlePrices(force);
			},
			error: function(xhr, status, error) {
				doCallback();
			}
		});
	}).fail(function () {
		doCallback();
	});
}

function handlePrices(force = false) {
	if (pricesData == undefined) {
		return;
	}

	for (let i = 0; i < pricesData.length; i++) {
		let tokenData = pricesData[i];

		if (prices[tokenData['id']] != undefined) continue;

		let skip = true;

		if ((tokenData.liquidity >= 2000 || force)) {
			skip = false;
		}
			
		if (skip) continue;
		
		let price = prices['ERG'] * tokenData['price_erg'];
		prices[tokenData['id']] = price;
		pricesNames[tokenData['ticker']] = price;
	}
	
	gotPrices = true;
	
	doCallback();
}

function doCallback() {
	if (callbackCalled) {
		return;
	}

	theCallback();
}