import { ORACLE_POOLS, fetchPoolBoxId, fetchPoolState, fetchOracleCounts, fetchOperators, fetchErgBalances, fetchRefreshHistory, fetchRateHistory } from './oracles/oracle-data.js?v=8';

// Oracle pools: oracles lists them, oracles#pool=<slug> shows one. The pool goes in the hash, which
// params.js reads on every host, so the page needs no server rewrite.

const BLOCK_MINUTES = 2;
const HISTORY_PAGE_SIZE = 10;
// The token page's chart has about 30 points a range; denser series are thinned to this
const CHART_POINTS = 42;
// A value still loading: the pulsing bar (main.scss .skeleton)
const SKELETON = '<span class="skeleton"></span>';
// Placeholder rows while a table loads
const SKELETON_ROWS = 5;
// How often to look for a new pool box (about a block); only a new one reloads anything
const POLL_MS = 2 * 60 * 1000;
// "N min ago" keeps counting between refreshes
const TIME_TICK_MS = 30 * 1000;

// 'list', or the slug of the pool shown (or asked for)
let view = null;
let pool = null;
let poolState = null;
// The pool box each pool was last shown from, by slug
let poolBoxIds = {};
// Operators' balances by address (null: unknown), kept across refreshes of the table
let operatorBalances = {};
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

	watchScrollFade(document.getElementById('operatorsScroll'));

	// The market price and the rate card's comparison wait for prices; the page doesn't
	getPrices(() => {
		if (pool && poolState) printMarket();
	});

	setInterval(updateTimes, TIME_TICK_MS);
	setInterval(checkForRefresh, POLL_MS);

	// A hidden tab doesn't ask; back on it, catch up at once
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) return;

		updateTimes();
		checkForRefresh();
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

/* Staying current */

function checkForRefresh() {
	if (document.hidden) return;

	if (view == 'list') {
		ORACLE_POOLS.forEach((item) => checkPool(item, () => loadPoolRow(item, true)));
	} else if (pool) {
		const item = pool;
		checkPool(item, () => {
			if (pool === item) reloadPool(item);
		});
	}
}

function checkPool(item, onNewBox) {
	fetchPoolBoxId(item).then((boxId) => {
		// Nothing shown yet: the first load is still on its way
		if (poolBoxIds[item.slug] && boxId != poolBoxIds[item.slug]) onNewBox();
	}).catch((error) => {
		console.warn('Could not check the ' + item.name + ' pool:', error);
	});
}

function updateTimes() {
	$('.oracle-time-ago').each(function() {
		$(this).text(timeAgo(Number($(this).attr('data-time'))));
	});
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

	// Every row is there at once; each cell fills in as its own request comes back
	$('#poolsTableBody').html(ORACLE_POOLS.map(formatPoolRow).join(''));
	$('#poolsHolder').show();

	ORACLE_POOLS.forEach((item) => loadPoolRow(item));
}

// quiet: a refresh of a row already showing; if it fails the row keeps what it has
function loadPoolRow(item, quiet = false) {
	const cell = (name) => $(`#poolsTableBody tr[data-pool="${item.slug}"] .${name}`);

	fetchPoolState(item).then((state) => {
		if (view != 'list') return;

		poolBoxIds[item.slug] = state.boxId;
		cell('pool-rate').html(formatRate(state.rate, item));
		cell('pool-updated').html(`<a href="${getBlockUrl(state.height)}">${formatHeight(state.height)}</a> <span class="text-light">&middot; ${formatTimeAgo(state.timestamp)}</span>`);
	}).catch((error) => {
		console.warn('No state for the ' + item.name + ' pool:', error);
		if (view != 'list' || quiet) return;

		cell('pool-rate').html('&ndash;');
		cell('pool-updated').html('&ndash;');
		cell('pool-status').text('No data');
	});

	fetchOracleCounts(item).then((counts) => {
		if (view == 'list') cell('pool-oracles').text(counts.live + ' / ' + counts.total);
	}).catch((error) => {
		console.warn('No oracle count for the ' + item.name + ' pool:', error);
		if (view == 'list' && !quiet) cell('pool-oracles').html('&ndash;');
	});
}

