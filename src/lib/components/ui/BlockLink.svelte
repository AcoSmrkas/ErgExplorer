<script>
	import CopyButton from './CopyButton.svelte';
	import { formatAddress, formatNumber } from '$lib/utils/formatting.js';
	
	export let blockId = '';
	export let blockHeight = null; // Can show block height instead of ID
	export let name = ''; // Optional display name
	export let startChars = 8; // Characters to show at start for ID
	export let endChars = 4; // Characters to show at end for ID
	export let showCopy = true; // Whether to show copy button
	export let linkClass = 'block-link'; // CSS class for the link
	export let preferHeight = false; // Show height instead of ID when both available
	export let onlyHeight = false;
	
	// Determine what to display and what URL to use
	$: {
		if (preferHeight && blockHeight !== null) {
			displayText = name || `${onlyHeight === true ? '' : 'Block #'}${formatNumber(blockHeight)}`;
			blockUrl = `/blocks/${blockId}`;
			copyText = blockHeight.toString();
		} else if (blockId) {
			displayText = name || formatAddress(blockId, startChars, endChars);
			blockUrl = `/blocks/${blockId}`;
			copyText = blockId;
		} else if (blockHeight !== null) {
			displayText = name || `${onlyHeight === true ? '' : 'Block #'}${formatNumber(blockHeight)}`;
			blockUrl = `/blocks/${blockId}`;
			copyText = blockHeight.toString();
		} else {
			displayText = 'Unknown Block';
			blockUrl = '#';
			copyText = '';
		}
	}
	
	let displayText, blockUrl, copyText;
	
</script>

{#if blockId || blockHeight !== null}
	<span class="block-link-wrapper">
		<a 
			class={linkClass} 
			href={blockUrl} 
			data-block-id={blockId}
			data-block-height={blockHeight}
		>
			{displayText}
		</a>
		{#if showCopy && copyText}
			<CopyButton 
				text={copyText} 
				label="Copy {preferHeight && blockHeight !== null ? 'block height' : 'block ID'} to clipboard"
				successMessage="{preferHeight && blockHeight !== null ? 'Block height' : 'Block ID'} copied to clipboard!"
				errorMessage="Failed to copy {preferHeight && blockHeight !== null ? 'block height' : 'block ID'}."
				inline={true}
				size="small"
			/>
		{/if}
	</span>
{:else}
	<span class="text-muted">N/A</span>
{/if}

<style>
	.block-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	
	.block-link-wrapper:hover :global(.copy-btn-inline) {
		opacity: 1;
	}
</style>