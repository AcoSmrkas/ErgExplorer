<script>
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';

	export let topVolumeTokens = [];
</script>

<div class="col-lg-6 p-0 pe-lg-3">
	<h2 class="subtitle ps-1 ps-sm-0">Top 10 by DEX volume</h2>
	<table class="table table-striped table-dark">
		<thead>
			<tr>
				<th scope="col">Token</th>
				<th scope="col">Volume</th>
			</tr>
		</thead>
		<tbody>
			{#if topVolumeTokens.length > 0}
				{#each topVolumeTokens as token, index (token.asset + '_' + index)}
					<tr>
						<td>
							{@html getAssetTitleParams(null, token.asset, token.name, true)}
						</td>
						<td>${@html formatValue(token.total_usd, 2)}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="2" class="text-center text-light">
						<i class="fas fa-spinner fa-spin me-2"></i>Loading volume data...
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>