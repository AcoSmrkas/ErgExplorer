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
		return key.split('.').reduce((value, k) => value?.[k], obj);
	}
	
	function handleSort(key) {
		if (!sortable) return;
		
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = 'asc';
		}
	}
	
	function getSortIcon(key) {
		if (sortKey !== key) return 'fas fa-sort';
		return sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
	}
</script>

<div class="table-responsive">
	<table class="table table-hover">
		<thead>
			<tr>
				{#each headers as header}
					<th 
						class:sortable={sortable && header.sortKey}
						onclick={() => sortable && header.sortKey && handleSort(header.sortKey)}
					>
						{header.label}
						{#if sortable && header.sortKey}
							<i class="{getSortIcon(header.sortKey)} ms-1"></i>
						{/if}
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
	.table {
		margin-bottom: 0;
	}
	
	.table {
		border: 1px solid var(--borders);
		border-radius: 5px;
	}
	
	.table > :not(caption) > * > * {
		background-color: var(--forms-bg);
	}
	
	.table tbody {
		border-top: 2px solid var(--main-color);
	}
	
	.table thead th {
		background-color: var(--forms-bg);
		color: var(--text-strong);
		border: none;
		font-weight: 600;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
	
	.table thead th.sortable {
		cursor: pointer;
		user-select: none;
	}
	
	.table thead th.sortable:hover {
		color: var(--main-color);
	}
	
	.table tbody tr:hover {
		background-color: var(--striped-1);
	}
	
	.table td {
		vertical-align: middle;
		border-color: var(--borders);
	}
	
	.table-striped > tbody > tr:nth-of-type(2n+1) > * {
		background-color: var(--striped-1);
	}
</style>