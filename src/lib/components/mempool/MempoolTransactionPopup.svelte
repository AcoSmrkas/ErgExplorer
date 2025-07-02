<script>
	import { formatErgValue, formatAddress, formatDateString, formatNumber } from '$lib/utils/formatting.js';
	import { FEE_ERGOTREE, ERG_DECIMALS } from '$lib/utils/constants.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import BasePopup from '../ui/BasePopup.svelte';
	
	export let transaction = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let z = 1070;
	export let transactionId = '';
	
	$: hasTransactionData = transaction !== null && transaction !== undefined;
	$: displayTitle = formatAddress(transactionId, 15, 4);
	$: currentErgPrice = $ergPrice;

	// Calculate fee for mempool transaction
	function calculateFee(tx) {
		if (!tx || !tx.outputs) return 0;
		const feeOutput = tx.outputs.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}

	$: fee = calculateFee(transaction);
</script>

<BasePopup
	{visible}
	{x}
	{y}
	{z}
	loading={false}
	popupClass="mempool-transaction-popup"
	icon="fa-clock"
	iconColor="text-warning"
	title={displayTitle}
	copyText={transactionId}
	copyLabel="Copy transaction ID"
	copyMessage="Transaction ID copied to clipboard!"
	viewDetailsUrl="/transactions/{transactionId}"
	viewDetailsText="View Details"
>
	{#if hasTransactionData}
		<div class="transaction-details">
			<div class="transaction-detail-row">
				<strong>Status:</strong> <span class="text-warning">Pending in mempool</span>
			</div>
			
			{#if transaction.inputs && transaction.inputs.length}
				<div class="transaction-detail-row">
					<strong>Inputs:</strong> {formatNumber(transaction.inputs.length)}
				</div>
			{/if}
			
			{#if transaction.outputs && transaction.outputs.length}
				<div class="transaction-detail-row">
					<strong>Outputs:</strong> {formatNumber(transaction.outputs.length)}
				</div>
			{/if}
			
			{#if fee > 0}
				<div class="transaction-detail-row">
					<strong class="erg-span">Fee:</strong> {@html formatErgValue(fee, ERG_DECIMALS)}
					{#if currentErgPrice?.value}
						<small class="text-muted">
							${(fee / Math.pow(10, ERG_DECIMALS) * currentErgPrice.value).toFixed(4)}
						</small>
					{/if}
				</div>
			{/if}

			{#if transaction.size}
				<div class="transaction-detail-row">
					<strong>Size:</strong> {formatNumber(transaction.size)} bytes
				</div>
			{/if}

			{#if transaction.conflictGroup}
				<div class="transaction-detail-row">
					<strong>Conflict Group:</strong> 
					<span class="conflict-badge">#{transaction.conflictGroup}</span>
					<small class="text-muted d-block">Double-spending with {transaction.conflictCount - 1} other transaction(s)</small>
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

	.conflict-badge {
		background: #dc3545;
		color: white;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.25rem;
	}
</style>