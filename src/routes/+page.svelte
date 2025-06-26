<script>
	import { onMount } from 'svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import StatsOverview from '$lib/components/home/StatsOverview.svelte';
	import TokenTables from '$lib/components/home/TokenTables.svelte';
	import WhaleTransactions from '$lib/components/home/WhaleTransactions.svelte';
	import LatestBlocks from '$lib/components/home/LatestBlocks.svelte';
	import DailyStats from '$lib/components/home/DailyStats.svelte';
	import { isTestnet } from '$lib/stores/network.svelte.js';
	import { ergPrice, currentPrices } from '$lib/stores/priceStore.js';
	import * as api from '$lib/utils/api.js';
	
	// Client-side state for all data  
	let ergPriceValue = null;
	let currentPricesValue = {};
	let networkStats = null;
	let protocolInfo = null;
	let statsData = null;
	let latestBlocks = [];
	let topVolumeTokens = [];
	let priceHistoryData = null;
	let whaleTxs = [];
	let gainersLosersData = [];
	let selectedPeriod = '24h';
	let loading = true;
	let error = null;
	
	// Subscribe to price stores
	ergPrice.subscribe(price => {
		ergPriceValue = price;
	});
	
	currentPrices.subscribe(prices => {
		console.log(prices)
		currentPricesValue = prices;
	});

	onMount(async () => {
		try {
			loading = true;
			error = null;
			
			// Load essential data first (network stats, protocol info)
			loadEssentialData();
			
			// Load secondary data with individual loading states
			loadSecondaryData();
			
		} catch (err) {
			console.error('Failed to load homepage data:', err);
			error = 'Failed to load page data';
			loading = false;
		}
	});
	
	async function loadEssentialData() {
		try {
			// Load critical data that affects page layout
			const [networkStatsRes, protocolInfoRes] = await Promise.allSettled([
				api.getNetworkStats(),
				api.getProtocolInfo()
			]);
			
			networkStats = networkStatsRes.status === 'fulfilled' ? networkStatsRes.value : null;
			protocolInfo = protocolInfoRes.status === 'fulfilled' ? protocolInfoRes.value : null;
			
			// Essential data loaded, stop main loading
			loading = false;
			
		} catch (err) {
			console.warn('Failed to load essential data:', err);
			loading = false;
		}
	}
	
	async function loadSecondaryData() {
		// Load each data source independently and update UI as they complete
		
		// Load 24h stats
		api.getStats().then(data => {
			if (data) statsData = data;
		}).catch(err => console.warn('Failed to load stats:', err));
		
		// Load latest blocks
		fetch(`${api.API_ENDPOINTS.ERGOPLATFORM}blocks?limit=5&sortBy=height&sortDirection=desc`)
			.then(r => r.json())
			.then(data => {
				if (data?.items) latestBlocks = data.items;
			})
			.catch(err => console.warn('Failed to load blocks:', err));
		
		// Load top volume tokens
		api.getTopVolumeTokens().then(data => {
			if (data?.items) {
				const uniqueTokens = [];
				const seenAssets = new Set();
				for (const token of data.items) {
					if (!seenAssets.has(token.asset) && uniqueTokens.length < 10) {
						seenAssets.add(token.asset);
						uniqueTokens.push(token);
					}
				}
				topVolumeTokens = uniqueTokens;
			}
		}).catch(err => console.warn('Failed to load top volume tokens:', err));
		
		// Load whale transactions (only on mainnet)
		if (!isTestnet()) {
			api.getWhaleTxs().then(data => {
				if (data?.items) {
					whaleTxs = data.items;
				}
			}).catch(err => console.warn('Failed to load whale transactions:', err));
		}
		
		// Load price history for gainers/losers (depends on current prices)
		api.getPriceHistory().then(data => {
			if (data) {
				priceHistoryData = data;
				processGainersLosers();
			}
		}).catch(err => console.warn('Failed to load price history:', err));
	}
	
	
	function processGainersLosers() {
		if (!priceHistoryData?.items || !ergPriceValue) return;
		
		// Calculate time periods like the original
		const nowTime = Date.now();
		const from24h = nowTime - (24 * 60 * 60 * 1000);
		const from7d = nowTime - (7 * 24 * 60 * 60 * 1000);
		const from30d = nowTime - (30 * 24 * 60 * 60 * 1000);
		
		let targetTime;
		switch (selectedPeriod) {
			case '24h': targetTime = from24h; break;
			case '7d': targetTime = from7d; break;
			case '30d': targetTime = from30d; break;
			default: targetTime = from24h;
		}
		
		// Find the closest timestamp in the cached data to our target
		let closestTimestamp = null;
		let smallestDiff = Infinity;
		
		for (const item of priceHistoryData.items) {
			const diff = Math.abs(item.originaltimestamp - targetTime);
			if (diff < smallestDiff) {
				smallestDiff = diff;
				closestTimestamp = item.originaltimestamp;
			}
		}
		
		// Process tokens for the closest timestamp
		const processedTokens = [];
		
		for (const item of priceHistoryData.items) {
			if (item.ticker === 'ERG' || item.originaltimestamp !== closestTimestamp) continue;
			
			const oldPrice = parseFloat(item.price);
			const newPrice = currentPricesValue[item.tokenid];
			
			if (newPrice && oldPrice && newPrice > 0 && oldPrice > 0) {
				let difference = (newPrice * 100 / oldPrice) - 100;
				if (difference === 0) {
					difference = 0.000001; // Avoid zero values like original
				}
				
				processedTokens.push({
					...item,
					currentPrice: newPrice,
					difference: parseFloat(difference.toFixed(2))
				});
			}
		}
		
		// Sort by difference (highest to lowest)
		processedTokens.sort((a, b) => b.difference - a.difference);
		
		// Remove duplicates and take top 5 gainers and top 5 losers
		const uniqueProcessed = [];
		const seenTokenIds = new Set();
		for (const token of processedTokens) {
			if (!seenTokenIds.has(token.tokenid)) {
				seenTokenIds.add(token.tokenid);
				uniqueProcessed.push(token);
			}
		}
		
		gainersLosersData = [
			...uniqueProcessed.slice(0, 5),
			...uniqueProcessed.slice(-5)
		].filter((token, index, arr) => 
			// Final dedup in case top and bottom overlap
			arr.findIndex(t => t.tokenid === token.tokenid) === index
		);
	}
	
	function handlePeriodChange(period) {
		selectedPeriod = period;
		processGainersLosers();
	}
	
</script>

<svelte:head>
	<title>Erg Explorer - Ergo Blockchain Explorer</title>
</svelte:head>

{#if error}
	<ErrorMessage message={error} type="warning" dismissible />
{/if}

<StatsOverview ergPrice={ergPriceValue} {protocolInfo} {latestBlocks} {networkStats} />

<TokenTables {topVolumeTokens} {gainersLosersData} {selectedPeriod} onPeriodChange={handlePeriodChange} />	
	
<WhaleTransactions {whaleTxs} currentPrices={currentPricesValue} />

<LatestBlocks {latestBlocks} />

<br>

<DailyStats {statsData} ergPrice={ergPriceValue} />

<br>

