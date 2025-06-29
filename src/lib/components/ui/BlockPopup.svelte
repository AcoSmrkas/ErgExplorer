<script>
	import { formatNumber, formatDateString, formatAddress } from '$lib/utils/formatting.js';
	import { formatKbSize } from '$lib/utils/numberFormatting.js';
	import BasePopup from './BasePopup.svelte';
	
	export let block = null;
	export let blockId = '';
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	
	$: hasDetailedData = block !== null && block !== undefined;
	$: blockHeader = block?.block?.header;
	$: blockTransactions = block?.block?.blockTransactions;
	$: displayTitle = blockHeader?.height ? `Block #${formatNumber(blockHeader.height)}` : 'Block';
</script>

<BasePopup
	{visible}
	{x}
	{y}
	{loading}
	popupClass="block-popup"
	icon="fa-cube"
	iconColor="text-primary"
	title={displayTitle}
	copyText={blockId}
	copyLabel="Copy block ID"
	copyMessage="Block ID copied to clipboard!"
	viewDetailsUrl="/blocks/{blockHeader?.height || blockId}"
	viewDetailsText="View Details"
>
	{#if hasDetailedData || !loading}
		<div class="block-details">
			{#if blockId}
				<div class="block-detail-row">
					<strong>ID:</strong> {formatAddress(blockId, 15, 4)}
				</div>
			{/if}
			
			{#if blockHeader?.timestamp}
				<div class="block-detail-row">Time: {formatDateString(blockHeader.timestamp)}</div>
			{/if}
			
			{#if blockTransactions?.length}
				<div class="block-detail-row">Transactions: {formatNumber(blockTransactions.length)}</div>
			{/if}
			
			{#if blockHeader?.size}
				<div class="block-detail-row">Size: {formatKbSize(blockHeader.size)}</div>
			{/if}
		</div>
	{/if}
</BasePopup>

<style>
	.block-details > .block-detail-row {
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.block-details > .block-detail-row:last-child {
		margin-bottom: 0;
	}
</style>

