import { ORACLE_POOLS, fetchPoolState, fetchOperators, fetchRefreshHistory, fetchRateHistory } from './oracles/stub-data.js?v=1';

// Oracle pools: oracles lists them, oracles#pool=<slug> shows one. The pool goes in the hash, which
// params.js reads on every host, so the page needs no server rewrite.

const BLOCK_MINUTES = 2;
const HISTORY_PAGE_SIZE = 30;
// The token page's chart has about 30 points a range; denser series are thinned to this
const CHART_POINTS = 42;

// 'list', or the slug of the pool shown (or asked for)
let view = null;
let pool = null;
let poolState = null;
let chart = null;
let chartDays = 7;
let rateHistory = {};
// ERG's market price in USD, hourly over 7 days and daily over 30 (api2, as on the token page)
let marketHistory = null;
let marketHistoryRequest = null;

ITEMS_PER_PAGE = HISTORY_PAGE_SIZE;

$(function() {
	loadPageAtOffset = (pageOffset) => showHistoryPage(pageOffset);

	$(document).on('click', '.oracle-chart-range', function() {
		chartDays = Number($(this).data('days'));
		$('.oracle-chart-range').removeClass('btn-info').addClass('btn-primary');
		$(this).removeClass('btn-primary').addClass('btn-info');
		showChart();
	});

	$('#oracleTechnical')
		.on('show.bs.collapse', () => $('#technicalToggle').text('(hide)'))
		.on('hide.bs.collapse', () => $('#technicalToggle').text('(show)'));

	watchScrollFade(document.getElementById('operatorsScroll'));

	// The market price and the rate card's comparison wait for prices; the page doesn't
	getPrices(() => {
		if (pool && poolState) printMarket();
	});

	route();
});

// A pool row's link, or Back/Forward between pools and history pages
window.addEventListener('hashchange', route);
window.addEventListener('popstate', route);

function route() {
	for (const key of Object.keys(params)) {
		delete params[key];
	}

	readParams();

	const slug = params['pool'];
	const pageOffset = Number(params['offset']) || 0;

	if (slug == undefined) {
		if (view != 'list') showPools();
		return;
	}

	if (view == slug) {
		if (pool != null && pageOffset != Number(offset)) showHistoryPage(pageOffset, false);
		return;
	}

	showPool(slug, pageOffset);
}

function oraclesUrl(query) {
	return '/oracles' + (query ? '#' + query : '');
}

function poolUrl(slug) {
	return oraclesUrl('pool=' + slug);
}

/* The pools list */

function showPools() {
	view = 'list';
	pool = null;
	poolState = null;
	setDocumentTitle('Oracles');
	$('#oraclesTitle').text('Oracles');
	$('#poolStatsHolder, #poolDataHolder, #loadError').hide();
	$('#txLoading').show();

	Promise.all(ORACLE_POOLS.map((item) =>
		Promise.all([fetchPoolState(item), fetchOperators(item)])
			.then(([state, operators]) => ({ pool: item, state, operators }))
			.catch((error) => {
				console.warn('No state for the ' + item.name + ' pool:', error);
				return { pool: item, state: null, operators: null };
			})
	)).then((rows) => {
		// Off to a pool before the list came in
		if (view != 'list') return;

		$('#poolsTableBody').html(rows.map(formatPoolRow).join(''));
		$('#poolsHolder').show();
		$('#txLoading').hide();
	});
}

function formatPoolRow(row) {
	const item = row.pool;
	const state = row.state;
	let rate = '&ndash;';
	let updated = '&ndash;';
	let oracles = '&ndash;';

	if (state) {
		rate = formatRate(state.rate, item);
		updated = `<a href="${getBlockUrl(state.height)}">${formatHeight(state.height)}</a> <span class="text-light">&middot; ${timeAgo(state.timestamp)}</span>`;
	}

	if (row.operators) {
		oracles = `${countLive(row.operators)} / ${row.operators.length}`;
	}

	return `
		<tr>
			<td><span class="d-lg-none"><strong>Pool: </strong></span><a href="${poolUrl(item.slug)}">${item.name}</a></td>
			<td><span class="d-lg-none"><strong>Rate: </strong></span>${rate}</td>
			<td><span class="d-lg-none"><strong>Last update: </strong></span>${updated}</td>
			<td><span class="d-lg-none"><strong>Oracles: </strong></span>${oracles}</td>
			<td><span class="d-lg-none"><strong>Status: </strong></span>${state ? item.status : 'No data'}</td>
		</tr>
	`;
}

/* One pool */

