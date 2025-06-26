<script>
	import { formatPercentageStyled } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';

	export let gainersLosersData = [];
	export let selectedPeriod = '24h';
	export let onPeriodChange = () => {};
</script>

<div class="col-lg-6 p-0 ps-lg-3">
	<h2 style="display:inline-block;" class="subtitle ps-1 ps-sm-0">Top 5 profit/loss</h2>
	<input 
		class="p-2 p-sm-2 btn {selectedPeriod === '30d' ? 'btn-info' : 'btn-primary'} float-end" 
		style="margin-top:23px;margin-bottom:5px;margin-left:5px;display:inline-block;"
		onclick={() => onPeriodChange('30d')}
		type="button"
		value="30d">
	<input 
		class="p-2 p-sm-2 btn {selectedPeriod === '7d' ? 'btn-info' : 'btn-primary'} float-end" 
		style="margin-top:23px;margin-bottom:5px;display:inline-block;"
		onclick={() => onPeriodChange('7d')}
		type="button"
		value="7d">
	<input 
		class="p-2 p-sm-2 btn {selectedPeriod === '24h' ? 'btn-info' : 'btn-primary'} float-end" 
		style="margin-top:23px;margin-bottom:5px;margin-right:5px;display:inline-block;"
		onclick={() => onPeriodChange('24h')}
		type="button"
		value="24h">
	<table class="table table-dark table-striped">
		<thead>
			<tr>
				<th scope="col">Token</th>
				<th scope="col">Price</th>
				<th scope="col">Change</th>
			</tr>
		</thead>
		<tbody>
			{#if gainersLosersData.length > 0}
				{#each gainersLosersData as token, index (token.tokenid + '_' + index)}
					<tr>
						<td>
							{@html getAssetTitleParams(token, token.tokenid, token.ticker, true)}
						</td>
						<td>${@html formatValue(token.currentPrice, 0, true)}</td>
						<td>
							{@html formatPercentageStyled(token.difference)}
						</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="3" class="text-center text-light">
						<i class="fas fa-spinner fa-spin me-2"></i>Loading price data...
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>