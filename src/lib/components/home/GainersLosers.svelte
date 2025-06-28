<script>
	import { formatPercentageStyled } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import DataTable from '$lib/components/data/DataTable.svelte';

	export let gainersLosersData = [];
	export let selectedPeriod = '24h';
	export let onPeriodChange = () => {};

	$: loading = gainersLosersData.length === 0;

	const headers = [
		{ label: 'Token', field: 'tokenid', render: (value, row) => getAssetTitleParams(row, row.tokenid, row.ticker, true) },
		{ label: 'Price', field: 'currentPrice', render: (value) => `$${formatValue(value, 0, true)}` },
		{ label: 'Change', field: 'difference', render: (value) => formatPercentageStyled(value) }
	];
</script>

<div class="col-lg-6 p-0 ps-lg-3">
	<div class="header-with-controls">
		<h2 class="subtitle ps-1 ps-sm-0">Top 5 profit/loss</h2>
		<div class="period-controls">
			<button 
				class="btn btn-sm {selectedPeriod === '24h' ? 'btn-info' : 'btn-primary'}" 
				onclick={() => onPeriodChange('24h')}
				type="button">
				24h
			</button>
			<button 
				class="btn btn-sm {selectedPeriod === '7d' ? 'btn-info' : 'btn-primary'}" 
				onclick={() => onPeriodChange('7d')}
				type="button">
				7d
			</button>
			<button 
				class="btn btn-sm {selectedPeriod === '30d' ? 'btn-info' : 'btn-primary'}" 
				onclick={() => onPeriodChange('30d')}
				type="button">
				30d
			</button>
		</div>
	</div>
	
	<DataTable 
		{headers} 
		data={gainersLosersData} 
		{loading}
		emptyMessage="Loading price data..."
	/>
</div>

<style>
	.header-with-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.period-controls {
		display: flex;
		gap: 0.25rem;
	}

	.period-controls .btn {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		border-radius: 6px;
		font-weight: 500;
	}

	.btn-info {
		background-color: var(--main-color);
		border-color: var(--main-color);
		color: white !important;
	}

	.btn-info:hover {
		background-color: var(--main-color-hover);
		border-color: var(--main-color-hover);
	}

	.btn-primary {
		background-color: var(--glass-bg-medium);
		border-color: var(--glass-border-light);
		color: var(--text-strong);
	}

	.btn-primary:hover {
		background-color: var(--glass-bg-light);
		border-color: var(--main-color);
		color: var(--main-color);
	}

	@media (max-width: 768px) {
		.header-with-controls {
			flex-direction: column;
			align-items: flex-start;
		}
		
		.period-controls {
			align-self: flex-end;
		}
	}
</style>