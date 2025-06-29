<script>
	import CopyButton from './CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	
	export let tokenId = '';
	export let tokenName = ''; // Token name if available
	export let name = ''; // Optional display name override
	export let startChars = 8; // Characters to show at start for ID
	export let endChars = 4; // Characters to show at end for ID
	export let showCopy = true; // Whether to show copy button
	export let linkClass = 'token-link'; // CSS class for the link
	export let showIcon = true; // Whether to show token icon
	
	// Format the display text - priority: name prop, then token name, then formatted tokenId
	$: displayText = name || tokenName || (tokenId ? 
		formatAddress(tokenId, startChars, endChars) : 'Unknown Token');
	
	$: tokenUrl = `/tokens/${tokenId}`;
	
	// Get token icon/title params if showing icon
	$: tokenDisplay = showIcon && tokenId ? 
		getAssetTitleParams(null, tokenId, tokenName, true) : 
		displayText;
	
</script>

{#if tokenId}
	<span class="token-link-wrapper">
		<a 
			class={linkClass} 
			href={tokenUrl} 
			data-token-id={tokenId}
		>
			{#if showIcon}
				{@html tokenDisplay}
			{:else}
				{displayText}
			{/if}
		</a>
		{#if showCopy}
			<CopyButton 
				text={tokenId} 
				label="Copy token ID to clipboard"
				successMessage="Token ID copied to clipboard!"
				errorMessage="Failed to copy token ID."
				inline={true}
				size="small"
			/>
		{/if}
	</span>
{:else}
	<span class="text-muted">N/A</span>
{/if}

<style>
	.token-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	
	.token-link-wrapper:hover :global(.copy-btn-inline) {
		opacity: 1;
	}
</style>