function formatPoolRow(item) {
	return `
		<tr data-pool="${item.slug}">
			<td><span class="d-lg-none"><strong>Pool: </strong></span><a href="${poolUrl(item.slug)}">${item.name}</a></td>
			<td><span class="d-lg-none"><strong>Rate: </strong></span><span class="pool-rate">${SKELETON}</span></td>
			<td><span class="d-lg-none"><strong>Last update: </strong></span><span class="pool-updated">${SKELETON}</span></td>
			<td><span class="d-lg-none"><strong>Oracles: </strong></span><span class="pool-oracles">${SKELETON}</span></td>
			<td><span class="d-lg-none"><strong>Status: </strong></span><span class="pool-status">${item.status}</span></td>
		</tr>
	`;
}

/* One pool */

function showPool(slug, pageOffset) {
	const item = ORACLE_POOLS.find((p) => p.slug == slug);

	view = slug;
	pool = item || null;
	poolState = null;
	operatorBalances = {};
	rateHistory = {};
	$('#poolsHolder, #poolStatsHolder, #poolDataHolder, #loadError').hide();

	if (!item) {
		setDocumentTitle('Oracles');
		$('#oraclesTitle').text('Oracles');
		showLoadError('No oracle pool called "' + escapeHtmlString(slug) + '". <a href="' + oraclesUrl() + '">All oracle pools</a>');
		return;
	}

	setDocumentTitle(item.name + ' oracle pool');
	$('#oraclesTitle').text(item.name + ' oracle pool');

	// The page is up at once with what the pool's settings say; every section asks for its own data
	// in parallel and fills in when it comes back
	printPoolStats();
	printTechnical();
	$('#poolStatsHolder, #poolDataHolder').show();

	fetchPoolState(item).then((state) => {
		if (pool !== item) return;

		poolState = state;
		poolBoxIds[item.slug] = state.boxId;
		printPoolState();
		printTechnical();
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the oracle pool:', error);
		$('#poolStatsHolder, #poolDataHolder').hide();
		showLoadError('Error fetching the ' + item.name + ' oracle pool.');
	});

	loadOperators();
	showHistoryPage(pageOffset, false, true);
	showChart();
}

// A new pool box: the cards, oracles and first history page update in place. The chart waits for a reload.
function reloadPool(item) {
	fetchPoolState(item).then((state) => {
		if (pool !== item) return;

		poolState = state;
		poolBoxIds[item.slug] = state.boxId;
		printPoolState();
		printTechnical();
	}).catch((error) => {
		console.warn('Could not refresh the ' + item.name + ' pool:', error);
	});

	loadOperators(true);

	// A later page stays as it is: its rows would shift under the reader
	if (Number(offset) === 0) showHistoryPage(0, false, true, true);
}

// The cards from the pool's settings; the rest waits for its state (printPoolState)
function printPoolStats() {
	const minutes = pool.epochLength * BLOCK_MINUTES;

	$('#stat-pair').text(pool.pair);
	$('#stat-version').text('Version ' + pool.version + ' · ' + pool.status);
	$('#stat-schedule').text('Every ' + pool.epochLength + ' blocks');
	$('#stat-schedule-minutes').text('≈ ' + (minutes >= 60 && minutes % 60 == 0 ? (minutes / 60) + (minutes == 60 ? ' hour' : ' hours') : minutes + ' minutes') + ' at ' + BLOCK_MINUTES + ' min/block');
	$('#stat-epoch-label').text(epochLabel(pool));
	$('th.oracle-epoch').text(epochLabel(pool));
	$('#stat-consensus').text(pool.consensus + ' needed to refresh');
	$('#stat-rate, #stat-market, #stat-updated, #stat-height, #stat-epoch, #stat-box, #stat-oracles').html(SKELETON);
}

