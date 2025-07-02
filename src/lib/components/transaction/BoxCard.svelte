<script>
	import BoxLink from '$lib/components/ui/BoxLink.svelte';
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
	import BlockLink from '$lib/components/ui/BlockLink.svelte';
	import TransactionLink from '$lib/components/ui/TransactionLink.svelte';
	import EnhancedAssetsList from './EnhancedAssetsList.svelte';
	import RegisterList from './RegisterList.svelte';
	import { formatErgValue } from '$lib/utils/formatting.js';
	import { processRegisters } from '$lib/utils/registerProcessor.js';
	
	export let box;
	export let index;
	export let type = 'input'; // 'input' or 'output'
	export let isConfirmed = true;
	
	// State for expandable registers
	let registersExpanded = false;
	
	// Striped background based on index
	$: isEven = index % 2 === 0;
	
	// Format settlement height
	$: settlementHeight = box.settlementHeight || box.outputSettledAt || 'N/A';
	$: blockId = box.blockId || box.outputBlockId;
	
	// Format box status - check actual spent status for outputs
	$: boxStatus = (() => {
		if (type === 'input') {
			return 'Spent'; // Inputs are always spent (being consumed)
		} else {
			// For outputs, check if transaction is confirmed first
			if (!isConfirmed) {
				return 'Will be created';
			}
			// For confirmed outputs, check if the box has been spent
			if (box.spentTransactionId || box.spent === true) {
				return 'Spent';
			}
			return 'Unspent';
		}
	})();
	
	// Process registers using the new utility
	$: additionalRegisters = processRegisters(box.additionalRegisters);
	
	// Determine transaction ID to show based on box type
	$: transactionId = type === 'input' ? box.outputTransactionId : box.spentTransactionId;
	$: transactionLabel = type === 'input' ? 'Output transaction:' : 'Spent in transaction:';
</script>

<div class="box-card" style="background: {isEven ? 'var(--striped-1)' : 'var(--striped-2)'};">
	<div class="box-header">
		<div class="box-left">
			<div class="box-index">#{index}</div>
			<BoxLink 
				boxId={box.boxId}
				startChars={12}
				endChars={4}
				showCopy={true}
				linkClass="box-link-small"
			/>
		</div>
		<div class="box-status {boxStatus === 'Spent' ? 'spent' : (boxStatus === 'Unspent' ? 'confirmed' : 'pending')}">
			{boxStatus}
		</div>
	</div>
	
	<div class="box-content">
		<!-- Address -->
		<div class="box-field">
			<div class="field-label">Address:</div>
			<div class="field-value">
				<AddressLink 
					address={box.address || ''} 
					startChars={12} 
					endChars={4} 
					showCopy={true}
				/>
			</div>
		</div>
		
		<!-- Transaction ID -->
		{#if transactionId}
			<div class="box-field">
				<div class="field-label">{transactionLabel}</div>
				<div class="field-value">
					<TransactionLink 
						transactionId={transactionId} 
						startChars={12} 
						endChars={4} 
						showCopy={true}
					/>
				</div>
			</div>
		{/if}
		
		<!-- Settlement Height -->
		{#if settlementHeight !== 'N/A'}
			<div class="box-field">
				<div class="field-label">Settlement height:</div>
				<div class="field-value">
					<BlockLink 
						blockId={blockId}
						blockHeight={parseInt(settlementHeight)} 
						onlyHeight={true}
						preferHeight={true}
						showCopy={true}
					/>
				</div>
			</div>
		{/if}
		
		<!-- Value -->
		<div class="box-field">
			<div class="field-label">Value:</div>
			<div class="field-value value">
				{@html formatErgValue(box.value)}
			</div>
		</div>
		
		<!-- Tokens -->
		{#if box.assets && box.assets.length > 0}
			<div class="box-field tokens-field">
				<div class="field-label">Tokens:</div>
				<div class="field-value-full">
					<EnhancedAssetsList assets={box.assets} />
				</div>
			</div>
		{/if}
		
		<!-- Additional Registers -->
		 {#if additionalRegisters.length > 0}
			<div class="box-field">
				<RegisterList 
					registers={additionalRegisters} 
					bind:expanded={registersExpanded} 
				/>
			</div>
		{/if}
	</div>
</div>

<style>
	.box-card {
		border: none;
		border-radius: 0;
		padding: 0.75rem;
		margin-bottom: 0;
		transition: all 0.2s ease;
	}
	
	.box-card:hover {
		opacity: 0.95;
	}
	
	.box-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--glass-border-light);
	}
	
	.box-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}
	
	.box-index {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--main-color);
		background: rgba(var(--main-color-rgb), 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
	}
	
	.box-status {
		font-size: 0.7rem;
		font-weight: 500;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.box-status.confirmed {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}
	
	.box-status.pending {
		background: rgba(251, 191, 36, 0.1);
		color: #fbbf24;
	}
	
	.box-status.spent {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}
	
	.box-content {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	
	.box-field {
		display: flex;
		align-items: center;
		/* justify-content: space-between; */
		gap: 0.5rem;
		min-height: 1.5rem;
	}
	
	.field-label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.3px;
		min-width: 200px;
		flex-shrink: 0;
	}
	
	.field-value {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--text-strong);
		word-break: break-all;
		/* flex: 1; */
		justify-content: flex-end;
		text-align: right;
	}
	
	.field-value-full {
		display: block;
		font-size: 0.875rem;
		color: var(--text-strong);
		width: 100%;
	}
	
	.field-value.value {
		font-weight: 600;
	}
	
	.box-id {
		font-size: 0.875rem;
		color: var(--text-strong);
		cursor: pointer;
		text-decoration: none;
		transition: color 0.2s ease;
	}
	
	.box-id:hover {
		color: var(--main-color);
	}
	
	.tokens-field {
		margin-top: 4px;
		flex-direction: column;
		align-items: stretch;
		/* gap: 0.3rem; */
	}
	
	.tokens-field .field-label {
		align-self: flex-start;
	}
	
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.box-card {
			padding: 0.6rem;
		}
		
		.box-content {
			gap: 0rem;
		}

		.field-label {
			min-width: fit-content;
		}
		
		.field-value {
			font-size: 0.75rem;
		}
		
		.box-field {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			min-height: 1.5rem;
		}
	}
</style>