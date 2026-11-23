// The price line chart shared by the token and oracle pages (Chart.js 4, loaded by the page)

const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉';

// The API sends UTC timestamps without a zone ("2026-11-23 02:00:00.000")
export function chartTime(timestamp) {
	if (typeof timestamp === 'number') return timestamp;
	const text = String(timestamp).trim().replace(' ', 'T');
	return Date.parse(/Z$|[+-]\d\d:?\d\d$/.test(text) ? text : text + 'Z');
}

// 0.0000355 → 0.0₄355, so tiny prices stay short on the axis and in the tooltip
function compactZeros(text) {
	const match = /^(-?)0\.(0{4,})(\d+)$/.exec(text);
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
export function formatChartPrice(value, digits = 3) {
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

// Round tick values (1, 2 or 5 × 10^n apart) inside [min, max]
function roundTicks(min, max, count) {
	const range = max - min;
	if (!(range > 0)) return [{ value: min }];

	const raw = range / Math.max(1, count - 1);
	const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
	const residual = raw / magnitude;
	const step = (residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10) * magnitude;
	const ticks = [];

	for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step) {
		// Strip float noise (0.30000000000000004)
		ticks.push({ value: Number(value.toPrecision(12)) });
	}

	return ticks;
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

const HOUR_MS = 3600000;
const DAY_MS = 24 * HOUR_MS;
// Calendar steps for the time axis: [approximate length, unit, count]
const TIME_STEPS = [
	[HOUR_MS, 'hour', 1], [2 * HOUR_MS, 'hour', 2], [3 * HOUR_MS, 'hour', 3], [6 * HOUR_MS, 'hour', 6], [12 * HOUR_MS, 'hour', 12],
	[DAY_MS, 'day', 1], [2 * DAY_MS, 'day', 2], [7 * DAY_MS, 'week', 1], [14 * DAY_MS, 'week', 2],
	[30 * DAY_MS, 'month', 1], [61 * DAY_MS, 'month', 2], [91 * DAY_MS, 'month', 3], [182 * DAY_MS, 'month', 6],
	[365 * DAY_MS, 'year', 1], [730 * DAY_MS, 'year', 2], [1826 * DAY_MS, 'year', 5]
];

function advance(date, unit, count) {
	if (unit === 'hour') date.setHours(date.getHours() + count);
	else if (unit === 'day') date.setDate(date.getDate() + count);
	else if (unit === 'week') date.setDate(date.getDate() + 7 * count);
	else if (unit === 'month') date.setMonth(date.getMonth() + count);
	else date.setFullYear(date.getFullYear() + count);
}

// Ticks on whole local hours, days, Mondays, months or years, at most `count`, none hugging an edge
function timeTicks(min, max, count) {
	const span = max - min;
	if (!(span > 0)) return { ticks: [{ value: min }], unit: 'hour' };

	const [, unit, step] = TIME_STEPS.find(([length]) => span / length <= count) || TIME_STEPS[TIME_STEPS.length - 1];
	const date = new Date(min);

	date.setMinutes(0, 0, 0);
	if (unit === 'hour') {
		date.setHours(Math.floor(date.getHours() / step) * step);
	} else {
		date.setHours(0);
		if (unit === 'week') date.setDate(date.getDate() - (date.getDay() + 6) % 7);
		if (unit === 'month' || unit === 'year') date.setDate(1);
		if (unit === 'month') date.setMonth(Math.floor(date.getMonth() / step) * step);
		if (unit === 'year') date.setMonth(0);
		if (unit === 'year') date.setFullYear(Math.floor(date.getFullYear() / step) * step);
	}

	const margin = span * 0.04;
	const ticks = [];

	for (; date.getTime() <= max; advance(date, unit, step)) {
		const time = date.getTime();
		if (time >= min + margin && time <= max - margin) ticks.push({ value: time });
	}

	return { ticks, unit };
}

function formatAxisDate(time, unit) {
	const date = new Date(time);
	if (unit === 'hour') {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
	}
	if (unit === 'day' || unit === 'week') {
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}
	if (unit === 'month') {
		return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
	}
	return String(date.getFullYear());
}

function formatTooltipDate(time, withTime) {
	const date = new Date(time);
	if (!withTime) {
		return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
	}
	return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Draws (or redraws) the chart on the canvas.
 *   times:       x values (ms), oldest first
 *   datasets:    [{ label, values }] aligned with times; the first is the main, filled line
 *   granularity: 'hour' | 'day' | 'month'; 'month' charts show dates only in the tooltip
 *   prefix / suffix: around values ('$', ' ERG'); the axis shows the prefix only
 *   tooltipTime: show the time of day in the tooltip for 'month' charts too (exact points)
 */
export function drawPriceChart(canvas, { times, datasets, granularity, prefix = '', suffix = '', tooltipTime = false }) {
	if (!canvas || typeof Chart === 'undefined') return null;

	const previous = Chart.getChart(canvas);
	if (previous) previous.destroy();

	const lineColor = cssColor('--main-color', '#e8692c');
	const textColor = cssColor('--text-light', '#999');
	const gridColor = withAlpha(cssColor('--borders', '#4f4f4f'), 0.45);
	const narrow = window.matchMedia('(max-width: 575.98px)').matches;
	const several = datasets.length > 1;
	const showTime = granularity !== 'month' || tooltipTime;
	let axisUnit = 'hour';

	const chartDatasets = datasets.map((dataset, index) => {
		const main = index === 0;
		const color = main ? lineColor : textColor;

		return {
			label: dataset.label,
			// x is the time itself, so uneven points (sampled oracle refreshes) sit where they belong
			data: dataset.values.map((value, i) => ({ x: times[i], y: value })),
			borderColor: color,
			borderWidth: main ? 2 : 1.5,
			pointRadius: 0,
			pointHoverRadius: main ? 4 : 3,
			pointHoverBackgroundColor: color,
			pointHoverBorderColor: '#fff',
			pointHoverBorderWidth: 1.5,
			pointStyle: 'line',
			tension: 0,
			spanGaps: true,
			order: main ? 0 : 1,
			fill: main ? 'start' : false,
			backgroundColor: main ? (context) => {
				const { ctx, chartArea } = context.chart;
				if (!chartArea) return withAlpha(lineColor, 0.15);
				const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
				gradient.addColorStop(0, withAlpha(lineColor, 0.28));
				gradient.addColorStop(1, withAlpha(lineColor, 0));
				return gradient;
			} : color
		};
	});

	return new Chart(canvas, {
		type: 'line',
		data: {
			datasets: chartDatasets
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			animation: { duration: 300 },
			interaction: { mode: 'index', intersect: false },
			layout: { padding: { top: 6 } },
			plugins: {
				legend: {
					display: several,
					align: 'start',
					labels: { color: textColor, usePointStyle: true, boxWidth: 18, padding: 12 }
				},
				tooltip: {
					displayColors: several,
					callbacks: {
						title: (items) => items.length ? formatTooltipDate(times[items[0].dataIndex], showTime) : '',
						label: (item) => {
							const value = prefix + formatChartPrice(item.parsed.y, 4) + suffix;
							return several ? item.dataset.label + ': ' + value : value;
						}
					}
				}
			},
			scales: {
				x: {
					type: 'linear',
					min: times[0],
					max: times[times.length - 1],
					afterBuildTicks: (scale) => {
						const built = timeTicks(scale.min, scale.max, narrow ? 5 : 8);
						axisUnit = built.unit;
						scale.ticks = built.ticks;
					},
					grid: { display: false },
					border: { color: gridColor },
					ticks: {
						color: textColor,
						font: { size: narrow ? 10 : 12 },
						maxRotation: 0,
						autoSkip: true,
						autoSkipPadding: 16,
						callback: (value) => formatAxisDate(value, axisUnit)
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
					// Chart.js offsets ticks from the data's minimum when the axis fits the data
					afterBuildTicks: (scale) => {
						scale.ticks = roundTicks(scale.min, scale.max, narrow ? 5 : 6);
					},
					grid: { color: gridColor },
					border: { display: false },
					ticks: {
						color: textColor,
						font: { size: narrow ? 10 : 12 },
						padding: narrow ? 4 : 8,
						callback: (value, index, ticks) => {
							const step = ticks.length > 1 ? Math.abs(ticks[1].value - ticks[0].value) : NaN;
							return prefix + formatTick(value, step);
						}
					}
				}
			}
		}
	});
}
