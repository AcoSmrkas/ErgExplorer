<script>
	import TopVolumeTokens from './TopVolumeTokens.svelte';
	import GainersLosers from './GainersLosers.svelte';
	import { getCachedToken } from '$lib/stores/tokenCache.js';

	export let topVolumeTokens = [];
	export let gainersLosersData = [];
	export let selectedPeriod = '24h';
	export let onPeriodChange = () => {};

	// Token popup state
	let showTokenPopup = false;
	let popupX = 0;
	let popupY = 0;
	let popupToken = null;
	let popupTokenId = '';
	let popupTokenName = '';
	let popupTokenPrice = null;
	let hoverTimeout = null;

	// Handle token hover with data fetching
	async function handleTokenHover(event) {
		const link = event.target.closest('[data-token-id]');
		if (link) {
			const tokenId = link.dataset.tokenId;
			const tokenName = link.dataset.tokenName;
			
			// Clear any existing timeout
			if (hoverTimeout) {
				clearTimeout(hoverTimeout);
			}
			
			// Set popup position
			popupX = event.clientX + 15;
			popupY = event.clientY - 10;
			
			// Show basic popup immediately
			popupTokenId = tokenId;
			popupTokenName = tokenName;
			popupTokenPrice = null; // currentPrices[tokenId];
			showTokenPopup = true;
			
			// Fetch detailed token data using global cache
			try {
				const token = await getCachedToken(tokenId);
				if (token && showTokenPopup && popupTokenId === tokenId) {
					popupToken = token;
				}
			} catch (error) {
				console.warn('Failed to fetch token details:', error);
			}
		}
	}

	function hideTokenPopup() {
		hoverTimeout = setTimeout(() => {
			showTokenPopup = false;
		}, 100); // Small delay to prevent flicker
	}

	function cancelHidePopup() {
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
	}
</script>

<div class="row w-100 mt-3" role="region" aria-label="Token data tables" onmouseover={handleTokenHover} onmouseleave={hideTokenPopup} onfocus={handleTokenHover}>
	<TopVolumeTokens {topVolumeTokens} />
	<GainersLosers {gainersLosersData} {selectedPeriod} {onPeriodChange} />
</div>