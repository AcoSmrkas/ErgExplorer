<script>
	import { formatErgValue, formatAddress, formatDateString } from '$lib/utils/formatting.js';
	import BasePopup from './BasePopup.svelte';
	
	export let transaction = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	export let transactionId = '';
	
	$: hasTransactionData = transaction !== null && transaction !== undefined;
	$: displayTitle = formatAddress(transactionId, 15, 4);

// Helper function to get block URL
function getBlockUrl(blockId) {
	return `/blocks/${blockId}`;
}
</script>

<BasePopup
	{visible}
	{x}
	{y}
	{loading}
	popupClass="transaction-popup"
	icon="fa-exchange-alt"
	iconColor="text-success"
	title={displayTitle}
	copyText={transactionId}
	copyLabel="Copy transaction ID"
	copyMessage="Transaction ID copied to clipboard!"
	viewDetailsUrl="/transactions/{transactionId}"
	viewDetailsText="View Details"
>
	{#if hasTransactionData}
		<div class="transaction-details">
			{#if transaction.timestamp}
				<div class="transaction-detail-row">
					<strong>Time:</strong> {formatDateString(transaction.timestamp)}
				</div>
			{/if}
			
			{#if transaction.blockId}
				<div class="transaction-detail-row">
					<strong>Block:</strong> <a href="{getBlockUrl(transaction.blockId)}" class="text-link">{formatAddress(transaction.blockId, 15, 4)}</a>
				</div>
			{/if}
			
			{#if transaction.confirmationsCount !== undefined}
				<div class="transaction-detail-row">
					<strong>Confirmations:</strong> {transaction.confirmationsCount}
				</div>
			{/if}
			
			{#if transaction.inputs && transaction.inputs.length}
				<div class="transaction-detail-row">
					<strong>Inputs:</strong> {transaction.inputs.length}
				</div>
			{/if}
			
			{#if transaction.outputs && transaction.outputs.length}
				<div class="transaction-detail-row">
					<strong>Outputs:</strong> {transaction.outputs.length}
				</div>
			{/if}
			
			{#if transaction.totalValue}
				<div class="transaction-detail-row">
					<strong class="erg-span">Total Value:</strong> {@html formatErgValue(transaction.totalValue)}
				</div>
			{/if}
		</div>
	{/if}
</BasePopup>

<style>
	.transaction-details > .transaction-detail-row {
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.transaction-details > .transaction-detail-row:last-child {
		margin-bottom: 0;
	}

	.text-link {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.text-link:hover {
		color: var(--main-color);
		text-decoration: none;
	}
</style>