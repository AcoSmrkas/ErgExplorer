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

<div class="table-responsive glass-table-container p-0">
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
									<svelte:component this={header.component} {...(header.componentProps ? header.componentProps(row, getNestedValue(row, header.field), index) : { data: row, field: header.field })} />
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

<!-- All table styles are now defined globally in common-components.css -->