function showPool(slug, pageOffset) {
	const item = ORACLE_POOLS.find((p) => p.slug == slug);

	view = slug;
	pool = item || null;
	poolState = null;
	rateHistory = {};
	$('#poolsHolder, #poolStatsHolder, #poolDataHolder, #loadError').hide();

	if (!item) {
		setDocumentTitle('Oracles');
		$('#oraclesTitle').text('Oracles');
		$('#txLoading').hide();
		showLoadError('No oracle pool called "' + escapeHtmlString(slug) + '". <a href="' + oraclesUrl() + '">All oracle pools</a>');
		return;
	}

	setDocumentTitle(item.name + ' oracle pool');
	$('#oraclesTitle').text(item.name + ' oracle pool');
	$('#txLoading').show();

	fetchPoolState(item).then((state) => {
		if (pool !== item) return;

		poolState = state;
		printPoolStats();
		printTechnical();
		$('#poolStatsHolder, #poolDataHolder').show();
		$('#txLoading').hide();

		loadOperators();
		showHistoryPage(pageOffset, false, true);
		showChart();
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the oracle pool:', error);
		$('#txLoading').hide();
		showLoadError('Error fetching the ' + item.name + ' oracle pool.');
	});
}

function printPoolStats() {
	const minutes = pool.epochLength * BLOCK_MINUTES;

	$('#stat-pair').text(pool.pair);
	$('#stat-version').text('Version ' + pool.version + ' · ' + pool.status);
	$('#stat-rate').html(formatRate(poolState.rate, pool));
	$('#stat-updated').text(timeAgo(poolState.timestamp));
	$('#stat-height').html(`Block <a href="${getBlockUrl(poolState.height)}">${formatHeight(poolState.height)}</a>`);
	$('#stat-schedule').text('Every ' + pool.epochLength + ' blocks');
	$('#stat-schedule-minutes').text('≈ ' + (minutes >= 60 && minutes % 60 == 0 ? (minutes / 60) + (minutes == 60 ? ' hour' : ' hours') : minutes + ' minutes') + ' at ' + BLOCK_MINUTES + ' min/block');
	$('#stat-epoch').text(formatHeight(poolState.epoch));
	$('#stat-box').html(`<a href="${getBoxUrl(poolState.boxId)}">Pool box</a> &middot; <a href="${getTransactionsUrl(poolState.txId)}">Transaction</a>`);
	$('#stat-oracles').text('- / ' + pool.oracleCount);
	$('#stat-consensus').text(pool.consensus + ' needed to refresh');

	printMarket();
}

// The rate against ERG's market price, for the pools quoted in USD
function printMarket() {
	if (!isUsdPool(pool)) {
		$('#stat-market').text('Datapoint ' + poolState.rawDatapoint);
		return;
	}

	const market = prices['ERG'];

	if (!market) {
		$('#stat-market').text('Market -');
		return;
	}

	const difference = (poolState.rate / market - 1) * 100;
	$('#stat-market').text('Market $' + nFormatter(market, 4) + ' · ' + (difference > 0 ? '+' : '') + difference.toFixed(2) + '%');
}

function loadOperators() {
	const item = pool;
	$('#operatorsError').hide();

	fetchOperators(item).then((operators) => {
		if (pool !== item) return;

		const hasWins = operators.some((o) => o.wins != null);
		operators = operators.slice().sort((a, b) => (b.live - a.live) || (b.timestamp - a.timestamp));

		$('#operatorsScroll th.oracle-wins').toggle(hasWins);
		$('#operatorsTableBody').html(operators.map((o) => formatOperatorRow(o, hasWins)).join(''));
		$('#operatorsCount').text('(' + operators.length + ')');
		$('#stat-oracles').text(countLive(operators) + ' / ' + operators.length + ' live');
		$('#operatorsScroll').show();

		getAddressesInfo();
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the oracles:', error);
		$('#operatorsScroll').hide();
		$('#operatorsError').text('Error fetching the oracles.').show();
	});
}

function formatOperatorRow(operator, hasWins) {
	const balance = operator.ergBalance == null ? '&ndash;' : formatErgValueString(operator.ergBalance, 2, false, true);
	const posted = `<a href="${getTransactionsUrl(operator.txId)}">${timeAgo(operator.timestamp)}</a>` + (operator.live ? '' : ' <span class="text-light">&middot; not live</span>');

	return `
		<tr>
			<td><span class="d-lg-none"><strong>Address: </strong></span>${formatAddressLink(operator.address)}</td>
			<td><span class="d-lg-none"><strong>Last rate: </strong></span>${formatRate(operator.rate, pool)}</td>
			<td><span class="d-lg-none"><strong>Epoch: </strong></span>${formatHeight(operator.epoch)}</td>
			<td><span class="d-lg-none"><strong>Posted: </strong></span>${posted}</td>
			<td class="text-end"><span class="d-lg-none"><strong>ERG: </strong></span>${balance}</td>
			${hasWins ? `<td class="text-end"><span class="d-lg-none"><strong>Wins: </strong></span>${operator.wins == null ? '&ndash;' : formatHeight(operator.wins)}</td>` : ''}
		</tr>
	`;
}

