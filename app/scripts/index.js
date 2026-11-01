var nowTime = Date.now();
var from24h = nowTime - (24 * 60 * 60 * 1000);
var from7d = nowTime - (7 * 24 * 60 * 60 * 1000);
var from30d = nowTime - (30 * 24 * 60 * 60 * 1000);
var priceData = undefined;

$(function() {
	getTokenIcons();
	updatePrices();
	getNetworkState();
});

function updatePrices() {
	getPrices(onGotPrices);
	getErgPrice();

	setTimeout(updatePrices, 60000 * 5);
}

function getErgPrice() {
	$.get('https://api.ergexplorer.com/tokens/getErgPrice', function (data) {
		let difference = parseFloat(data.items[0].difference);
		let classString = 'text-success';
		if (difference < 0) {
			classString = 'text-danger';
		}

		let ergPriceHtml = '$' + formatValue(parseFloat(data.items[0].value), 2);
		setCountUpHtml('#ergPrice', ergPriceHtml + ' (<span class="' + classString + '">' + formatValue(difference, 2) + '%</span> 24h)');
	});
}

function onGotPrices() {
    getProtocolInfo();
    getStats();
	getWhaleTxs();
	getPoolStats();	
	getPriceHistory();
}

function getNetworkState() {
	let networkStateUrl = 'https://api.ergoplatform.com/api/v1/networkState';

	if (networkType == 'testnet') {
		networkStateUrl = 'https://api-testnet.ergoplatform.com/api/v1/networkState'
	}

	var jqxhr = $.get(networkStateUrl, function(data) {
		setCountUpHtml('#blockHeight', data.height.toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 }));
	});
}

function getPoolStats() {
	$.get('https://api2.mewfinance.com/dex/getTop10Volume',
	function (data) {
		let poolStatsData = data.items;

		//Volume
		let formattedResult = '';

		for (let i = 0; i < poolStatsData.length; i++) {
			let poolStat = poolStatsData[i];

			formattedResult += '<tr>';

			//Token
			formattedResult += '<td><a href="' + getTokenUrl(poolStat.asset) + '">' + getAssetTitleParams(null, poolStat.asset, poolStat.name, true) + '</a></td>';
			
			//Volume
			formattedResult += '<td>$' + formatValue(poolStat.total_usd, 2) + '</td>';

			formattedResult += '</tr>';
		}

		$('#tokensVolumeTableBody').html(formattedResult);
	});
}

function getPriceHistory() {
	$.post('https://api2.ergexplorer.com/tokens/getPriceHistory?cache',
		{
			'from': nowTime,
			'milestones': 'true',
			'period': '30d'
		},
	function(data) {
		priceData = data;

		handleCachedTimeframes(data);

		printGainersLosers(from24h);
	}).fail(function (data) {
		$('#tokenLoading').hide();
	});
}

