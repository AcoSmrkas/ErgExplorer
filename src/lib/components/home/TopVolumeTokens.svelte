<script>
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import DataTable from '$lib/components/data/DataTable.svelte';

	export let topVolumeTokens = [];

	$: loading = topVolumeTokens.length === 0;

	const headers = [
		{ label: 'Token', field: 'asset', render: (value, row) => getAssetTitleParams(null, row.asset, row.name, true) },
		{ label: 'Volume', field: 'total_usd', render: (value) => `$${formatValue(value, 2)}` }
	];
</script>

<div class="col-lg-6 p-0 pe-lg-3">
	<h2 class="subtitle ps-1 ps-sm-0">Top 10 by DEX volume</h2>
	<DataTable 
		{headers} 
		data={topVolumeTokens} 
		{loading}
		emptyMessage="Loading volume data..."
	/>
</div>