/**
 * A page of the pool's refreshes. The page links (pagination.js) and Back/Forward call this; the
 * first call comes from showPool.
 */
function showHistoryPage(pageOffset, addToHistory = true, force = false) {
	const item = pool;
	pageOffset = Math.max(0, Number(pageOffset) || 0);

	if (!item || (!force && pageOffset === Number(offset))) return;

	offset = pageOffset;
	params['offset'] = pageOffset;
	$('#historyError').hide();

	if (addToHistory) {
		history.pushState(null, '', oraclesUrl('pool=' + item.slug + (pageOffset ? '&offset=' + pageOffset : '')));
	}

	fetchRefreshHistory(item, pageOffset, HISTORY_PAGE_SIZE).then((result) => {
		if (pool !== item || Number(offset) !== pageOffset) return;

		$('#historyTableBody').html(result.items.map(formatHistoryRow).join(''));
		$('#historyCount').text('(' + nFormatter(result.total, 0, true, true) + ')');
		setupPagination(result.total);
		setHistoryPageLinks();
		$('#historyHolder').show();

		getAddressesInfo();

		// Paged from the links below the table: back to its top
		if (addToHistory && document.documentElement.scrollTop > $('#historyHolder').offset().top) {
			scrollToElement($('#historyHolder'));
		}
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the refresh history:', error);
		$('#historyHolder').hide();
		$('#historyError').text('Error fetching the refresh history.').show();
	});
}

// pagination.js points its links at oracles/<params>, a path only the rewritten pages have
function setHistoryPageLinks() {
	$('.firstPage, .previousPage, .nextPage, .lastPage').each(function() {
		const linkOffset = $(this).data('offset');
		$(this).attr('href', oraclesUrl('pool=' + pool.slug + (linkOffset ? '&offset=' + linkOffset : '')));
	});
}

function formatHistoryRow(refresh) {
	return `
		<tr>
			<td><span class="d-lg-none"><strong>Height: </strong></span><a href="${getBlockUrl(refresh.height)}">${formatHeight(refresh.height)}</a></td>
			<td><span class="d-lg-none"><strong>Time: </strong></span>${formatShortDateString(refresh.timestamp)}</td>
			<td><span class="d-lg-none"><strong>Rate: </strong></span>${formatRate(refresh.rate, pool)}</td>
			<td><span class="d-lg-none"><strong>Epoch: </strong></span>${formatHeight(refresh.epoch)}</td>
			<td><span class="d-lg-none"><strong>Collector: </strong></span>${refresh.collector ? formatAddressLink(refresh.collector) : '&ndash;'}</td>
			<td><span class="d-lg-none"><strong>Transaction: </strong></span><a href="${getTransactionsUrl(refresh.txId)}">${formatAddressString(refresh.txId, 8)}</a></td>
		</tr>
	`;
}

/* The rate chart */

function showChart() {
	const item = pool;
	const days = chartDays;

	Promise.all([
		rateHistory[days] || fetchRateHistory(item, days),
		isUsdPool(item) ? getMarketHistory() : null
	]).then(([points, market]) => {
		if (pool !== item) return;

		rateHistory[days] = points;
		if (days == chartDays) drawChart(points, market ? market[days == 7 ? 1 : 2] : null);
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the rate history:', error);
		drawChart([], null);
	});
}

function getMarketHistory() {
	if (marketHistory) return Promise.resolve(marketHistory);

	if (marketHistoryRequest == null) {
		marketHistoryRequest = new Promise((resolve) => {
			$.post('https://api2.ergexplorer.com/tokens/getPriceHistoryNew',
				{ from: Date.now() - 30 * 24 * 60 * 60 * 1000, ids: ['ERG'] },
				(data) => {
					marketHistory = Array.isArray(data) && data.length >= 3 ? data : null;
					resolve(marketHistory);
				}
			).fail((error) => {
				// The chart still shows the oracle's rate alone
				console.warn('No ERG price history:', error);
				marketHistoryRequest = null;
				resolve(null);
			});
		});
	}

	return marketHistoryRequest;
}

