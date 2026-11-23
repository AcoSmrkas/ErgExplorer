import { TokenState } from './state.js';
import { chartTime, drawPriceChart } from '../common/price-chart.js?v=1';

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_BUTTONS = [
	'#showGainersLosers24h',
	'#showGainersLosers7d',
	'#showGainersLosers30d',
	'#showGainersLosers1y',
	'#showGainersLosersAll'
];

function hasTokenUsdPrice() {
	if (typeof prices === 'undefined') return false;

	const price = Number(prices[TokenState.tokenId]);
	return Number.isFinite(price) && price > 0;
}

export const TokenUIControllers = {
	// Copy token address to clipboard
	copyTokenAddress(e) {
		if (e) e.preventDefault();
		if (typeof copyToClipboard === 'function') {
			copyToClipboard(e, TokenState.tokenId);
		}
	},

	// Show full image preview
	showFullImgPreview() {
		$('#nftImageFullBack').fadeIn();
		$('#nftImageFullBack').css('display', 'flex');
		$('body').css('height', '100%');
		$('body').css('overflow-y', 'hidden');
		window.scrollTo(0, 0);
	},

	// Hide full image preview
	hideFullImgPreview() {
		$('#nftImageFullBack').fadeOut();
		$('body').css('height', 'inherit');
		$('body').css('overflow-y', 'auto');
		if (typeof scrollToElement === 'function') {
			scrollToElement($('#nftPreviewImg'));
		}
	},

	// Show NFT image
	showImage() {
		$('#nftPreviewImg').attr('src', TokenState.imageUrl);
		$('#nftImageFull').attr('src', TokenState.imageUrl);
		$('#nftPreviewImgNsfw').hide();
	},

	// Toggle chart currency (USD/ERG)
	toggleChart() {
		TokenState.chartUsd = !TokenState.chartUsd;
		this.printGainersLosers(TokenState.chartType);
		$('#chartToggleBtn').val(TokenState.chartUsd ? 'USD' : 'ERG');
	},

	// Range buttons: 0 = 24h, 1 = 7d, 2 = 30d, 3 = 1y, 4 = all
	printGainersLosers24h() {
		this.selectRange(0);
	},

	printGainersLosers7d() {
		this.selectRange(1);
	},

	printGainersLosers30d() {
		this.selectRange(2);
	},

	selectRange(timeframe) {
		this.printGainersLosers(timeframe);
	},

	// Price changes in the header, the range buttons and the chart
	printGainersLosers(timeframe) {
		if (!TokenState.priceData || TokenState.priceData.length === 0) {
			return;
		}

		const data = TokenState.priceData;

		if (data.length == 0 || data[0].length == 0) {
			return;
		}

		if (typeof prices === 'undefined' || !prices[TokenState.tokenId]) {
			return;
		}

		const usd = TokenState.chartUsd;
		const currentPrice = usd ? prices[TokenState.tokenId] : prices[TokenState.tokenId] / prices['ERG'];
		const valueOf = (row) => Number(usd ? row.price : row.price_in_erg);

		// 1y shows only for tokens older than a year, all only for tokens older than 30 days
		const all = data[4] || [];
		const firstTime = all.length > 0 ? chartTime(all[0].timestamp) : Date.now();
		const age = Date.now() - firstTime;
		const available = [true, true, true, age > 365 * DAY_MS, age > 30 * DAY_MS];
		$('#showGainersLosers1y').toggle(available[3]);
		$('#showGainersLosersAll').toggle(available[4]);

		if (!available[timeframe] || !data[timeframe] || data[timeframe].length === 0) {
			timeframe = 0;
		}

		TokenState.chartType = timeframe;

		RANGE_BUTTONS.forEach((id, i) => {
			$(id).toggleClass('btn-info', i === timeframe).toggleClass('btn-primary', i !== timeframe);
		});

		// Header: change since the first point of each range
		const changeIds = ['#usdChange24h', '#usdChange7d', '#usdChange30d'];
		changeIds.forEach((id, i) => {
			const series = data[i] || [];
			const first = series.find(row => Number.isFinite(valueOf(row)) && valueOf(row) > 0);
			if (!first) return;

			const difference = (currentPrice * 100 / valueOf(first)) - 100;
			if (!Number.isFinite(difference)) return;

			const text = (difference > 0 ? '+' : '') + difference.toFixed(2) + '%';
			$(id).removeClass('text-success text-danger').html(text).addClass(difference >= 0 ? 'text-success' : 'text-danger');
		});

		const price = usd ?
			'$' + (typeof formatValue === 'function' ? formatValue(prices[TokenState.tokenId], 2, true) : prices[TokenState.tokenId].toFixed(2)) :
			(typeof formatValue === 'function' ? formatValue(currentPrice, 9, true) : currentPrice.toFixed(9)) + ' <span class="erg-span">ERG</span>';
		$('#usdPrice').html(price);

		const points = data[timeframe]
			.map(row => ({ time: chartTime(row.timestamp), value: valueOf(row) }))
			.filter(point => Number.isFinite(point.time) && Number.isFinite(point.value));

		if (Number.isFinite(currentPrice)) {
			points.push({ time: Date.now(), value: currentPrice });
		}

		// Shown first, so the chart is laid out at its real size
		$('#priceInfo').show();
		$('#priceLoading').hide();

		drawPriceChart(document.getElementById('chart'), {
			times: points.map(point => point.time),
			datasets: [{ label: 'Price', values: points.map(point => point.value) }],
			granularity: ['hour', 'day', 'day', 'month', 'month'][timeframe],
			prefix: usd ? '$' : '',
			suffix: usd ? '' : ' ERG'
		});
	},

	// Set external links for the token
	setLinks() {
		if (!TokenState.tokenData || TokenState.isLpToken || !hasTokenUsdPrice()) {
			$('#tokenBuyLink').hide().attr('href', '');
			return;
		}

		let tradeUrl = 'https://dex.mewfinance.com/ergo/swap?base=0000000000000000000000000000000000000000000000000000000000000000&quote=' + TokenState.tokenId;

		$('#tokenBuyLink').show().attr('href', tradeUrl);
	}
};
