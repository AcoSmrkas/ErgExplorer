// Boxes that can be charged storage rent now, and the ones that can be within 30 days: listed by
// api.ergexplorer.com (storageRent/), which a cron keeps from the explorers and our node.
// Mainnet only.
ITEMS_PER_PAGE = 50;

const RENT_BLOCK_MINUTES = 2;
const RENT_CARDS = { now: 'Now', day: 'Day', week: 'Week', month: 'Month' };

// The summary and page as loaded: drawn again with $ values once prices are in
let rentSummary = null;
let rentPage = null;

$(function() {
	loadPageAtOffset = showRentPage;
	$('.rent-help').each(function() { new bootstrap.Tooltip(this); });

	if (networkType == 'testnet') {
		$('#txLoading').hide();
		showLoadError('Storage rent is shown for Mainnet only.');
		return;
	}

	offset = Math.floor((Number(offset) || 0) / ITEMS_PER_PAGE) * ITEMS_PER_PAGE;

	// The list doesn't wait for prices: the $ values fill in once they're in
	getPrices(() => {
		if (rentSummary) printRentSummary(rentSummary);
		if (rentPage) renderRentRows();
	});

	Promise.all([fetchRentJson('storageRent/getSummary'), fetchRentPage(offset)])
		.then(([summary, page]) => {
			if (summary.missing || page.missing) {
				throw new Error('No storage rent data yet');
			}

			printRentSummary(summary);
			printRentPage(page);
		})
		.catch(error => {
			console.error('Storage rent unavailable:', error);
			$('#txLoading').hide();
			showLoadError('Could not load storage rent. Try again in a moment.');
		});
});

window.addEventListener('popstate', () => {
	delete params['offset'];
	readParams();
	showRentPage(params['offset'], false);
});

function fetchRentJson(path) {
	return fetch(ERGEXPLORER_API_HOST + path, { cache: 'no-store' }).then(response => {
		if (!response.ok) throw new Error('HTTP ' + response.status);
		return response.json();
	});
}

function fetchRentPage(pageOffset) {
	return fetchRentJson('storageRent/getBoxes?offset=' + pageOffset + '&limit=' + ITEMS_PER_PAGE);
}

function printRentSummary(summary) {
	rentSummary = summary;
	const ergUsd = getRentErgUsd();

	for (const [key, id] of Object.entries(RENT_CARDS)) {
		const totals = summary.summary[key];
		const rentErg = nanoErgToErg(totals.rent);
		// What a collector takes: the rent, and the tokens of boxes that go whole
		const tokensErg = Number(totals.collectableTokensErg) || 0;
		const totalErg = rentErg + tokensErg;

		animateCard(document.getElementById('rent' + id + 'Card'), t => {
			$('#rent' + id + 'Rent').html(formatRentErgAmount(rentErg * t) + ' <strong class="erg-span">ERG</strong>');
			$('#rent' + id + 'RentUsd').html(formatFiat(rentErg * t, ergUsd));

			const tokenCount = Math.round((totals.collectableTokens || 0) * t);
			$('#rent' + id + 'Tokens').html(formatRentTokens(tokenCount)
				+ (tokenCount > 0 && ergUsd && tokensErg * ergUsd >= 0.01 ? formatFiat(tokensErg * t, ergUsd) : ''));
			$('#rent' + id + 'Total').html(formatRentTotal(totalErg * t, ergUsd));
		});
	}

	$('#rentStatsHolder').show();
}

function printRentPage(page) {
	rentPage = page;
	addresses.length = 0;
	page.items.forEach(item => addAddress(item.address));

	renderRentRows();
	setupPagination(page.total);
	$('#rentDataHolder').show();
	$('#txLoading').hide();

	if (addresses.length > 0) {
		getAddressesInfo();
	}
}

function renderRentRows() {
	const ergUsd = getRentErgUsd();
	const html = rentPage.items.map(item => formatRentRow(item, rentPage.line, ergUsd)).join('');

	$('#rentTableBody').html(html || '<tr><td colspan="7" class="text-center text-muted">No boxes</td></tr>');

	// Drawn again once prices are in: the address book names go back on
	if (typeof labelAddressStrings === 'function') {
		labelAddressStrings();
	}
}

/**
 * Another page of the list: the page links (pagination.js) and Back/Forward call this.
 */
function showRentPage(pageOffset, addToHistory = true) {
	pageOffset = Math.floor((Number(pageOffset) || 0) / ITEMS_PER_PAGE) * ITEMS_PER_PAGE;
	if (pageOffset === Number(offset)) return;

	offset = pageOffset;
	params['offset'] = pageOffset;

	if (addToHistory) {
		history.pushState(null, '', getUrlWithOffset(offset));
	}

	fetchRentPage(pageOffset)
		.then(page => {
			printRentPage(page);

			// Paged from the links below the table: back to its top
			if (document.documentElement.scrollTop > $('#rentDataHolder').offset().top) {
				scrollToElement($('#rentDataHolder'));
			}
		})
		.catch(error => {
			console.error('Storage rent page unavailable:', error);
			showLoadError('Could not load storage rent. Try again in a moment.');
		});
}

