<script>
	import { formatErgValue, formatNumber, formatNumberLarge, formatPriceUSD, formatMiningTime, formatHashRate } from '$lib/utils/formatting.js';
	import { ERG_DECIMALS } from '$lib/utils/constants.js';

	export let statsData = null;
	export let ergPrice = null;
</script>

<div class="row w-100 p-0">		
	<div class="col-md-12 m-0 div-cell-dark p-2">
		{#if !statsData}
			<div class="text-center py-4">
				<h2 class="text-strong mb-3">24h Stats</h2>
				<i class="fas fa-spinner fa-spin me-2"></i>Loading statistics...
			</div>
		{:else}
			<div class="row col-12 px-1">
				<h2 class="mb-3 text-strong">24h Stats</h2>
				<hr class="mt-1 mb-0">
			</div>
			<div class="row w-100 p-0">
				<!-- Left Column -->
				<div class="col-md-6 p-0">
					<h3 class="p-1 p-sm-3 erg-span">Block summary</h3>
					<div class="col-12 p-0 p-sm-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Blocks mined</strong></div>
							<div class="col">
								<p>{statsData?.blockSummary.total ? formatNumberLarge(statsData.blockSummary.total, 0, true) : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Average mining time</strong></div>
							<div class="col">
								<p>{statsData?.blockSummary.averageMiningTime ? formatMiningTime(statsData.blockSummary.averageMiningTime) : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Coins mined</strong></div>
							<div class="col">
								{#if statsData?.blockSummary.totalCoins}
									<p class="text-strong">{@html formatErgValue(statsData.blockSummary.totalCoins, 9, false)}<span class="text-light">{ergPrice ? formatPriceUSD(statsData.blockSummary.totalCoins, ERG_DECIMALS, ergPrice.value) : ''}</span></p>
								{:else}
									<p>--</p>
								{/if}
							</div>
						</div>
						<hr class="d-block d-sm-none my-2" style="border:0;">
						<h3 class="p-1 p-sm-3 erg-span">Transactions summary</h3>
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Number of Transactions</strong></div>
							<div class="col">
								<p>{statsData?.transactionsSummary.total ? formatNumberLarge(statsData.transactionsSummary.total, 0, true) : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Total Transaction Fees</strong></div>
							<div class="col">
								{#if statsData?.transactionsSummary.totalFee}
									<p class="text-strong">{@html formatErgValue(statsData.transactionsSummary.totalFee)} <span class="text-light">{ergPrice ? formatPriceUSD(statsData.transactionsSummary.totalFee, 9, ergPrice.value) : ''}</span></p>
								{:else}
									<p>--</p>
								{/if}
							</div>
						</div>
						<hr class="d-block d-sm-none my-2" style="border:0;">
					</div>
				</div>
				
				<!-- Right Column -->
				<div class="col-md-6 p-0">
					<h3 class="p-1 p-sm-3 erg-span">Mining cost</h3>
					<div class="col-12 p-0 p-sm-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Total Miners Revenue</strong></div>
							<div class="col">
								{#if statsData?.miningCost.totalMinersRevenue}
									<p class="text-strong">{@html formatErgValue(statsData.miningCost.totalMinersRevenue)} <span class="text-light">{ergPrice ? formatPriceUSD(statsData.miningCost.totalMinersRevenue, ERG_DECIMALS, ergPrice.value) : ''}</span></p>
								{:else}
									<p>--</p>
								{/if}
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>% Earned From Transaction Fees</strong></div>
							<div class="col">
								<p>{statsData?.miningCost.percentEarnedTransactionsFees ? formatNumber(statsData.miningCost.percentEarnedTransactionsFees, 2) + '%' : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>% Of Transaction Volume</strong></div>
							<div class="col">
								<p>{statsData?.miningCost.percentTransactionVolume ? formatNumber(statsData.miningCost.percentTransactionVolume, 4) + '%' : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Cost per Transaction</strong></div>
							<div class="col">
								{#if statsData?.miningCost.costPerTransaction}
									<p class="text-strong">{@html formatErgValue(statsData.miningCost.costPerTransaction)} <span class="text-light">{ergPrice ? formatPriceUSD(statsData.miningCost.costPerTransaction, 9, ergPrice.value) : ''}</span></p>
								{:else}
									<p>--</p>
								{/if}
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Difficulty</strong></div>
							<div class="col">
								<p>{statsData?.miningCost.difficulty ? formatNumberLarge(statsData.miningCost.difficulty, 0, true) : '--'}</p>
							</div>
						</div>
						<hr class="my-1">
						<div class="row w-100 p-0 p-sm-1">
							<div class="col-6 ps-1 ps-sm-2"><strong>Hash Rate</strong></div>
							<div class="col">
								<p>{statsData?.miningCost.hashRate ? formatHashRate(statsData.miningCost.hashRate) : '--'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.col > p {
		color: var(--text-strong);
	}
</style>