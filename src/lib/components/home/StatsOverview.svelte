<script>
	import { onMount, onDestroy } from 'svelte';
	import { formatNumber, formatCurrency, formatErgValue, formatHashRate } from '$lib/utils/formatting.js';
	import { getTheme } from '$lib/stores/theme.svelte.js';
	import { API_ENDPOINTS } from '$lib/utils/constants.js';
	import * as api from '$lib/utils/api.js';

	// No props needed - component is fully self-contained
	
	// Internal polling data - fetched fresh every time
	let internalNetworkStats = $state(null);
	let internalLatestBlocks = $state([]);
	let internalErgPrice = $state(null);
	let internalProtocolInfo = $state(null);
	
	let theme = $derived(getTheme());
	
	// Internal state for animated values
	let animatedHeight = $state(0);
	let animatedTxCount = $state(0);
	let animatedPrice = $state(0);
	let animatedMarketCap = $state(0);
	
	// Animation states
	let heightAnimating = $state(false);
	let txAnimating = $state(false);
	let priceAnimating = $state(false);
	let marketCapAnimating = $state(false);
	
	let pollInterval;
	const POLL_INTERVAL = 30000; // 60 seconds - less aggressive polling
	
	// Track active animations to prevent leaks
	let activeAnimations = new Set();
	
	// Track if this is the first load
	let hasInitialized = $state(false);
	
	// Use a single effect to handle all data changes and prevent loops
	$effect(() => {
		if (!hasInitialized) return;
		
		// Only trigger when polling brings new data - use a different approach
		// We'll manually trigger animations only when pollForUpdates completes
	});
	
	function animateValue(type, fromValue, toValue) {
		// Cancel any existing animation for this type
		if (activeAnimations.has(type)) {
			return; // Skip if already animating this value
		}
		
		const duration = 800; // Slightly faster animation
		const startTime = Date.now();
		const difference = toValue - fromValue;
		
		// Track this animation
		activeAnimations.add(type);
		
		// Set animation state
		switch (type) {
			case 'height': heightAnimating = true; break;
			case 'txCount': txAnimating = true; break;
			case 'price': priceAnimating = true; break;
			case 'marketCap': marketCapAnimating = true; break;
		}
		
		function animate() {
			// Check if component is still mounted
			if (!activeAnimations.has(type)) {
				return; // Animation was cancelled
			}
			
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);
			
			// Easing function (ease-out)
			const easeProgress = 1 - Math.pow(1 - progress, 3);
			const currentValue = fromValue + (difference * easeProgress);
			
			// Update the animated value
			switch (type) {
				case 'height': animatedHeight = Math.round(currentValue); break;
				case 'txCount': animatedTxCount = Math.round(currentValue); break;
				case 'price': animatedPrice = currentValue; break;
				case 'marketCap': animatedMarketCap = currentValue; break;
			}
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				// Animation complete
				activeAnimations.delete(type);
				switch (type) {
					case 'height': heightAnimating = false; break;
					case 'txCount': txAnimating = false; break;
					case 'price': priceAnimating = false; break;
					case 'marketCap': marketCapAnimating = false; break;
				}
			}
		}
		
		requestAnimationFrame(animate);
	}
	
	async function pollForUpdates() {
		try {
			// Store previous values to detect changes
			const prevHeight = internalLatestBlocks[0]?.height;
			const prevTxCount = internalNetworkStats?.maxTxGix;
			const prevPrice = internalErgPrice ? parseFloat(internalErgPrice.value) : 0;
			const prevMarketCap = (internalErgPrice && internalProtocolInfo) ? 
				(internalProtocolInfo.supply / 1e9) * parseFloat(internalErgPrice.value) : 0;
			
			// Fetch latest data in parallel
			const [networkStatsRes, latestBlocksRes, priceRes, protocolRes] = await Promise.allSettled([
				api.getNetworkStats(),
				fetch(`${API_ENDPOINTS.ERGOPLATFORM}blocks?limit=1&sortBy=height&sortDirection=desc`).then(r => r.json()),
				api.getPrices(),
				api.getProtocolInfo()
			]);
			
			// Update internal network stats
			if (networkStatsRes.status === 'fulfilled' && networkStatsRes.value) {
				internalNetworkStats = networkStatsRes.value;
			}
			
			// Update internal latest blocks
			if (latestBlocksRes.status === 'fulfilled' && latestBlocksRes.value?.items?.length > 0) {
				internalLatestBlocks = latestBlocksRes.value.items;
			}
			
			// Update internal ERG price
			if (priceRes.status === 'fulfilled' && priceRes.value) {
				internalErgPrice = priceRes.value;
			}
			
			// Update internal protocol info
			if (protocolRes.status === 'fulfilled' && protocolRes.value) {
				console.log(protocolRes.value)
				internalProtocolInfo = protocolRes.value;
			}
			
			// Only animate if this is not the first load and values actually changed
			if (hasInitialized) {
				// Check for height changes - only animate if higher
				if (internalLatestBlocks[0]?.height && internalLatestBlocks[0].height > prevHeight) {
					animateValue('height', animatedHeight, internalLatestBlocks[0].height);
				}
				
				// Check for tx count changes - only animate if higher
				if (internalNetworkStats?.maxTxGix && internalNetworkStats.maxTxGix > prevTxCount) {
					animateValue('txCount', animatedTxCount, internalNetworkStats.maxTxGix);
				}
				
				// Check for price changes
				if (internalErgPrice) {
					const newPrice = parseFloat(internalErgPrice.value);
					if (newPrice !== prevPrice) {
						animateValue('price', animatedPrice, newPrice);
					}
				}
				
				// Check for market cap changes
				if (internalErgPrice && internalProtocolInfo) {
					const newMarketCap = (internalProtocolInfo.supply / 1e9) * parseFloat(internalErgPrice.value);
					if (Math.abs(newMarketCap - prevMarketCap) > 0.01) {
						animateValue('marketCap', animatedMarketCap, newMarketCap);
					}
				}
			}
			
		} catch (err) {
			console.warn('Failed to poll for updates:', err);
		}
	}
	
	onMount(async () => {
		// Load initial data immediately
		await pollForUpdates();
		
		// Animate initial values from 0 to loaded values after first data load
		setTimeout(() => {
			if (internalLatestBlocks.length > 0) {
				animateValue('height', 0, internalLatestBlocks[0].height);
			}
			if (internalNetworkStats?.maxTxGix) {
				animateValue('txCount', 0, internalNetworkStats.maxTxGix);
			}
			if (internalErgPrice) {
				animateValue('price', 0, parseFloat(internalErgPrice.value));
			}
			if (internalErgPrice && internalProtocolInfo) {
				const marketCap = (internalProtocolInfo.supply / 1e9) * parseFloat(internalErgPrice.value);
				animateValue('marketCap', 0, marketCap);
			}
			
			// Mark as initialized after first animation starts
			hasInitialized = true;
		}, 300);
		
		// Start polling
		pollInterval = setInterval(pollForUpdates, POLL_INTERVAL);
	});
	
	onDestroy(() => {
		if (pollInterval) {
			clearInterval(pollInterval);
		}
	});
	
	function getLogoSrc() {
		return theme === 'mew' ? '/images/logo-new-mew.png' : '/images/logo-new.png';
	}
