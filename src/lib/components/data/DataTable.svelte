<script>
	export let headers = [];
	export let data = [];
	export let sortable = true;
	export let loading = false;
	export let emptyMessage = 'No data available';
	
	let sortKey = '';
	let sortDirection = 'asc';
	
	$: sortedData = loading ? [] : sortData(data, sortKey, sortDirection);
	
	function sortData(items, key, direction) {
		if (!key || !sortable) return items;
		
		return [...items].sort((a, b) => {
			const aVal = getNestedValue(a, key);
			const bVal = getNestedValue(b, key);
			
			if (aVal < bVal) return direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return direction === 'asc' ? 1 : -1;
			return 0;
		});
	}
	
	function getNestedValue(obj, key) {
		if (!key) return null;
		return key.split('.').reduce((value, k) => value?.[k], obj);
	}
</script>

<div class="table-responsive glass-table-container">
	<table class="table glass-table">
		<thead>
			<tr>
				{#each headers as header}
					<th>
						{header.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan={headers.length} class="text-center py-4">
						<div class="spinner-border spinner-border-sm text-primary" role="status">
							<span class="visually-hidden">Loading...</span>
						</div>
					</td>
				</tr>
			{:else if sortedData.length === 0}
				<tr>
					<td colspan={headers.length} class="text-center py-4 text-muted">
						{emptyMessage}
					</td>
				</tr>
			{:else}
				{#each sortedData as row, index}
					<tr>
						{#each headers as header}
							<td>
								{#if header.component}
									<svelte:component this={header.component} data={row} field={header.field} />
								{:else if header.render}
									{@html header.render(getNestedValue(row, header.field), row, index)}
								{:else}
									{getNestedValue(row, header.field) || '—'}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<style>
	.glass-table-container {
		border-radius: 16px;
		overflow: hidden;
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-md);
		-webkit-backdrop-filter: var(--glass-blur-md);
		box-shadow: var(--glass-shadow-sm);
		border: none !important;
	}

	.table-responsive {
		border: none !important;
	}

	.glass-table {
		margin-bottom: 0;
		border: none !important;
		background: transparent;
		border-collapse: collapse !important;
	}
	
	.glass-table > :not(caption) > * > * {
		background: transparent;
		border-color: var(--glass-border-light);
	}
	
	.glass-table thead {
		background: var(--glass-bg-medium);
	}
	
	.glass-table thead th {
		background: transparent;
		color: var(--text-strong);
		border: none;
		border-bottom: 2px solid var(--main-color);
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		padding: 1.25rem 1rem;
	}
	
	.glass-table thead th:first-child {
		border-top-left-radius: 16px;
	}
	
	.glass-table thead th:last-child {
		border-top-right-radius: 16px;
	}
	
	
	
	
	.glass-table tbody tr:nth-child(even) {
		background: var(--striped-1);
	}
	
	.glass-table tbody tr:nth-child(odd) {
		background: var(--striped-2);
	}
	
	.glass-table td {
		vertical-align: middle;
		border-color: var(--glass-border-light);
		border-width: 1px;
		padding: 1rem;
		color: var(--text-strong);
		font-weight: 500;
	}
	
	.glass-table td:first-child {
		font-weight: 600;
	}
	
	/* Loading and empty states */
	.glass-table .spinner-border {
		color: var(--main-color);
	}
	
	.glass-table .text-muted {
		color: var(--text-light) !important;
		font-style: italic;
	}
	
	
	/* Responsive improvements */
	@media (max-width: 768px) {
		.glass-table thead th {
			padding: 0.75rem 0.5rem;
			font-size: 0.8rem;
		}
		
		.glass-table td {
			padding: 0.75rem 0.5rem;
			font-size: 0.9rem;
		}
	}
</style>