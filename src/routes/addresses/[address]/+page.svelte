<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import AddressFormatter from '$lib/components/data/AddressFormatter.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getAddress, getAddressTransactions, getPrices } from '$lib/utils/api.js';
	import { formatErgValue, formatDateString, formatNumber, formatPriceUSD } from '$lib/utils/formatting.js';

	let address = $page.params.address;
	let addressData = null;
	let transactions = [];
	let loading = true;
	let error = null;
	let currentPage = 1;
	let totalPages = 1;
	let ergPrice = null;
	let showUnspentBoxes = false;
	
	const ITEMS_PER_PAGE = 20;

	$: offset = (currentPage - 1) * ITEMS_PER_PAGE;

	const txHeaders = [
		{ 
			label: 'Transaction ID', 
			field: 'id',
			render: (value) => `<a href="/transactions/${value}" class="fw-bold font-monospace">${value.slice(0, 16)}...</a>` 
		},
		{ 
			label: 'Time', 
			field: 'timestamp',
			render: (value) => formatDateString(value) 
		},
		{ 
			label: 'Height', 
			field: 'inclusionHeight',
			render: (value) => value ? `<a href="/blocks/${value}">${formatNumber(value)}</a>` : 'Pending'
		},
		{ 
			label: 'Direction', 
			field: 'direction',
			render: (value, row) => {
				const isIncoming = row.inputs?.some(input => input.address !== address) && 
								   row.outputs?.some(output => output.address === address);
				return `<span class="badge ${isIncoming ? 'bg-success' : 'bg-warning'}">${isIncoming ? 'In' : 'Out'}</span>`;
			}
		},
		{ 
			label: 'Value', 
			field: 'outputs',
			render: (value, row) => {
				const relevantOutputs = value?.filter(o => o.address === address) || [];
				const totalValue = relevantOutputs.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0);
				return `${formatErgValue(totalValue)} ERG<br><small class="text-muted">${formatPriceUSD(totalValue, ergPrice)}</small>`;
			}
		}
	];

	onMount(async () => {
		await Promise.all([loadAddressData(), loadTransactions(), loadPrices()]);
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadAddressData() {
		try {
			const data = await getAddress(address);
			addressData = data;
		} catch (err) {
			console.error('Failed to load address data:', err);
		}
	}

	async function loadTransactions() {
		try {
			loading = true;
			error = null;
			
			const data = await getAddressTransactions(address, {
				limit: ITEMS_PER_PAGE,
				offset
			});
			
			transactions = data.items || [];
			totalPages = Math.ceil((data.total || 0) / ITEMS_PER_PAGE);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load transactions:', err);
		} finally {
			loading = false;
		}
	}

	async function handlePageChange(event) {
		currentPage = event.detail.page;
		await loadTransactions();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function getVerifiedOwner(addr) {
		const knownAddresses = {
			'9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk': 'ErgExplorer',
			'9fRAWhdxEsTcdb8PhGNrpfhBmXNpUGcGVCKVNEJUQCrEQpGpBZR': 'Ergo Foundation'
		};
		return knownAddresses[addr] || null;
	}

	async function copyAddress() {
		try {
			await navigator.clipboard.writeText(address);
			
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}

	$: verifiedOwner = getVerifiedOwner(address);
	$: ergBalance = addressData?.balance?.nanoErgs || 0;
	$: totalTxs = addressData?.transactionsCount || 0;
</script>

<svelte:head>
	<title>Address {address.slice(0, 16)}... - Erg Explorer</title>
	<meta name="description" content="View address details, balance, and transaction history for Ergo address {address}">
</svelte:head>

<div class="col-md-12">
	<div class="row w-100">
		<div class="col-md-12 mb-3 mb-md-4">
			<h2 class="m-0">Address</h2>
		</div>
	</div>

	<div class="mb-3">
		<div class="row w-100 div-cell-dark border-bottom-flat p-2 p-lg-3" style="align-items:center;">
			<div class="col pe-0 ps-0">
				<p>
					<button 
						class="btn-link text-decoration-none p-0 border-0 bg-transparent font-monospace"
						onclick={copyAddress}
						title="Click to copy address"
					>
						{address}
					</button>
				</p>
			</div>
		</div>

		<div class="row w-100 div-cell-dark border-top-flat p-2 p-lg-3">
			<div class="col-md p-0">
				<div class="row w-100">
					<div class="ps-0 pe-0 col-lg-6 col-md-12">
						<h4><strong>Summary</strong></h4>
						{#if verifiedOwner}
							<p><strong>Verified owner:</strong> <span class="text-success">{verifiedOwner}</span></p>
						{/if}
						<p><strong>Total transactions:</strong> {formatNumber(totalTxs)}</p>
						
						{#if showUnspentBoxes}
							<button 
								class="btn btn-outline-info mb-2"
								onclick={() => showUnspentBoxes = false}
							>
								Hide Unspent Boxes
							</button>
						{:else}
							<button 
								class="btn btn-info mb-2"
								onclick={() => showUnspentBoxes = true}
							>
								Show Unspent Boxes
							</button>
						{/if}

						<hr class="my-3 d-lg-none">
					</div>
					<div class="ps-0 pe-0 ps-lg-3 col-lg-6 col-md-12 border-lg-start">
						<h4><strong>Balance</strong></h4>
						<h5 class="text-primary">
							{formatErgValue(ergBalance)} ERG
							{#if ergPrice}
								<br><small class="text-muted">{formatPriceUSD(ergBalance, ergPrice)}</small>
							{/if}
						</h5>
						
						{#if addressData?.balance?.assets && addressData.balance.assets.length > 0}
							<div class="mt-3">
								<h6><strong>Assets</strong></h6>
								{#each addressData.balance.assets.slice(0, 5) as asset}
									<div class="mb-2">
										<TokenDisplay 
											tokenId={asset.tokenId} 
											name={asset.name}
											amount={asset.amount}
											decimals={asset.decimals}
											format="full"
										/>
									</div>
								{/each}
								{#if addressData.balance.assets.length > 5}
									<small class="text-muted">
										+{addressData.balance.assets.length - 5} more assets
									</small>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if error}
		<ErrorMessage message={error} type="danger" dismissible />
	{/if}

	<div class="card">
		<div class="card-header d-flex justify-content-between align-items-center">
			<h5 class="card-title mb-0">
				<i class="fas fa-exchange-alt me-2"></i>
				Transaction History
			</h5>
			<div class="text-muted">
				{#if !loading && transactions.length > 0}
					Page {currentPage} of {totalPages}
				{/if}
			</div>
		</div>
		<div class="card-body p-0">
			<DataTable 
				headers={txHeaders} 
				data={transactions} 
				{loading}
				emptyMessage="No transactions found for this address"
			/>
		</div>
	</div>

	{#if !loading && totalPages > 1}
		<div class="mt-4">
			<Pagination 
				{currentPage} 
				{totalPages}
				on:pageChange={handlePageChange}
			/>
		</div>
	{/if}
</div>

<style>
	.div-cell-dark {
		background: rgba(var(--bs-body-bg-rgb), 0.8);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.border-bottom-flat {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		margin-bottom: 0;
	}

	.border-top-flat {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		margin-top: 0;
	}

	.card {
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.card-header {
		background: linear-gradient(135deg, var(--main-color) 0%, rgba(34, 127, 158, 0.1) 100%);
		color: white;
		border: none;
	}

	.btn-link:hover {
		color: var(--main-color) !important;
	}

	.text-primary {
		color: var(--main-color) !important;
	}

	h2, h4 {
		color: var(--bs-body-color);
		font-weight: 600;
	}

	.badge {
		font-size: 0.75rem;
	}

	.bg-success {
		background-color: #28a745 !important;
	}

	.bg-warning {
		background-color: #ffc107 !important;
		color: #000 !important;
	}
</style>