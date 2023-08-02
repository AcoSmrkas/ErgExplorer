$(function() {	
	getPrices(onGotPrices);
	getNetworkState();

    $('#searchType').val('0');
});

function onGotPrices() {
    getProtocolInfo();
    getStats();
	getWhaleTxs();
	getPoolStats();

    if (gotPrices != undefined && gotPrices) {
    	$('#ergPrice').html('$' + formatValue(prices['ERG'], 2));
	}
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

function getPoolStats() {
	// Get the current Unix timestamp in milliseconds
	var currentTimestamp = Date.now();

	// Calculate the timestamp for 24 hours ago (subtracting 24 hours in milliseconds)
	var twentyFourHoursAgoTimestamp = currentTimestamp - (24 * 60 * 60 * 1000);
	$.get('https://api.spectrum.fi/v1/amm/pools/stats?from=' + twentyFourHoursAgoTimestamp,
	function (data) {
		let poolStatsData = data;

		poolStatsData.sort(function (a, b) {
			if (a.volume.value === b.volume.value) return 0;

			return a.volume.value > b.volume.value ? -1 : 1;
		});

		//Volume
		let formattedResult = '';
		let ids = ['ERG'];
		for (let i = 0; i < 10; i++) {
			let poolStat = poolStatsData[i];
			ids.push(poolStat.lockedY.id);

			formattedResult += '<tr>';

			//Token
			formattedResult += '<td><span class="d-lg-none"><strong>Token: </strong></span><a href="' + getTokenUrl(poolStat.lockedY.id) + '">' + getAssetTitleParams(poolStat.lockedY.id, poolStat.lockedY.ticker, true) + '</a></td>';
			
			//Volume
			formattedResult += '<td><span class="d-lg-none"><strong>Volume: </strong></span>$' + formatValue(poolStat.volume.value, 2) + '</td>';

			formattedResult += '</tr>';
		}

		$('#tokensVolumeTableBody').html(formattedResult);

		getPriceHistory();
	});
}

function getPriceHistory() {
	$.post(ERGEXPLORER_API_HOST + 'tokens/getPriceHistory',
	function(data) {
		let lastTimestamp = data.items[data.items.length - 1].timestamp;

		for (var i = data.items.length - 1; i >= 0; i--) {
			let item = data.items[i];
			if (item.timestamp != lastTimestamp) {
				data.items.splice(i, 1);
				continue;
			}

			let oldPrice = item.price;
			let newPrice = prices[item.tokenid];
			if (item.tokenid == '9a06d9e545a41fd51eeffc5e20d818073bf820c635e2a9d922269913e0de369d') {
			}

			let difference = (newPrice * 100 / oldPrice) - 100;
			if (difference === 0) {
				difference = 0.000001;
			}
			difference = toFixed(difference, 2);

			data.items[i].difference = difference;
		}

		data.items = data.items.sort(function (a, b) {
			if (a.difference === b.difference) return 0;

			return parseFloat(a.difference) > parseFloat(b.difference) ? -1 : 1;
		});

		//Erg
		for (let i = 0; i < data.items.length; i++) {
			let item = data.items[i];
			let difference = item.difference;
			let classString = 'text-success';

			if (difference > 0) {
				difference = '+' + difference;
			} else {
				difference = difference;
				classString = 'text-danger';
			}	

			if (item.tokenid == 'ERG') {
				$('#ergPrice').html($('#ergPrice').html() + ' (<span class="' + classString + '">' + difference + '%</span> 24h)');

				data.items.splice(i, 1);

				break;
			}
		}

		//Gainers
		let formattedResult = '';
		let end = 5;
		for (let i = 0; i < end; i++) {
			let item = data.items[i];
			let difference = item.difference;
			let classString = 'text-success';

			if (difference >= 0) {
				difference = '+' + difference;
			} else {
				difference = difference;
				classString = 'text-danger';
			}			

			$('#change-' + item.tokenid).html(difference + '%');
			$('#change-' + item.tokenid).addClass(classString);

			formattedResult += '<tr>';

			//Token
			formattedResult += '<td><span class="d-lg-none"><strong>Token: </strong></span><a href="' + getTokenUrl(item.tokenid) + '">' + getAssetTitleParams(item.tokenid, item.ticker, true) + '</a></td>';
			
			//Price			
			let decimals = 2;
			let temp = prices[item.tokenid].toString().split('.');
			if (temp.length > 1) {
				let realSmall = temp[1].split('-');
				if (realSmall.length > 1) {
					decimals = parseInt(realSmall[1]) + 1;
				} else {
					for (let j = 0; j < temp[1].length; j++) {
						if (temp[1][j] != '0' && j > 2) {
							decimals = j + 2;
							break;
						}
					}
				}
			}

			formattedResult += '<td><span class="d-lg-none"><strong>Price: </strong></span>$' + formatValue(prices[item.tokenid], decimals) + '</td>';

			//Change
			formattedResult += '<td><span class="d-lg-none"><strong>Change: </strong></span><span class="' + classString + '">' + difference + '%</span></td>';

			formattedResult += '</tr>';

			if (i == 4) {
				i = data.items.length - end - 1;
				end = data.items.length;
			}
		}

		$('#tokensGainersTableBody').html (formattedResult);

		$('#tokenView').show();
	});
}

function getWhaleTxs() {
	if (networkType == 'testnet') {
		return;
	}

	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'transactions/getWhaleTxs',
	function(data) {
		let formattedResult = '';
		let items = data.items;

		for (var i = 0; i < items.length; i++) {
			let item = items[i];

			formattedResult += '<tr>';

			//Tx
			formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.txid) + '"><i class="fas fa-link text-info"></i></a></td>';
			
			//Time
			formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(parseInt(item.time)) + '</td>';

			//From
			let fromAddress = item.fromaddress;
			addAddress(fromAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span>' + (fromAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + fromAddress + '" href="' + getWalletAddressUrl(fromAddress) + '" >' + (getOwner(fromAddress) == undefined ? formatAddressString(fromAddress, 10) : getOwner(fromAddress)) + '</a>') + '</td>';
		
			//To
			let toAddress = item.toaddress;
			addAddress(toAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span>' + (toAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + toAddress + '" href="' + getWalletAddressUrl(toAddress) + '" >' + (getOwner(toAddress) == undefined ? formatAddressString(toAddress, 10) : getOwner(toAddress)) + '</a>') + '</td>';

			//Value
			formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span>' + formatAssetValueString(item.value, item.decimals) + ' ' + getAssetTitleParams(item.tokenid, item.ticker, false) + ' <span class="text-light">' + formatDollarPriceString(item.value / Math.pow(10, item.decimals) * prices[item.tokenid]) + '</span></td></tr>';

			formattedResult += '</tr>';
		}

		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();	

		getAddressesInfo();
    });
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
//		$('#statsTotalOutputVolume').html('<p class="text-white">' + formatErgValueString(data.transactionsSummary.totalOutput) + ' <span class="text-light">' + formatAssetDollarPriceString(data.transactionsSummary.totalOutput, ERG_DECIMALS, 'ERG') + '</span></p>');

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