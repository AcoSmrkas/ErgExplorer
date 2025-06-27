<script>
	import { formatPriceUSD, formatDateString } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js'
	import { isTestnet } from '$lib/stores/network.svelte.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
    import { onMount } from 'svelte';

	export let whaleTxs = [];
	export let currentPrices = {};
</script>

<div class="row w-100">
	<h2 class="subtitle ps-1 ps-sm-0">Latest big transactions</h2>
	
	<!-- Desktop Table -->
	<div class="d-none d-lg-block p-0">
		<table class="table table-dark table-striped">
			<thead>
				<tr>
					<th scope="col">Tx</th>
					<th scope="col">Time</th>
					<th scope="col">From</th>
					<th scope="col">To</th>
					<th scope="col">Value</th>
				</tr>
			</thead>
			<tbody>
				{#if whaleTxs.length > 0}
					{#each whaleTxs as tx, index (tx.txid + '_' + index)}
						<tr>
							<td>
								<a href="/transactions/{tx.txid}" data-transaction-hover="{tx.txid}" aria-label="View transaction {tx.txid}"><i class="fas fa-link text-info"></i></a>
							</td>
							<td>{formatDateString(parseInt(tx.time))}</td>
							<td>
								<AddressLink address={tx.fromaddress} startChars={9} endChars={4} />
							</td>
							<td>
								<AddressLink address={tx.toaddress} startChars={9} endChars={4} />
							</td>
							<td>
								{@html formatValue(tx.value / Math.pow(10, tx.decimals), tx.decimals)}
								{@html getAssetTitleParams(null, tx.tokenId, tx.ticker, false)}
								{#if tx.value && currentPrices[tx.tokenid]}
									<span class="text-light">
										{formatPriceUSD(tx.value, tx.decimals, currentPrices[tx.tokenid])}
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="text-center text-light">
							{#if isTestnet()}
								Whale transactions not available on testnet
							{:else}
								<i class="fas fa-spinner fa-spin me-2"></i>Loading whale transactions...
							{/if}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
	
	<!-- Mobile Simple List -->
	<div class="d-lg-none mobile-whale-txs div-cell-dark stripedHolderDark">
		{#if whaleTxs.length > 0}
			{#each whaleTxs as tx, index (tx.txid + '_' + index)}
				<div class="mobile-tx-item">
					<div class="d-flex justify-content-between align-items-center mb-2 row">
						<a href="/transactions/{tx.txid}" data-transaction-hover="{tx.txid}" class="text-info" aria-label="View transaction {tx.txid}">
							<i class="fas fa-link me-1"></i> Transaction
						</a>
						<span class="text-light small">{formatDateString(parseInt(tx.time))}</span>
					</div>
					
					<div class="row mb-1">
						<div class="col-3 text-muted small">From:</div>
						<div class="col-9">
							<AddressLink address={tx.fromaddress} startChars={15} endChars={4} />
						</div>
					</div>
					
					<div class="row mb-1">
						<div class="col-3 text-muted small">To:</div>
						<div class="col-9">
							<AddressLink address={tx.toaddress} startChars={15} endChars={4} />
						</div>
					</div>
					
					<div class="row">
						<div class="col-3 text-muted small">Value:</div>
						<div class="col-9 text-white">
							{@html formatValue(tx.value / Math.pow(10, tx.decimals), tx.decimals)}
							{@html getAssetTitleParams(null, tx.tokenId, tx.ticker, false)}
							{#if tx.value && currentPrices[tx.tokenid]}
								<span class="text-light small">
									({formatPriceUSD(tx.value, tx.decimals, currentPrices[tx.tokenid])})
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="text-center py-4 text-light">
				{#if isTestnet()}
					Whale transactions not available on testnet
				{:else}
					<i class="fas fa-spinner fa-spin me-2"></i>Loading whale transactions...
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Mobile whale transactions */
	.mobile-whale-txs {
		padding: 0;
	}

	.mobile-tx-item {
		padding: 1rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.mobile-tx-item:last-child {
		border-bottom: none;
	}
</style>