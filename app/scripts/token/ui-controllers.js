import { TokenState } from './state.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_BUTTONS = [
	'#showGainersLosers24h',
	'#showGainersLosers7d',
	'#showGainersLosers30d',
	'#showGainersLosers1y',
	'#showGainersLosersAll'
];

// The API sends UTC timestamps without a zone ("2026-11-23 02:00:00.000")
function chartTime(timestamp) {
	const text = String(timestamp).trim().replace(' ', 'T');
	return Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(text) ? text : text + 'Z');
}

const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉';

// 0.0000355 → 0.0₄355, so tiny prices stay short on the axis and in the tooltip
function compactZeros(text) {
	const match = /^(-?\$?)0\.(0{4,})(\d+)$/.exec(text);
	if (!match) return text;
	const count = String(match[2].length).split('').map(d => SUBSCRIPT_DIGITS[d]).join('');
	return match[1] + '0.0' + count + match[3];
}

// Large values as 1.2K / 3.4M so the axis stays narrow
function compactLarge(value) {
	const abs = Math.abs(value);
	const units = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
	for (const [size, symbol] of units) {
		if (abs >= size) {
			return (value / size).toLocaleString('en-US', { maximumFractionDigits: abs / size >= 100 ? 0 : 2 }) + symbol;
		}
	}
	return null;
}

// Small prices keep a few significant digits instead of turning into 3.5E-5
function formatChartPrice(value, digits = 3) {
	if (!Number.isFinite(value)) return '';
	const abs = Math.abs(value);
	if (abs === 0) return '0';
	if (abs >= 100000) return compactLarge(value);
	if (abs >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
	if (abs >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });

	const decimals = Math.min(20, Math.ceil(-Math.log10(abs)) + digits - 1);
	return compactZeros(value.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, ''));
}

// Axis labels share one number of decimals, taken from the tick step
function formatTick(value, step) {
	if (value === 0) return '0';
	if (Math.abs(value) >= 10000) return compactLarge(value);
	if (!Number.isFinite(step) || step <= 0) return formatChartPrice(value);
	const decimals = Math.min(20, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));
	return compactZeros(value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));
}

function cssColor(name, fallback) {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	return value || fallback;
}

// Any CSS colour as rgba() with the given alpha
function withAlpha(color, alpha) {
	const context = document.createElement('canvas').getContext('2d');
	context.fillStyle = color;
	const normalized = context.fillStyle;

	if (normalized.startsWith('#')) {
		const r = parseInt(normalized.slice(1, 3), 16);
		const g = parseInt(normalized.slice(3, 5), 16);
		const b = parseInt(normalized.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	const parts = normalized.match(/[\d.]+/g) || [0, 0, 0];
	return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}

function formatAxisDate(time, timeframe) {
	const date = new Date(time);
	if (timeframe === 0) {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
	}
	if (timeframe <= 2) {
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}
	return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
}

function formatTooltipDate(time, timeframe) {
	const date = new Date(time);
	if (timeframe >= 3) {
		return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
	}
	return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function drawPriceChart(points, timeframe, usd) {
	const canvas = document.getElementById('chart');
	if (!canvas || typeof Chart === 'undefined') return;

	if (TokenState.chart) {
		TokenState.chart.destroy();
	}

	const lineColor = cssColor('--main-color', '#e8692c');
	const textColor = cssColor('--text-light', '#999');
	const gridColor = withAlpha(cssColor('--borders', '#4f4f4f'), 0.45);
	const narrow = window.matchMedia('(max-width: 575.98px)').matches;

	TokenState.chart = new Chart(canvas, {
		type: 'line',
		data: {
			labels: points.map(point => point.time),
			datasets: [{
				data: points.map(point => point.value),
				borderColor: lineColor,
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 4,
				pointHoverBackgroundColor: lineColor,
				pointHoverBorderColor: '#fff',
				pointHoverBorderWidth: 1.5,
				tension: 0,
				spanGaps: true,
				fill: 'start',
				backgroundColor: (context) => {
					const { ctx, chartArea } = context.chart;
					if (!chartArea) return withAlpha(lineColor, 0.15);
					const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
					gradient.addColorStop(0, withAlpha(lineColor, 0.28));
					gradient.addColorStop(1, withAlpha(lineColor, 0));
					return gradient;
				}
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: 300 },
			interaction: { mode: 'index', intersect: false },
			layout: { padding: { top: 6 } },
			plugins: {
				legend: { display: false },
				tooltip: {
					displayColors: false,
					callbacks: {
						title: (items) => items.length ? formatTooltipDate(points[items[0].dataIndex].time, timeframe) : '',
						label: (item) => usd ? '$' + formatChartPrice(item.parsed.y, 4) : formatChartPrice(item.parsed.y, 4) + ' ERG'
					}
				}
			},
			scales: {
				x: {
					grid: { display: false },
					border: { color: gridColor },
					ticks: {
						color: textColor,
						font: { size: narrow ? 10 : 12 },
						// First and last labels sit inside the plot, so no empty strip on the left
						align: 'inner',
						maxRotation: 0,
						autoSkip: true,
						autoSkipPadding: 24,
						maxTicksLimit: narrow ? 4 : 7,
						callback: (value) => points[value] ? formatAxisDate(points[value].time, timeframe) : ''
					}
				},
				y: {
					position: 'right',
					bounds: 'data',
					// 5% headroom without the axis going below zero
					afterDataLimits: (scale) => {
						const pad = (scale.max - scale.min) * 0.05 || Math.abs(scale.max) * 0.05;
						scale.max += pad;
						scale.min = Math.max(0, scale.min - pad);
					},
					grid: { color: gridColor },
					border: { display: false },
					ticks: {
						color: textColor,
						font: { size: narrow ? 10 : 12 },
						padding: narrow ? 4 : 8,
						maxTicksLimit: narrow ? 5 : 6,
						callback: (value, index, ticks) => {
							// With bounds: 'data' the first and last ticks sit on the data edges; only label round ones
							const step = ticks.length > 2 ? Math.abs(ticks[2].value - ticks[1].value) :
								ticks.length > 1 ? Math.abs(ticks[1].value - ticks[0].value) : NaN;
							const edge = index === 0 || index === ticks.length - 1;
							if (edge && Number.isFinite(step) && step > 0 && Math.abs(value / step - Math.round(value / step)) > 1e-6) {
								return '';
							}
							return (usd ? '$' : '') + formatTick(value, step);
						}
					}
				}
			}
		}
	});
}

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

		drawPriceChart(points, timeframe, usd);

		$('#priceInfo').show();
		$('#priceLoading').hide();
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