function formatRentRow(item, line, ergUsd) {
	const rentErg = nanoErgToErg(item.rent);
	const isWhole = new BigNumber(item.rent).gte(item.value);
	// What a collector takes: the rent, and the tokens too when the whole box goes
	const totalErg = rentErg + (isWhole ? Number(item.tokensErg) || 0 : 0);

	return `
		<tr>
			<td><span class="d-lg-none"><strong>Box: </strong></span><a href="${getBoxUrl(item.boxId)}">${formatAddressString(item.boxId, 6)}</a></td>
			<td><span class="d-lg-none"><strong>Address: </strong></span><a class="address-string" addr="${item.address}" href="${getWalletAddressUrl(item.address)}">${formatAddressString(item.address, 8)}</a></td>
			<td class="text-end"><span class="d-lg-none"><strong>Created: </strong></span>${item.creationHeight}</td>
			<td class="text-end"><span class="d-lg-none"><strong>Rent: </strong></span>${formatErgValueString(item.rent, 4, true)}</td>
			<td class="text-end"><span class="d-lg-none"><strong>Tokens: </strong></span>${formatRentTokens(isWhole ? item.tokens : 0)}</td>
			<td class="text-end"><span class="d-lg-none"><strong>Total: </strong></span>${formatRentTotal(totalErg, ergUsd)}</td>
			<td class="text-end"><span class="d-lg-none"><strong>Due: </strong></span>${formatRentDue(item.creationHeight - line)}</td>
		</tr>
	`;
}

// Blocks until the box can be charged; the hover gives a rough date (a block about every 2 minutes)
function formatRentDue(blocksLeft) {
	if (blocksLeft <= 0) {
		return '<span class="rent-due-now">Collectable</span>';
	}

	const date = new Date(Date.now() + blocksLeft * RENT_BLOCK_MINUTES * 60000).toLocaleString();

	return '<span class="rent-due" title="About ' + date + '">in ' + formatRentCount(blocksLeft, 'block', 'blocks') + '</span>';
}

// Dollars per ERG from common/prices.js; null until it has them all
function getRentErgUsd() {
	return typeof gotPrices !== 'undefined' && gotPrices && prices['ERG'] > 0 ? prices['ERG'] : null;
}

// An amount's $ value in parentheses after it, as elsewhere on the site; nothing without prices
function formatFiat(erg, ergUsd) {
	return ergUsd ? ' <span class="rent-fiat">' + formatDollarPriceString(erg * ergUsd, 2) + '</span>' : '';
}

// Tokens the collector takes with the box: only when the whole box goes
function formatRentTokens(count) {
	return count > 0 ? '<span class="text-white">' + count.toLocaleString('en-US') + '</span>' : '<span class="text-muted">&mdash;</span>';
}

// The total in $, or in ERG until prices are in
function formatRentTotal(erg, ergUsd) {
	return ergUsd
		? '<span class="text-white">' + formatUsd(erg * ergUsd) + '</span>'
		: '<span class="text-white">' + formatCompact(erg) + '</span> ERG';
}

// A $ value on its own: cents, or short from a million
function formatUsd(usd) {
	if (usd > 0 && usd < 0.01) {
		return '&lt;$0.01';
	}

	return '$' + (usd >= 1e6 ? formatCompact(usd) : usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

// Big numbers short: 12.4K, 1.1M, 2.42B
function formatCompact(value) {
	// [from, unit, suffix]: thousands are shortened only from 10,000
	const units = [[1e9, 1e9, 'B'], [1e6, 1e6, 'M'], [1e4, 1e3, 'K']];

	for (const [from, unit, suffix] of units) {
		if (value >= from) {
			return (value / unit).toLocaleString('en-US', { maximumFractionDigits: unit == 1e3 ? 1 : 2 }) + suffix;
		}
	}

	return value.toLocaleString('en-US', { maximumFractionDigits: value >= 100 ? 0 : 2 });
}

function formatRentErgAmount(erg) {
	return erg.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// common/count-up.js counts the cards up; without it they show at once
function animateCard(element, render) {
	if (typeof countUp === 'function') {
		countUp(element, render);
	} else {
		render(1);
	}
}

function nanoErgToErg(nanoErg) {
	return parseFloat(new BigNumber(nanoErg).dividedBy(1000000000).toString());
}

function formatRentCount(count, one, many) {
	return nFormatter(count, 0, true, true) + ' ' + (count == 1 ? one : many);
}
