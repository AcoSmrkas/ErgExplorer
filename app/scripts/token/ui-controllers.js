import { TokenState } from './state.js';

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

	// Display gainers/losers with timeframe buttons
	printGainersLosers24h() {
		this.printGainersLosers(0);
		$('#showGainersLosers24h').removeClass('btn-primary').addClass('btn-info');
		$('#showGainersLosers7d').removeClass('btn-info').addClass('btn-primary');
		$('#showGainersLosers30d').removeClass('btn-info').addClass('btn-primary');
	},

	printGainersLosers7d() {
		this.printGainersLosers(1);
		$('#showGainersLosers7d').removeClass('btn-primary').addClass('btn-info');
		$('#showGainersLosers24h').removeClass('btn-info').addClass('btn-primary');
		$('#showGainersLosers30d').removeClass('btn-info').addClass('btn-primary');
	},

	printGainersLosers30d() {
		this.printGainersLosers(2);
		$('#showGainersLosers30d').removeClass('btn-primary').addClass('btn-info');
		$('#showGainersLosers24h').removeClass('btn-info').addClass('btn-primary');
		$('#showGainersLosers7d').removeClass('btn-info').addClass('btn-primary');
	},

	// Core gainers/losers display logic
	printGainersLosers(timeframe) {
		if (!TokenState.priceData || TokenState.priceData.length === 0) {
			console.log('[printGainersLosers] No price data available');
			return;
		}

		let data = JSON.parse(JSON.stringify(TokenState.priceData));
		TokenState.chartType = timeframe;

		if (data.length == 0 || data[0].length == 0) {
			console.log('[printGainersLosers] Empty data arrays');
			return;
		}

		// Check if prices global is available
		if (typeof prices === 'undefined' || !prices[TokenState.tokenId]) {
			console.log('[printGainersLosers] Prices not available yet');
			return;
		}

		// Calculate price changes for all timeframes
		for (let i = 0; i < data.length; i++) {
			if (data[i].length == 0) continue;

			let item = data[i][0];
			let oldPrice = TokenState.chartUsd ? item.price : item.price_in_erg;
			let newPrice = TokenState.chartUsd ? prices[TokenState.tokenId] : (prices[TokenState.tokenId] / prices['ERG']);
			let difference = (newPrice * 100 / oldPrice) - 100;

			if (!difference || isNaN(difference)) {
				continue;
			}

			difference = typeof toFixed === 'function' ? toFixed(difference, 2) : difference.toFixed(2);

			let classString = 'text-success';
			if (difference > 0) {
				difference = '+' + difference;
			} else {
				classString = 'text-danger';
			}

			if (i == 2) {
				$('#usdChange30d').removeClass('text-success text-danger').html(difference + '%').addClass(classString);
			}

			if (i == 1) {
				$('#usdChange7d').removeClass('text-success text-danger').html(difference + '%').addClass(classString);
			}

			if (i == 0) {
				$('#usdChange24h').removeClass('text-success text-danger').html(difference + '%').addClass(classString);
			}
		}

		// Get data for selected timeframe
		data = data[timeframe];

		// Display current price
		if (typeof prices !== 'undefined' && prices[TokenState.tokenId]) {
			let price = (TokenState.chartUsd ? '$' + (typeof formatValue === 'function' ? formatValue(prices[TokenState.tokenId], 2, true) : prices[TokenState.tokenId].toFixed(2)) :
				(typeof formatValue === 'function' ? formatValue(prices[TokenState.tokenId] / prices['ERG'], 9, true) : (prices[TokenState.tokenId] / prices['ERG']).toFixed(9)) + ' <span class="erg-span">ERG</span>');
			$('#usdPrice').html(price);
		} else if (data.length > 0) {
			let price = (TokenState.chartUsd ? '$' + (typeof formatValue === 'function' ? formatValue(parseFloat(data[0].price), 2, true) : parseFloat(data[0].price).toFixed(2)) :
				(typeof formatValue === 'function' ? formatValue(data[0].price / prices['ERG'], 9, true) : (data[0].price / prices['ERG']).toFixed(9)) + ' <span class="erg-span">ERG</span>');
			$('#usdPrice').html(price);
		}

		// Add current price to chart data
		if (typeof prices !== 'undefined' && prices[TokenState.tokenId]) {
			data.push({
				'price': prices[TokenState.tokenId],
				'price_in_erg': prices[TokenState.tokenId] / prices['ERG'],
				'timestamp': typeof unixTimestampToDateTimeUTCString === 'function' && typeof getCurrentUTCDate === 'function' ?
					unixTimestampToDateTimeUTCString(getCurrentUTCDate().getTime()) : new Date().toISOString()
			});
		}

		// Destroy old chart if exists
		if (TokenState.chart) {
			TokenState.chart.destroy();
		}

		TokenState.tempDateIndex = 0;

		// Get primary color from CSS
		const rootStyles = getComputedStyle(document.documentElement);
		const primaryColor = rootStyles.getPropertyValue('--main-color').trim();

		// Map function for labels
		const mapLabel = (row, index) => {
			if (TokenState.chartType == 0) {
				return typeof formatTimeString === 'function' && typeof utcToLocal === 'function' ?
					formatTimeString(utcToLocal(row.timestamp)) : row.timestamp;
			} else {
				let dateString = typeof parseDate === 'function' ?
					parseDate(row.timestamp).toLocaleDateString() : new Date(row.timestamp).toLocaleDateString();
				return dateString;
			}
		};

		// Get auto digits helper
		const getAutoDigits = (value) => {
			if (value >= 1) return 2;
			if (value >= 0.1) return 3;
			if (value >= 0.01) return 4;
			return 6;
		};

		// Create chart
		if (document.getElementById('chart') && typeof Chart !== 'undefined') {
			TokenState.chart = new Chart(
				document.getElementById('chart'),
				{
					type: 'line',
					options: {
						responsive: true,
						animation: {
							duration: 1000
						},
						fill: false,
						borderColor: primaryColor,
						plugins: {
							legend: {
								display: false
							},
							tooltip: {
								enabled: true,
								displayColors: false,
								callbacks: {
									label: function (tooltip) {
										let formattedValue = (TokenState.chartUsd ? '$' : '') +
											(typeof nFormatter === 'function' ? nFormatter(tooltip.parsed.y, getAutoDigits(tooltip.parsed.y)) : tooltip.parsed.y) +
											(TokenState.chartUsd ? '' : ' ERG');
										return formattedValue;
									}
								}
							}
						}
					},
					data: {
						labels: data.map(mapLabel),
						datasets: [
							{
								label: '$',
								data: data.map(row => TokenState.chartUsd ? row.price : row.price_in_erg)
							}
						]
					}
				}
			);
		}

		$('#priceInfo').show();
		$('#priceLoading').hide();
	},

	// Set external links for the token
	setLinks() {
		if (TokenState.tokenData.isMeme == 't') {
			$('#spectrumLink').attr('href', 'https://dex.crooks-fi.com/ergo/swap?base=0000000000000000000000000000000000000000000000000000000000000000&quote=' + TokenState.tokenId);
			$('#spectrumLink').html('Crooks Finance <i class="erg-span fa-solid fa-up-right-from-square"></i>');
		} else {
			$('#spectrumLink').attr('href', 'https://dex.mewfinance.com/ergo/swap?base=0000000000000000000000000000000000000000000000000000000000000000&quote=' + TokenState.tokenId);
		}
		$('#cruxLink').attr('href', 'https://cruxfinance.io/tokens/' + TokenState.tokenId);
	}
};