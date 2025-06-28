<script>
	import { formatPriceUSD, formatDateString } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js'
	import { isTestnet } from '$lib/stores/network.svelte.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';
    import { onMount } from 'svelte';

	export let whaleTxs = [];
	export let currentPrices = {};

	$: loading = whaleTxs.length === 0;

	const headers = [
		{ label: 'Tx', field: 'txid', render: (value) => `<a href="/transactions/${value}" data-transaction-hover="${value}" aria-label="View transaction ${value}"><i class="fas fa-link text-info"></i></a>` },
		{ label: 'Time', field: 'time', render: (value) => formatDateString(parseInt(value)) },
		{ label: 'From', field: 'fromaddress', render: (value) => renderAddressCell(value, 9, 4) },
		{ label: 'To', field: 'toaddress', render: (value) => renderAddressCell(value, 9, 4) },
		{ label: 'Value', field: 'value', render: (value, row) => renderValueCell(value, row) }
	];

	function renderAddressCell(address, startChars, endChars) {
		if (!address) return '';
		return `<span data-address-wrapper="${address}" data-start-chars="${startChars}" data-end-chars="${endChars}"></span>`;
	}

	function renderValueCell(value, row) {
		let result = `${formatValue(row.value / Math.pow(10, row.decimals), row.decimals)} ${getAssetTitleParams(null, row.tokenId, row.ticker, false)}`;
		
		if (row.value && currentPrices[row.tokenid]) {
			result += ` <span class="text-light">${formatPriceUSD(row.value, row.decimals, currentPrices[row.tokenid])}</span>`;
		}
		
		return result;
	}

	// After the table renders, replace address wrapper spans with AddressLink components
	let tableContainer;
	
	$: if (tableContainer && whaleTxs.length > 0) {
		updateAddressLinks();
	}

	function updateAddressLinks() {
		setTimeout(() => {
			const addressWrappers = tableContainer?.querySelectorAll('[data-address-wrapper]');
			addressWrappers?.forEach(wrapper => {
				const address = wrapper.dataset.addressWrapper;
				const startChars = parseInt(wrapper.dataset.startChars) || 9;
				const endChars = parseInt(wrapper.dataset.endChars) || 4;
				
				if (address) {
					wrapper.innerHTML = `<a href="/addresses/${address}" data-address="${address}" class="address-link">${formatAddress(address, startChars, endChars)}</a>`;
				}
			});
		}, 0);
	}

	function formatAddress(address, startChars, endChars) {
		if (!address || address.length <= startChars + endChars) return address;
		return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
	}
</script>

<div class="row w-100">
	<h2 class="subtitle ps-1 ps-sm-0">Latest big transactions</h2>
	
	<!-- Desktop Table -->
	<div class="d-none d-lg-block p-0" bind:this={tableContainer}>
		<DataTable 
			{headers} 
			data={whaleTxs} 
			{loading}
			emptyMessage={isTestnet() ? "Whale transactions not available on testnet" : "Loading whale transactions..."}
		/>
	</div>
	
	<!-- Mobile Simple List -->
	<div class="d-lg-none mobile-whale-txs glass-table-container">
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
	/* Use glass-table-container from common components */
	.mobile-whale-txs {
		/* Extends glass-table-container from common-components.css */
	}

	.mobile-tx-item {
		padding: 1rem 0;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.mobile-tx-item:last-child {
		border-bottom: none;
	}

	/* Transaction link styling */
	.mobile-tx-item a.text-info {
		color: var(--main-color) !important;
		text-decoration: none;
		font-weight: 600;
	}

	.mobile-tx-item a.text-info:hover {
		color: var(--main-color-hover) !important;
	}
</style>