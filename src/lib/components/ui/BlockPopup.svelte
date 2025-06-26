<script>
	import { fade } from 'svelte/transition';
	import { formatNumber, formatDateString, formatAddress } from '$lib/utils/formatting.js';
	import { formatKbSize } from '$lib/utils/numberFormatting.js';
    import CopyButton from './CopyButton.svelte';
	
	export let block = null;
	export let blockId = '';
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	
	$: hasDetailedData = block !== null && block !== undefined;
	$: blockHeader = block?.block?.header;
	$: blockTransactions = block?.block?.blockTransactions;
</script>

{#if visible && (block || blockId)}
	<div 
		class="block-popup show" 
		style="left: {x}px; top: {y}px;"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div class="block-header">
			<div class="block-title">
				<div class="block-height">Block #{blockHeader?.height ? formatNumber(blockHeader.height) : ' --'}</div>
			</div>
		</div>
		
		{#if loading && !hasDetailedData}
			<div class="loading-section" in:fade={{ duration: 200 }}>
				<div class="loading-spinner-small"></div>
				<span class="loading-text">Loading block data...</span>
			</div>
		{/if}
		
		{#if hasDetailedData}
			<div class="block-details" in:fade={{ duration: 300, delay: 100 }}>
				{#if blockId}
					<div class="block-id-section">
						<div class="block-id">ID: {formatAddress(blockId, 15, 4)}...</div>
						<CopyButton
							text={blockId}
							label="Copy full block ID"
							successMessage="Block ID copied to clipboard!"
						/>
					</div>
				{/if}
				
				{#if blockHeader?.timestamp}
					<div class="block-time">Time: {formatDateString(blockHeader.timestamp)}</div>
				{/if}
				
				{#if blockTransactions?.length}
					<div class="block-transactions">Transactions: {formatNumber(blockTransactions.length)}</div>
				{/if}
				
				{#if blockHeader?.size}
					<div class="block-size">Size: {formatKbSize(blockHeader.size)}</div>
				{/if}
			</div>
		{:else if !loading}
			<!-- Basic info when no detailed data and not loading -->
			<div class="block-basic-info">
				{#if blockId}
					<div class="block-id-section">
						<div class="block-id">ID: {formatAddress(blockId, 15, 4)}...</div>
						<CopyButton
							text={blockId}
							label="Copy full block ID"
							successMessage="Block ID copied to clipboard!"
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

