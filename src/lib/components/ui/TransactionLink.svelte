<script>
	import CopyButton from './CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	
	export let transactionId = '';
	export let name = ''; // Optional display name instead of transaction ID
	export let startChars = 9; // Characters to show at start
	export let endChars = 3; // Characters to show at end
	export let showCopy = true; // Whether to show copy button
	export let linkClass = 'transaction-link'; // CSS class for the link
	export let disablePopup = false; // Whether to disable transaction popup activation
	
	// Format the display text - priority: name prop, then formatted transaction ID
	$: displayText = name || (transactionId ? 
		formatAddress(transactionId, startChars, endChars) : 'Unknown Transaction');
	
	$: transactionUrl = `/transactions/${transactionId}`;
	
</script>

{#if transactionId}
	<span class="transaction-link-wrapper">
		<a 
			class={linkClass} 
			href={transactionUrl} 
			data-transaction-id={disablePopup ? null : transactionId}
			data-transaction-hover={disablePopup ? null : transactionId}
		>
			{displayText}
		</a>
		{#if showCopy}
			<CopyButton 
				text={transactionId} 
				label="Copy transaction ID to clipboard"
				successMessage="Transaction ID copied to clipboard!"
				errorMessage="Failed to copy transaction ID."
				inline={true}
				size="small"
			/>
		{/if}
	</span>
{:else}
	<span class="text-muted">N/A</span>
{/if}

<style>
	.transaction-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		position: relative;
	}
	
	.transaction-link-wrapper:hover :global(.copy-btn-inline) {
		opacity: 1;
	}
	
	.transaction-link {
		color: var(--text-strong);
		text-decoration: none;
		transition: color 0.2s ease;
	}
	
	.transaction-link:hover {
		color: var(--main-color);
		text-decoration: underline;
	}
</style>