function printPoolState() {
	$('#stat-rate').html(formatRate(poolState.rate, pool));
	$('#stat-updated').html(formatTimeAgo(poolState.timestamp));
	$('#stat-height').html(`Block <a href="${getBlockUrl(poolState.height)}">${formatHeight(poolState.height)}</a>`);
	$('#stat-epoch').text(formatHeight(poolState.epoch));
	$('#stat-box').html(`<a href="${getBoxUrl(poolState.boxId)}">Pool box</a> &middot; <a href="${getTransactionsUrl(poolState.txId)}">Transaction</a>`);

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

// quiet: a refresh of a table already showing; if it fails the table keeps what it has
function loadOperators(quiet = false) {
	const item = pool;

	if (!quiet) {
		$('#operatorsError').hide();
		$('#operatorsCount').text('');
		$('#operatorsScroll th.oracle-wins').hide();
		$('#operatorsTableBody').html(skeletonRows(5));
		$('#operatorsScroll').show();
	}

	fetchOperators(item).then((operators) => {
		if (pool !== item) return;

		const hasWins = operators.some((o) => o.wins != null);
		operators = operators.slice().sort((a, b) => (b.live - a.live) || (b.timestamp - a.timestamp));

		$('#operatorsScroll th.oracle-wins').toggle(hasWins);
		$('#operatorsTableBody').html(operators.map((o) => formatOperatorRow(o, hasWins)).join(''));
		$('#operatorsCount').text('(' + operators.length + ')');
		$('#stat-oracles').text(countLive(operators) + ' / ' + operators.length + ' live');

		getAddressesInfo();

		// The ERG column fills in one balance at a time; a refresh only asks for ones it doesn't have
		fetchErgBalances(operators.map((o) => o.address).filter((address) => !(address in operatorBalances)), (address, nanoErg) => {
			if (pool !== item) return;

			operatorBalances[address] = nanoErg;
			$(`#operatorsTableBody .operator-balance[data-address="${address}"]`).html(formatBalance(nanoErg));
		});
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the oracles:', error);
		if (quiet) return;

		$('#stat-oracles').html('&ndash;');
		$('#operatorsScroll').hide();
		$('#operatorsError').text('Error fetching the oracles.').show();
	});
}

function formatOperatorRow(operator, hasWins) {
	const balance = `<span class="operator-balance" data-address="${operator.address}">${operator.address in operatorBalances ? formatBalance(operatorBalances[operator.address]) : SKELETON}</span>`;
	const posted = `<a href="${getTransactionsUrl(operator.txId)}">${formatTimeAgo(operator.timestamp)}</a>` + (operator.live ? '' : ' <span class="text-light">&middot; not live</span>');

	return `
		<tr>
			<td><span class="d-lg-none"><strong>Address: </strong></span>${formatAddressLink(operator.address)}</td>
			<td><span class="d-lg-none"><strong>Last rate: </strong></span>${formatRate(operator.rate, pool)}</td>
			<td><span class="d-lg-none"><strong>${epochLabel(pool)}: </strong></span>${formatHeight(operator.epoch)}</td>
			<td><span class="d-lg-none"><strong>Posted: </strong></span>${posted}</td>
			<td class="text-end"><span class="d-lg-none"><strong>ERG: </strong></span>${balance}</td>
			${hasWins ? `<td class="text-end"><span class="d-lg-none"><strong>Wins: </strong></span>${operator.wins == null ? '&ndash;' : formatHeight(operator.wins)}</td>` : ''}
		</tr>
	`;
}

/**
 * A page of the pool's refreshes. The page links (pagination.js) and Back/Forward call this; the
 * first call comes from showPool. quiet: a refresh of the page showing; if it fails the page stays.
 */
function showHistoryPage(pageOffset, addToHistory = true, force = false, quiet = false) {
	const item = pool;
	pageOffset = Math.max(0, Number(pageOffset) || 0);

	if (!item || (!force && pageOffset === Number(offset))) return;

	offset = pageOffset;
	params['offset'] = pageOffset;

	if (!quiet) {
		$('#historyError').hide();
		$('#historyTableBody').html(skeletonRows(6));
		$('#historyHolder').show();

		// The page links wait for the total
		if (force) {
			$('#historyCount').text('');
			$('#historyHolder .pagination').css('visibility', 'hidden');
		}
	}

	if (addToHistory) {
		history.pushState(null, '', oraclesUrl('pool=' + item.slug + (pageOffset ? '&offset=' + pageOffset : '')));
	}

	fetchRefreshHistory(item, pageOffset, HISTORY_PAGE_SIZE).then((result) => {
		if (pool !== item || Number(offset) !== pageOffset) return;

		$('#historyTableBody').html(result.items.map(formatHistoryRow).join(''));
		$('#historyCount').text('(' + nFormatter(result.total, 0, true, true) + ')');
		setupPagination(result.total);
		setHistoryPageLinks();
		$('#historyHolder .pagination').css('visibility', '');

		getAddressesInfo();

		// Paged from the links below the table: back to its top
		if (addToHistory && document.documentElement.scrollTop > $('#historyHolder').offset().top) {
			scrollToElement($('#historyHolder'));
		}
	}).catch((error) => {
		if (pool !== item) return;

		console.error('Error fetching the refresh history:', error);
		if (quiet) return;

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
			<td><span class="d-lg-none"><strong>${epochLabel(pool)}: </strong></span>${formatHeight(refresh.epoch)}</td>
			<td><span class="d-lg-none"><strong>Collector: </strong></span>${refresh.collector ? formatAddressLink(refresh.collector) : '&ndash;'}</td>
			<td><span class="d-lg-none"><strong>Transaction: </strong></span><a href="${getTransactionsUrl(refresh.txId)}">${formatAddressString(refresh.txId, 8)}</a></td>
		</tr>
	`;
}

/* The rate chart */

function showChart() {
	const item = pool;
	const days = chartDays;

	if (!rateHistory[days]) {
		$('#chartError').hide();
		$('#chartLoading').show();
	}

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

	$('#chartLoading').hide();
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

// The tokens, then the contract and its settings, split evenly over the two columns. The pool box's
// values wait for its state.
function printTechnical() {
	const state = poolState;
	const rows = [
		['Pool NFT', formatTokenLink(pool.poolNft)],
		['Oracle token', formatTokenLink(pool.oracleToken)],
		['Refresh NFT', pool.refreshNft ? formatTokenLink(pool.refreshNft) : null],
		['Buyback NFT', pool.buybackNft ? formatTokenLink(pool.buybackNft) : null],
		['Buyback token', pool.buybackToken ? formatTokenLink(pool.buybackToken) : null],
		['Pool contract', !state ? SKELETON : state.address ? `<a href="${getWalletAddressUrl(state.address)}">${formatAddressString(state.address, 10)}</a>` : null],
		['Pool box', state ? `<a href="${getBoxUrl(state.boxId)}">${formatAddressString(state.boxId, 10)}</a>` : SKELETON],
		['Raw datapoint', state ? `${state.rawDatapoint} <span class="text-light d-none d-lg-inline">${pool.rawUnit}</span>` : SKELETON],
		['Payout', pool.payoutNanoErg == null ? null : formatErgValueString(pool.payoutNanoErg, 4, false, true) + ' per datapoint'],
		['Deviation', pool.deviation == null ? null : pool.deviation + '%'],
		['Consensus', pool.consensus == null ? null : pool.consensus + ' of ' + pool.oracleCount + ' oracles']
	].filter((row) => row[1] != null);
	const half = Math.ceil(rows.length / 2);

	$('#technicalLeft').html(formatTechnicalRows(rows.slice(0, half)));
	$('#technicalRight').html(formatTechnicalRows(rows.slice(half)));
}

function formatTechnicalRows(rows) {
	return rows.map((row) => `
		<tr>
			<td><strong>${row[0]}</strong></td>
			<td>${row[1]}</td>
		</tr>
	`).join('');
}

function skeletonRows(columns) {
	const row = '<tr>' + `<td>${SKELETON}</td>`.repeat(columns) + '</tr>';
	return row.repeat(SKELETON_ROWS);
}

/* Formatting */

function isUsdPool(item) {
	return item.unit == 'USD';
}

// v1 names an epoch by the height it ends at, v2 counts them
function epochLabel(item) {
	return item.version == 1 ? 'Epoch end' : 'Epoch';
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

// data-token-id opens the token hover popup (common/token-popup.js), as token links do elsewhere
function formatTokenLink(tokenId) {
	return `<a class="token-link" href="${getTokenUrl(tokenId)}" data-token-id="${tokenId}">${formatAddressString(tokenId, 10)}</a>`;
}

function countLive(operators) {
	return operators.filter((o) => o.live).length;
}

function formatBalance(nanoErg) {
	return nanoErg == null ? '&ndash;' : formatErgValueString(nanoErg, 2, false, true);
}

// updateTimes keeps these counting
function formatTimeAgo(timestamp) {
	return `<span class="oracle-time-ago" data-time="${timestamp}">${timeAgo(timestamp)}</span>`;
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