function drawChart(points, market) {
	if (chart) {
		chart.destroy();
		chart = null;
	}

	$('#chartError').toggle(points.length == 0);
	$('#chart').toggle(points.length > 0);
	$('#chartTitle').text(market ? 'Rate vs market' : 'Rate chart');

	if (points.length == 0 || typeof Chart === 'undefined') return;

	points = thinPoints(points.slice().sort((a, b) => a.time - b.time));

	const rootStyles = getComputedStyle(document.documentElement);
	const primaryColor = rootStyles.getPropertyValue('--main-color').trim();
	const mutedColor = rootStyles.getPropertyValue('--text-light').trim();
	const marketPoints = market ? market.map((row) => ({ time: parseDate(row.timestamp).getTime(), price: Number(row.price) })) : null;

	const datasets = [{
		label: 'Oracle',
		data: points.map((p) => p.rate),
		borderColor: primaryColor,
		backgroundColor: primaryColor
	}];

	if (marketPoints && marketPoints.length > 0) {
		datasets.push({
			label: 'Market',
			data: points.map((p) => marketPriceAt(marketPoints, p.time)),
			borderColor: mutedColor,
			backgroundColor: mutedColor
		});
	}

	chart = new Chart(document.getElementById('chart'), {
		type: 'line',
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: {
				duration: 1000
			},
			fill: false,
			plugins: {
				legend: {
					display: datasets.length > 1
				},
				tooltip: {
					enabled: true,
					displayColors: false,
					callbacks: {
						label: (tooltip) => tooltip.dataset.label + ': ' + nFormatter(tooltip.parsed.y, pool.decimals + 2) + ' ' + pool.unit
					}
				}
			}
		},
		data: {
			labels: points.map((p) => new Date(p.time).toLocaleDateString()),
			datasets: datasets
		}
	});
}

function thinPoints(points) {
	if (points.length <= CHART_POINTS) return points;

	const step = (points.length - 1) / (CHART_POINTS - 1);
	const thinned = [];

	for (let i = 0; i < CHART_POINTS; i++) {
		thinned.push(points[Math.round(i * step)]);
	}

	return thinned;
}

// The last market price at or before the time, else the first one
function marketPriceAt(marketPoints, time) {
	let price = marketPoints[0].price;

	for (const point of marketPoints) {
		if (point.time > time) break;
		price = point.price;
	}

	return price;
}

/* Technical */

function printTechnical() {
	const rows = [
		['Pool NFT', formatTokenLink(pool.poolNft)],
		['Oracle token', formatTokenLink(pool.oracleToken)],
		['Refresh NFT', pool.refreshNft ? formatTokenLink(pool.refreshNft) : null],
		['Buyback NFT', pool.buybackNft ? formatTokenLink(pool.buybackNft) : null],
		['Buyback token', pool.buybackToken ? formatTokenLink(pool.buybackToken) : null],
		['Pool contract', poolState.address ? `<a href="${getWalletAddressUrl(poolState.address)}">${formatAddressString(poolState.address, 10)}</a>` : null],
		['Pool box', `<a href="${getBoxUrl(poolState.boxId)}">${formatAddressString(poolState.boxId, 10)}</a>`],
		['Payout', pool.payoutNanoErg == null ? '&ndash;' : formatErgValueString(pool.payoutNanoErg, 4, false, true) + ' per datapoint'],
		['Deviation', pool.deviation == null ? '&ndash;' : pool.deviation + '%'],
		['Consensus', pool.consensus == null ? '&ndash;' : pool.consensus + ' of ' + pool.oracleCount + ' oracles'],
		['Raw datapoint', poolState.rawDatapoint]
	];

	$('#technicalRows').html(rows.filter((row) => row[1] != null).map((row) => `
		<div class="row w-100 p-1">
			<div class="col-5 col-md-3">
				<p><strong class="text-white">${row[0]}</strong></p>
			</div>
			<div class="col-7 col-md-9">
				<p>${row[1]}</p>
			</div>
		</div>
	`).join(''));
}

/* Formatting */

function isUsdPool(item) {
	return item.unit == 'USD';
}

function formatRate(rate, item) {
	if (rate == null) return '&ndash;';

	return nFormatter(rate, item.decimals + 2) + ' <strong class="erg-span">' + item.unit + '</strong>';
}

function formatHeight(value) {
	return nFormatter(value, 0, true, true);
}

function formatAddressLink(address) {
	addAddress(address);
	return `<a class="address-string" addr="${address}" href="${getWalletAddressUrl(address)}">${formatAddressString(address, 8)}</a>`;
}

function formatTokenLink(tokenId) {
	return `<a href="${getTokenUrl(tokenId)}">${formatAddressString(tokenId, 10)}</a>`;
}

function countLive(operators) {
	return operators.filter((o) => o.live).length;
}

function timeAgo(timestamp) {
	const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

	if (minutes < 1) return 'just now';
	if (minutes < 60) return minutes + ' min ago';

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return hours + (hours == 1 ? ' hour ago' : ' hours ago');

	const days = Math.floor(hours / 24);
	return days + (days == 1 ? ' day ago' : ' days ago');
}