</script>


<div class="row w-100 div-cell-dark"><!-- Column 1 -->
<div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3">
	<!-- ERG Price -->
	<div class="d-flex align-items-stretch">
		<div class="me-3 d-flex align-items-center justify-content-center index-card-symbol-holder">
			<img id="erg-logo" src={getLogoSrc()} alt="Ergo coin" style="width:auto; height:48px;">
		</div>
		<div class="d-flex flex-column justify-content-between flex-grow-1 box-holder py-2">
			<p class="mb-1">
				<span class="erg-span"><b>ERG</b></span> price
			</p>
			<div class="d-flex align-items-center gap-2">
				<h2 class="text-strong index-card-values mb-0 {priceAnimating ? 'value-animating' : ''}">
					{#if animatedPrice > 0}
						{formatCurrency(animatedPrice, 2)}
					{:else}
						--
					{/if}
				</h2>
				{#if internalErgPrice && internalErgPrice.difference}
					<span class="price-change {parseFloat(internalErgPrice.difference) >= 0 ? 'positive' : 'negative'}">
						{parseFloat(internalErgPrice.difference) >= 0 ? '+' : ''}{formatNumber(parseFloat(internalErgPrice.difference), 2)}%
					</span>
				{/if}
			</div>
		</div>
	</div>

	<hr class="my-3">

	<!-- Market Cap -->
	<div class="d-flex align-items-stretch">
		<div class="me-3 d-flex align-items-center justify-content-center index-card-symbol-holder">
			<i class="fas fa-globe erg-span index-card-symbol"></i>
		</div>
		<div class="d-flex flex-column justify-content-between flex-grow-1 box-holder py-2">
			<p class="mb-1 d-flex align-items-center">
				<strong class="erg-span me-1"></strong>Market cap
			</p>
			<h2 class="text-strong index-card-values mb-0 d-flex align-items-center {marketCapAnimating ? 'value-animating' : ''}">
				{animatedMarketCap > 0 ? formatCurrency(animatedMarketCap, 0) : '--'}
			</h2>
		</div>
	</div>
</div>

<!-- Spacer for mobile -->
<hr class="my-3 d-block d-md-none">

<!-- Column 2 -->
<div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3">
	<!-- Block Height -->
	<div class="d-flex align-items-stretch">
		<div class="me-3 d-flex align-items-center justify-content-center index-card-symbol-holder">
			<i class="fas fa-bars erg-span index-card-symbol"></i>
		</div>
		<div class="d-flex flex-column justify-content-between flex-grow-1 box-holder py-2">
			<p class="mb-1">Block height</p>
			<h2 class="text-strong index-card-values mb-0 {heightAnimating ? 'value-animating' : ''}">
				{animatedHeight > 0 ? formatNumber(animatedHeight, 0) : '--'}
			</h2>
		</div>
	</div>

	<hr class="my-3">

	<!-- Total Transactions -->
	<div class="d-flex align-items-stretch">
		<div class="me-3 d-flex align-items-center justify-content-center index-card-symbol-holder">
			<i class="fas fa-list erg-span index-card-symbol"></i>
		</div>
		<div class="d-flex flex-column justify-content-between flex-grow-1 box-holder py-2">
			<p class="mb-1">
				<strong class="erg-span"></strong>Total transactions
			</p>
			<h2 class="text-strong index-card-values mb-0 {txAnimating ? 'value-animating' : ''}">
				{animatedTxCount > 0 ? formatNumber(animatedTxCount, 0) : '--'}
			</h2>
		</div>
	</div>
</div>

	<hr class="my-3 d-block d-lg-none">
	<div class="col p-1 ps-lg-3 border-lg-start">
		<h2 class="erg-span" style="font-size:1.7em; margin-bottom: 16px;">Protocol information</h2>
		
		<h5 style="font-size:1em" class="text-light">Version: <span class="text-white">{internalProtocolInfo?.version || '--'}</span></h5>
		<h5 style="font-size:1em" class="text-light">Hashrate: <span class="text-white">{internalProtocolInfo?.hashRate ? formatHashRate(internalProtocolInfo?.hashRate) : '--'}</span></h5>
		<h5 style="font-size:1em" class="text-light">Circulating Supply: <span class="text-white">
			{@html internalProtocolInfo?.supply ? formatErgValue(internalProtocolInfo.supply / 1e9, 0) : '--'}
		</span></h5>
		<h5 style="font-size:1em" class="text-light mb-0">Max Supply: <span class="text-white">97,739,924 <span class="erg-span">ERG</span></span></h5>
	</div>
</div>

<style>
	.price-change {
		font-size: 0.8em;
		font-weight: 600;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.box-holder > p {
		margin-top: -2px;
	}

	.box-holder > h2,
	.box-holder > div {
		margin-top: -3px;
	}
</style>