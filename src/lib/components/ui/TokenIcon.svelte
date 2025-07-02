<script>
	import { getTokenIcon, hasTokenIcon } from '$lib/stores/tokenIconsStore.js';
	import { API_ENDPOINTS } from '$lib/utils/constants.js';
	
	export let tokenId;
	export let name = '';
	export let showIcon = true;
	export let iconClass = 'token-icon me-2';
	export let fallbackToInitial = false;
	
	let imageLoaded = false;
	let imageError = false;
	
	$: iconUrl = getTokenIcon(tokenId);
	$: hasIcon = hasTokenIcon(tokenId);
	
	// Special cases for specific tokens
	$: specialIconUrl = (() => {
		if (name === "Crooks Finance Stake Key") {
			return "https://crooks-fi.com/images/logo.png";
		}
		if (name === "Mew Fun Lottery Ticket") {
			return `${API_ENDPOINTS.ERGEXPLORER}nftcache/bafybeie6z4zm7ahjvlawjfq4idojdrahklksygpfmb4zvlrx3id3h5dyty.png`;
		}
		return null;
	})();
	
	$: finalIconUrl = specialIconUrl || iconUrl;
	$: shouldShowIcon = showIcon && finalIconUrl && !imageError;
	
	function handleImageLoad() {
		imageLoaded = true;
		imageError = false;
	}
	
	function handleImageError() {
		imageError = true;
		imageLoaded = false;
	}
	
	// Reset error state when icon URL changes
	$: if (finalIconUrl) {
		imageError = false;
		imageLoaded = false;
	}
</script>

{#if shouldShowIcon}
	<img 
		class={iconClass}
		src={finalIconUrl}
		alt={name || tokenId}
		on:load={handleImageLoad}
		on:error={handleImageError}
		style:opacity={imageLoaded ? 1 : 0}
		style:transition="opacity 0.2s ease"
	/>
{/if}