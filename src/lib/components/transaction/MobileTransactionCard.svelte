<script>
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
	import BoxLink from '$lib/components/ui/BoxLink.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import AssetsList from './AssetsList.svelte';
	import { formatErgValue } from '$lib/utils/formatting.js';

	export let item;
	export let index;
	export let getBoxStatus;
	export let getStatusType;
	export let type = 'input'; // 'input' or 'output'
	export let disableBoxLink = false; // Whether to disable box link (for unconfirmed outputs)
</script>

<div class="mobile-item-card" style="background: {index % 2 === 0 ? 'var(--striped-1)' : 'var(--striped-2)'}">
	<div class="mobile-item-header">
		<span class="mobile-item-index">#{index}</span>
		<div class="mobile-box-info">
			<BoxLink 
				boxId={item.boxId} 
				startChars={8} 
				endChars={4} 
				showCopy={true} 
				linkClass="mobile-box-link"
				disabled={disableBoxLink}
				disabledReason={disableBoxLink ? 'Output box will be created when transaction is confirmed' : undefined}
			/>
			<StatusBadge text={getBoxStatus(item)} type={getStatusType(item)} size="small" />
		</div>
	</div>
	<div class="mobile-item-details">
		<div class="mobile-detail-row">
			<span class="mobile-label">Address:</span>
			<AddressLink address={item.address || ""} startChars={8} endChars={4} showCopy={true} />
		</div>
		<div class="mobile-detail-row">
			<span class="mobile-label">Value:</span>
			<span class="mobile-value">{@html formatErgValue(item.value)}</span>
		</div>
		{#if item.assets?.length > 0}
			<div class="mobile-detail-row mobile-assets-row">
				<span class="mobile-label">Assets:</span>
				<div class="mobile-assets-scrollable">
					<AssetsList assets={item.assets} />
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.card) {
		background-color: var(--glass-bg-subtle);
	}

	.mobile-item-card {
		background: var(--glass-bg-subtle);
		border: none;
		border-radius: 0;
		padding: 1rem 0;
		margin: 0;
	}

	.mobile-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding: 0 1rem 0.5rem 1rem;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.mobile-item-index {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--main-color);
	}

	.mobile-box-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-item-details {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0 1rem;
	}

	.mobile-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-label {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-light);
		flex-shrink: 0;
	}

	.mobile-value {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-strong);
		text-align: right;
	}

	.mobile-assets-row {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
	}

	.mobile-assets-scrollable {
		width: 100%;
		max-height: 120px;
		overflow-y: auto;
	}
</style>