<script>
	import { formatErgValue, formatAddress, formatDateString } from '$lib/utils/formatting.js';
	import { fade } from 'svelte/transition';
	import CopyButton from './CopyButton.svelte';
	
	export let transaction = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	export let transactionId = '';
	
	$: hasTransactionData = transaction !== null && transaction !== undefined;
</script>

{#if visible && transactionId}
	<div 
		class="transaction-popup show" 
		style="left: {x}px; top: {y}px;"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div class="transaction-header">
			<div class="transaction-icon">
				<i class="fas fa-exchange-alt"></i>
			</div>
			<div class="transaction-title">
				<div class="transaction-name">Transaction Details</div>
			</div>
		</div>
		
		<!-- Full transaction ID with copy button -->
		<div class="transaction-id-section">
			<div class="transaction-id">ID: {formatAddress(transactionId, 15, 4)}</div>
			<CopyButton text={transactionId}
				label="Copy full transaction ID"
				successMessage="Transaction ID copied to clipboard!"
			/>
		</div>
		
		{#if loading && !hasTransactionData}
			<div class="loading-section" in:fade={{ duration: 200 }}>
				<div class="loading-spinner-small" style="display: inline-block"></div>
				<span class="loading-text">Loading transaction...</span>
			</div>
		{/if}
		
		{#if hasTransactionData}
			<div class="transaction-details" in:fade={{ duration: 300, delay: 100 }}>
				{#if transaction.timestamp}
					<div class="transaction-time">
						<strong>Time:</strong> {formatDateString(transaction.timestamp)}
					</div>
				{/if}
				
				{#if transaction.blockId}
					<div class="transaction-block">
						<strong>Block:</strong> <a href="{getBlockUrl(transaction.blockId)}">{formatAddress(transaction.blockId, 15, 4)}</a>
					</div>
				{/if}
				
				{#if transaction.confirmationsCount !== undefined}
					<div class="transaction-confirmations">
						<strong>Confirmations:</strong> {transaction.confirmationsCount}
					</div>
				{/if}
				
				{#if transaction.inputs && transaction.inputs.length}
					<div class="transaction-inputs">
						<strong>Inputs:</strong> {transaction.inputs.length}
					</div>
				{/if}
				
				{#if transaction.outputs && transaction.outputs.length}
					<div class="transaction-outputs">
						<strong>Outputs:</strong> {transaction.outputs.length}
					</div>
				{/if}
				
				{#if transaction.totalValue}
					<div class="transaction-value">
						<strong class="erg-span">Total Value:</strong> {@html formatErgValue(transaction.totalValue)}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}