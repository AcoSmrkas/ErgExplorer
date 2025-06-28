<script>
	import DataTable from '$lib/components/data/DataTable.svelte';
	import BlockCard from './BlockCard.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import { getLatestBlocksHeaders } from '$lib/config/tableConfigs.js';

	export let blocks = [];
	export let loading = false;
	export let emptyMessage = 'No blocks found';
</script>

<!-- Desktop Table View -->
<div class="d-none d-lg-block custom-table-wrapper p-0">
	<DataTable 
		headers={getLatestBlocksHeaders()}
		data={blocks} 
		{loading}
		{emptyMessage}
	/>
</div>

<!-- Mobile Card View -->
<div class="d-lg-none mobile-view">
	{#if loading}
		<Loading text="Loading blocks..." />
	{:else if blocks.length === 0}
		<div class="mobile-empty-state">
			<i class="fas fa-cubes fa-3x text-muted mb-3"></i>
			<p class="text-muted">{emptyMessage}</p>
		</div>
	{:else}
		<div class="mobile-blocks-grid">
			{#each blocks as block}
				<BlockCard {block} />
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
		min-width: 700px;
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
		/* backdrop-filter: var(--glass-blur-sm); */
	}

	.mobile-blocks-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 576px) {
		.mobile-blocks-grid :global(.glass-card) {
			margin: 0 -0.5rem;
		}
	}
</style>