function printGainersLosers30d() {
	printGainersLosers(from30d);
	$('#showGainersLosers30d').removeClass('btn-primary');
	$('#showGainersLosers30d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
}

function printGainersLosers7d() {
	printGainersLosers(from7d);
	$('#showGainersLosers7d').removeClass('btn-primary');
	$('#showGainersLosers7d').addClass('btn-info');
	$('#showGainersLosers24h').removeClass('btn-info');
	$('#showGainersLosers24h').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function printGainersLosers24h() {
	printGainersLosers(from24h);
	$('#showGainersLosers24h').removeClass('btn-primary');
	$('#showGainersLosers24h').addClass('btn-info');
	$('#showGainersLosers7d').removeClass('btn-info');
	$('#showGainersLosers7d').addClass('btn-primary');
	$('#showGainersLosers30d').removeClass('btn-info');
	$('#showGainersLosers30d').addClass('btn-primary');
}

function handleCachedTimeframes(data) {
	let hasLastTimestamp = false;
	for (let i = 0; i < data.items.length; i++) {
		if (data.items[i].originaltimestamp == from24h) {
			hasLastTimestamp = true;
			break;
		}
	}

	if (!hasLastTimestamp) {
		from24h = data.items[0].originaltimestamp;

		nowTime = from24h + (24 * 60 * 60 * 1000)
		from7d = nowTime - (7 * 24 * 60 * 60 * 1000);
		from30d = nowTime - (30 * 24 * 60 * 60 * 1000);
	}
}

function printGainersLosers(timeframe) {
	let data = JSON.parse(JSON.stringify(priceData));

	let lastTimestamp = timeframe;	
	console.log(lastTimestamp);

	for (var i = data.items.length - 1; i >= 0; i--) {
		let item = data.items[i];
		if (item.originaltimestamp != lastTimestamp
			|| item.ticker == 'ERG') {
			data.items.splice(i, 1);
			continue;
		}

		let oldPrice = item.price;
		let newPrice = prices[item.tokenid];

		if (newPrice == undefined) {
			data.items.splice(i, 1);
			continue;
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
		formattedResult += '<td><a href="' + getTokenUrl(item.tokenid) + '">' + getAssetTitleParams(item, item.tokenid, item.ticker, true) + '</a></td>';
		
		//Price			
		let decimals = getDecimals(prices[item.tokenid]);
		
		formattedResult += '<td>$' + formatValue(prices[item.tokenid], decimals) + '</td>';

		//Change
		formattedResult += '<td><span class="' + classString + '">' + difference + '%</span></td>';

		formattedResult += '</tr>';

		if (i == 4) {
			i = data.items.length - end - 1;
			end = data.items.length;
		}
	}

	$('#tokensGainersTableBody').html (formattedResult);

	$('#tokenView').show();
	$('#tokenLoading').hide();
}

function getWhaleTxs() {
	if (networkType == 'testnet') {
		return;
	}

	fetch(ERGEXPLORER_API_HOST + 'transactions/getWhaleTxs') // Replace with your URL
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.arrayBuffer(); // Convert the response to an ArrayBuffer
    })
    .then(arrayBuffer => {
        // Handle the ArrayBuffer here
        const buffer = new TextDecoder("utf-8").decode(arrayBuffer);
        const stringFromBuffer = buffer.toString('utf8');

        let data = JSONbig.parse(stringFromBuffer);
        let formattedResult = '';
		let items = data.items;

		for (var i = 0; i < items.length; i++) {
			let item = items[i];

			formattedResult += '<tr>';

			//Tx
			formattedResult += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + getTransactionsUrl(item.txid) + '"><i class="fas fa-link text-info"></i></a><span class="d-inline d-lg-none text-white float-end">' + formatDateString(parseInt(item.time)) + '</span></td>';
			
			//Time
			formattedResult += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(parseInt(item.time)) + '</td>';

			//From
			let fromAddress = item.fromaddress;
			addAddress(fromAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>From: </strong></span>' + (fromAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + fromAddress + '" href="' + getWalletAddressUrl(fromAddress) + '" >' + (getOwner(fromAddress) == undefined ? formatAddressString(fromAddress, 10) : getOwner(fromAddress)) + '</a>') + '</td>';
		
			//To
			let toAddress = item.toaddress;
			addAddress(toAddress);
			formattedResult += '<td><span class="d-lg-none"><strong>To: </strong></span>' + (toAddress == 'N/A' ? 'N/A' : '<a class="address-string" addr="' + toAddress + '" href="' + getWalletAddressUrl(toAddress) + '" >' + (getOwner(toAddress) == undefined ? formatAddressString(toAddress, 10) : getOwner(toAddress)) + '</a>') + '</td>';

			//Value
			formattedResult += '<td><span class="d-lg-none"><strong>Value: </strong></span>' + formatAssetValueString(item.value, item.decimals) + ' ' + getAssetTitleParams(item, item.tokenid, item.ticker, false) + ' <span class="text-light">' + formatDollarPriceString(item.value / Math.pow(10, item.decimals) * prices[item.tokenid]) + '</span></td></tr>';

			formattedResult += '</tr>';
		}

		$('#transactionsTableBody').html(formattedResult);
		$('#txView').show();	

		getAddressesInfo();
    })
    .catch(error => {
        console.error('Fetch error:', error); // Handle errors here
    });
}

function getProtocolInfo() {
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('readystatechange', function () {
	  if (this.readyState === this.DONE) {
	  	let data = JSON.parse(this.response);

	    $('#ergVersion').html(data.version).addClass('count-up-in');
	    setCountUpHtml('#ergSupply', formatErgValueString(data.supply, 0, true, true));
	    setCountUpHtml('#ergTotal', formatErgValueString(97739924000000000, 0, true, true));
	    $('#ergHashRate').html(formatHashRateString(data.hashRate));
	    $('#ergTxAvg').html(data.transactionAverage);

    	setCountUpHtml('#marketCap', '$' + (prices['ERG'] * getAssetValue(data.supply, ERG_DECIMALS)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
	  }
	});

	xhr.open('GET', 'https://api.ergoplatform.com/info');
	xhr.setRequestHeader('content-type', 'application/json');

	xhr.withCredentials = false;

	xhr.send();
}

//Sets html and counts every number in it up to its value. On a refresh it
//counts from the previously shown numbers instead of from zero.
//Numbers glued to a letter ("24h") are left alone.
const COUNT_UP_NUMBER_REGEX = /\d[\d,]*(?:\.\d+)?(?![\d\w])/g;
const COUNT_UP_DURATION = 1000;

function setCountUpHtml(selector, html) {
	const $el = $(selector);
	const el = $el[0];

	if (el == undefined) {
		return;
	}

	const isFirstFill = el.childNodes.length == 0;
	cancelAnimationFrame($el.data('countUpFrame'));
	clearTimeout($el.data('countUpTimeout'));
	$el.html(html);

	if (isFirstFill) {
		$el.addClass('count-up-in');
	}

	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
	const parts = [];
	let node;

	while ((node = walker.nextNode())) {
		const text = node.nodeValue;
		const numbers = [];
		let match;

		COUNT_UP_NUMBER_REGEX.lastIndex = 0;
		while ((match = COUNT_UP_NUMBER_REGEX.exec(text)) !== null) {
			const raw = match[0];
			const [intPart, decPart] = raw.split('.');
			numbers.push({
				index: match.index,
				raw: raw,
				value: parseFloat(raw.replace(/,/g, '')),
				decimals: decPart ? decPart.length : 0,
				grouping: raw.includes(','),
				zeroPadded: intPart.length > 1 && intPart[0] == '0',
				intDigits: intPart.length
			});
		}

		if (numbers.length > 0) {
			parts.push({ node: node, text: text, numbers: numbers });
		}
	}

	const finalValues = parts.flatMap(p => p.numbers.map(n => n.value));
	const previousValues = $el.data('countUpValues');
	$el.data('countUpValues', finalValues);

	if (finalValues.length == 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		return;
	}

	let fromValues = finalValues.map(() => 0);
	if (previousValues != undefined && previousValues.length == finalValues.length) {
		fromValues = previousValues;
	}

	const startTime = performance.now();

	function render(progress) {
		let valueIndex = 0;

		for (const part of parts) {
			let text = '';
			let cursor = 0;

			for (const number of part.numbers) {
				const from = fromValues[valueIndex++];
				const current = from + (number.value - from) * progress;
				let formatted = progress >= 1 ? number.raw : current.toLocaleString('en-US', {
					minimumFractionDigits: number.decimals,
					maximumFractionDigits: number.decimals,
					useGrouping: number.grouping
				});

				//Keeps the zero padding of values like "02 sec"
				if (number.zeroPadded) {
					formatted = formatted.padStart(number.intDigits, '0');
				}

				text += part.text.slice(cursor, number.index) + formatted;
				cursor = number.index + number.raw.length;
			}

			part.node.nodeValue = text + part.text.slice(cursor);
		}
	}

	function step(now) {
		const t = Math.min((now - startTime) / COUNT_UP_DURATION, 1);
		render(1 - Math.pow(1 - t, 3));

		if (t < 1) {
			$el.data('countUpFrame', requestAnimationFrame(step));
		}
	}

	render(0);
	$el.data('countUpFrame', requestAnimationFrame(step));

	//Animation frames pause in background tabs; never leave a half-counted value
	$el.data('countUpTimeout', setTimeout(function() {
		cancelAnimationFrame($el.data('countUpFrame'));
		render(1);
	}, COUNT_UP_DURATION + 100));
}

function formatStatsErgHtml(value, maxDecimals = 4) {
	return '<p class="text-white">' + formatErgValueString(value, maxDecimals) + ' <span class="text-light">' + formatAssetDollarPriceString(value, ERG_DECIMALS, 'ERG') + '</span></p>';
}

//Small percentages come back with 7+ decimals; keep 3 significant digits
function formatStatsPercent(value) {
	return parseFloat(Number(value).toPrecision(3)) + '%';
}

function getStats() {
	let statsUrl = 'https://api.ergoplatform.com/stats';

	if (networkType == 'testnet') {
		statsUrl = 'https://api-testnet.ergoplatform.com/stats';
	}

	var jqxhr = $.get(statsUrl, function(data) {
		//Blocks summary
		setCountUpHtml('#statsBlocksMined', '<p>' + data.blockSummary.total.toLocaleString('en-US') + '</p>');
		setCountUpHtml('#statsAverageMiningTime', '<p>' + millisToMinutesAndSeconds(data.blockSummary.averageMiningTime) + '</p>');
		setCountUpHtml('#statsCoinsMined', formatStatsErgHtml(data.blockSummary.totalCoins, 0));

		//Transactions summary
		const transactionCount = data.transactionsSummary.total.toLocaleString('en-US', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
		setCountUpHtml('#totalTransactions', transactionCount);
		setCountUpHtml('#statsNumberOfTransactions', '<p>' + transactionCount + '</p>');
		setCountUpHtml('#statsTotalTransactionFees', formatStatsErgHtml(data.transactionsSummary.totalFee));

		//Mining cost
		setCountUpHtml('#statsTotalMinersRevenue', formatStatsErgHtml(data.miningCost.totalMinersRevenue));
		setCountUpHtml('#statsEarnedFromTransactionFees', '<p title="' + data.miningCost.percentEarnedTransactionsFees + '%">' + formatStatsPercent(data.miningCost.percentEarnedTransactionsFees) + '</p>');
		setCountUpHtml('#statsOfTransactionVolume', '<p title="' + data.miningCost.percentTransactionVolume + '%">' + formatStatsPercent(data.miningCost.percentTransactionVolume) + '</p>');
		setCountUpHtml('#statsCostPerTransaction', formatStatsErgHtml(data.miningCost.costPerTransaction));
		//Difficulty = average hashes needed to find a block, so show it in trillions like the hash rate
		const difficulty = data.miningCost.difficulty;
		setCountUpHtml('#statsDifficulty', '<p title="Average hashes needed to find a block: ' + difficulty.toLocaleString('en-US') + '">' + (difficulty / 1e12).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + ' T</p>');
		setCountUpHtml('#statsHashRate', '<p>' + formatHashRateString(data.miningCost.hashRate) + '</p>');

		$('#statsHolder').show();
    });
}
