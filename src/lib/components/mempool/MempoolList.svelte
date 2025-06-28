<script>
	import DataTable from '$lib/components/data/DataTable.svelte';
	import MempoolCard from './MempoolCard.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';

	export let transactions = [];
	export let headers = [];
	export let loading = false;
	export let emptyMessage = 'No pending transactions in mempool';
</script>

<!-- Desktop Table View -->
<div class="d-none d-lg-block custom-table-wrapper">
	<DataTable 
		{headers}
		data={transactions} 
		{loading}
		{emptyMessage}
	/>
</div>

<!-- Mobile Card View -->
<div class="d-lg-none mobile-view">
	{#if loading}
		<Loading text="Loading transactions..." />
	{:else if transactions.length === 0}
		<div class="mobile-empty-state">
			<i class="fas fa-clock fa-3x text-muted mb-3"></i>
			<p class="text-muted">{emptyMessage}</p>
		</div>
	{:else}
		<div class="mobile-transactions-grid">
			{#each transactions as transaction}
				<MempoolCard {transaction} />
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Enhanced table responsive styling */
	.custom-table-wrapper :global(.table-responsive) {
		overflow-x: auto !important;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: var(--main-color) transparent;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar {
		height: 8px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-thumb {
		background: var(--main-color);
		border-radius: 4px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-thumb:hover {
		background: var(--main-color-hover);
	}

	/* Ensure table has minimum width to trigger scroll */
	.custom-table-wrapper :global(.glass-table) {
		min-width: 800px;
	}

	/* Mobile Card View Styling */
	.mobile-view {
		min-height: 200px;
	}
	
	.mobile-empty-state {
		text-align: center;
		padding: 3rem 1rem;
		background: var(--glass-bg-subtle);
		border-radius: 12px;
		backdrop-filter: var(--glass-blur-sm);
	}

	.mobile-transactions-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 576px) {
		.mobile-transactions-grid :global(.glass-card) {
			margin: 0 -0.5rem;
		}
	}
</style>