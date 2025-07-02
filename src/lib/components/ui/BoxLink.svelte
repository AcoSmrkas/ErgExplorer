<script>
	import CopyButton from './CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	
	export let boxId = '';
	export let name = ''; // Optional display name instead of boxId
	export let startChars = 8; // Characters to show at start
	export let endChars = 4; // Characters to show at end
	export let showCopy = true; // Whether to show copy button
	export let linkClass = 'box-link'; // CSS class for the link
	export let disabled = false; // Whether to disable the link (for unconfirmed outputs)
	export let disabledReason = 'Box not yet created'; // Tooltip for disabled state
	export let disablePopup = false; // Whether to disable box popup activation
	
	// Format the display text - priority: name prop, then formatted boxId
	$: displayText = name || (boxId ? 
		formatAddress(boxId, startChars, endChars) : 'Unknown Box');
	
	$: boxUrl = `/boxes/${boxId}`;
	
</script>

{#if boxId}
	<span class="box-link-wrapper">
		{#if disabled}
			<span 
				class="box-link-disabled" 
				title={disabledReason}
			>
				{displayText}
			</span>
		{:else}
			<a 
				class={linkClass} 
				href={boxUrl} 
				data-box-id={disablePopup ? null : boxId}
			>
				{displayText}
			</a>
		{/if}
		{#if showCopy}
			<CopyButton 
				text={boxId} 
				label="Copy box ID to clipboard"
				successMessage="Box ID copied to clipboard!"
				errorMessage="Failed to copy box ID."
				inline={true}
				size="small"
			/>
		{/if}
	</span>
{:else}
	<span class="text-muted">N/A</span>
{/if}

<style>
	.box-link-small {
		font-size: 0.8rem;
	}

	.box-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	
	.box-link-wrapper:hover :global(.copy-btn-inline) {
		opacity: 1;
	}

	.box-link-disabled {
		color: var(--text-light);
		text-decoration: none;
		cursor: help;
		font-weight: 500;
		opacity: 0.7;
	}
</style>