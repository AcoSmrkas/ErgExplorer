<script>
	import { formatNumber, formatDateString, formatErgValue, formatPriceUSD } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { ERG_DECIMALS } from '$lib/utils/constants.js';

	export let latestBlocks = [];
</script>

<div class="row w-100">
	<h2 class="subtitle ps-1 ps-sm-0">Latest blocks</h2>
	<table class="table table-dark table-striped">
		<thead>
			<tr>
				<th scope="col">Height</th>
				<th scope="col">Time</th>
				<th scope="col">TXs</th>
				<th scope="col">Reward</th>
			</tr>
		</thead>
		<tbody>
			{#if latestBlocks.length > 0}
				{#each latestBlocks as block, index (block.id + '_' + index)}
					<tr>
						<td>
							<a href="/blocks/{block.id}" data-block-id="{block.id}" aria-label="View block {block.height}">{formatNumber(block.height)}</a>
						</td>
						<td>{formatDateString(block.timestamp)}</td>
						<td>{formatNumber(block.transactionsCount)}</td>
						<td>{@html formatErgValue(block.minerReward)} {@html formatPriceUSD(block.minerReward, ERG_DECIMALS, $ergPrice.value)}</td>
					</tr>
				{/each}
			{:else}
				<tr>
					<td colspan="4" class="text-center text-light">
						<i class="fas fa-spinner fa-spin me-2"></i>Loading latest blocks...
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>


