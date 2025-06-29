<script>
	import { formatPriceUSD, formatDateString } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js'
	import { isTestnet } from '$lib/stores/network.svelte.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';

	export let whaleTxs = [];
	export let currentPrices = {};

	$: loading = whaleTxs.length === 0;

	const headers = [
		{ label: 'Tx', field: 'txid', render: (value) => `<a href="/transactions/${value}" data-transaction-hover="${value}" aria-label="View transaction ${value}"><i class="fas fa-link text-info"></i></a>` },
		{ label: 'Time', field: 'time', render: (value) => formatDateString(parseInt(value)) },
		{ 
			label: 'From', 
			field: 'fromaddress',
			component: AddressLink,
			componentProps: (row) => ({
				address: row.fromaddress || "",
				startChars: 9,
				endChars: 4,
				showCopy: false
			})
		},
		{ 
			label: 'To', 
			field: 'toaddress',
			component: AddressLink,
			componentProps: (row) => ({
				address: row.toaddress || "",
				startChars: 9,
				endChars: 4,
				showCopy: false
			})
		},
		{ label: 'Value', field: 'value', render: (value, row) => renderValueCell(value, row) }
	];


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
	
	<!-- Mobile Card Layout -->
	<div class="d-lg-none mobile-whale-cards">
		{#if whaleTxs.length > 0}
			{#each whaleTxs as tx, index (tx.txid + '_' + index)}
				<div class="glass-card">
					<div class="card-header">
						<div class="tx-header-content">
						<div class="tx-icon">
							<i class="fas fa-exchange-alt"></i>
						</div>
							<div class="tx-info">
								<a href="/transactions/{tx.txid}" data-transaction-hover="{tx.txid}" class="tx-link" aria-label="View transaction {tx.txid}">
									{formatAddress(tx.txid, 9, 4)}
								</a>
								<div class="tx-time">{formatDateString(parseInt(tx.time))}</div>
							</div>
						</div>
					</div>
					<div class="card-content">
						<div class="detail-row">
							<span class="detail-label">From:</span>
							<span class="detail-value">
								<AddressLink address={tx.fromaddress} startChars={9} endChars={4} />
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">To:</span>
							<span class="detail-value">
								<AddressLink address={tx.toaddress} startChars={9} endChars={4} />
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Value:</span>
							<span class="detail-value">
								{@html formatValue(tx.value / Math.pow(10, tx.decimals), tx.decimals)} {@html getAssetTitleParams(null, tx.tokenId, tx.ticker, false)}
								{#if tx.value && currentPrices[tx.tokenid]}
									<small class="text-light">
										{formatPriceUSD(tx.value, tx.decimals, currentPrices[tx.tokenid])}
									</small>
								{/if}
							</span>
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="mobile-empty-state">
				{#if isTestnet()}
					<i class="fas fa-whale fa-3x text-muted mb-3"></i>
					<p class="text-muted">Whale transactions not available on testnet</p>
				{:else}
					<i class="fas fa-spinner fa-spin fa-3x text-muted mb-3"></i>
					<p class="text-muted">Loading whale transactions...</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.mobile-whale-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.whale-tx-card {
		background: var(--glass-bg-medium);
	}


	.tx-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 8px;
		background: var(--glass-bg-light);
		border: 2px solid var(--borders);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: var(--main-color);
	}

	.tx-header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		gap: 1rem;
	}

	.tx-info {
		flex-grow: 1;
		min-width: 0;
	}

	.tx-link {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 600;
		font-size: 1.1rem;
		transition: color 0.2s ease;
		display: block;
	}

	.tx-link:hover {
		color: var(--main-color);
	}

	.tx-time {
		font-size: 0.9rem;
		color: var(--text-light);
		flex-shrink: 0;
		text-align: left;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.detail-label {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
		flex-shrink: 0;
		min-width: 70px;
	}

	.detail-value {
		color: var(--text-strong);
		font-size: 0.9rem;
		text-align: right;
		word-break: break-word;
	}

	.mobile-empty-state {
		text-align: center;
		padding: 3rem 1rem;
		background: var(--glass-bg-subtle);
		border-radius: 12px;
		backdrop-filter: var(--glass-blur-sm);
	}

	/* Responsive adjustments */
	@media (max-width: 576px) {
		.mobile-whale-cards :global(.glass-card) {
			margin: 0 -0.5rem;
		}
	}
</style>