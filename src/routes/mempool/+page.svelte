<script>
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import AddressFormatter from '$lib/components/data/AddressFormatter.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getMempool, getPrices } from '$lib/utils/api.js';
	import { formatDateString, formatErgValue, formatFileSize, formatNumber, formatPriceUSD } from '$lib/utils/formatting.js';

	let transactions = [];
	let loading = true;
	let error = null;
	let currentPage = 1;
	let totalPages = 1;
	let ergPrice = null;
	let autoRefresh = true;
	let refreshInterval;
	
	const ITEMS_PER_PAGE = 20;
	const REFRESH_INTERVAL = 10000; // 10 seconds

	$: offset = (currentPage - 1) * ITEMS_PER_PAGE;

	const headers = [
		{ 
			label: 'Transaction ID', 
			field: 'id', 
			render: (value) => `<a href="/transactions/${value}" class="fw-bold text-monospace">${value.slice(0, 16)}...</a>` 
		},
		{ 
			label: 'Created', 
			field: 'creationTimestamp', 
			sortKey: 'creationTimestamp', 
			render: (value) => formatDateString(value) 
		},
		{ 
			label: 'Inputs', 
			field: 'inputs', 
			render: (value) => formatNumber(value?.length || 0) 
		},
		{ 
			label: 'Outputs', 
			field: 'outputs', 
			render: (value) => formatNumber(value?.length || 0) 
		},
		{ 
			label: 'Value', 
			field: 'outputs', 
			render: (value) => {
				const totalValue = value?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
				return `${formatErgValue(totalValue)} ERG<br><small class="text-muted">${formatPriceUSD(totalValue, ergPrice)}</small>`;
			}
		},
		{ 
			label: 'Size', 
			field: 'size', 
			render: (value) => formatFileSize(value) 
		}
	];

	onMount(async () => {
		await Promise.all([loadTransactions(), loadPrices()]);
		
		if (autoRefresh) {
			startAutoRefresh();
		}
		
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadTransactions() {
		try {
			loading = true;
			error = null;
			
			const data = await getMempool({
				limit: ITEMS_PER_PAGE,
				offset
			});
			
			transactions = data.items || [];
			totalPages = Math.ceil((data.total || 0) / ITEMS_PER_PAGE);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load mempool:', err);
		} finally {
			loading = false;
		}
	}

	function startAutoRefresh() {
		refreshInterval = setInterval(async () => {
			if (currentPage === 1 && !loading) {
				await loadTransactions();
			}
		}, REFRESH_INTERVAL);
	}

	function stopAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	function toggleAutoRefresh() {
		autoRefresh = !autoRefresh;
		if (autoRefresh) {
			startAutoRefresh();
		} else {
			stopAutoRefresh();
		}
	}

	async function handlePageChange(event) {
		currentPage = event.detail.page;
		await loadTransactions();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function handleRefresh() {
		await loadTransactions();
	}
</script>

<svelte:head>
	<title>Mempool - Erg Explorer</title>
	<meta name="description" content="View pending transactions in the Ergo blockchain mempool awaiting confirmation.">
</svelte:head>

<div class="container-fluid">
	<div class="row">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h1 class="h3 mb-0">
					<i class="fas fa-clock me-2 text-warning"></i>
					Mempool Transactions
				</h1>
				<div class="d-flex align-items-center gap-3">
					<div class="form-check form-switch">
						<input 
							class="form-check-input" 
							type="checkbox" 
							id="autoRefresh"
							bind:checked={autoRefresh}
							onchange={toggleAutoRefresh}
						>
						<label class="form-check-label" for="autoRefresh">
							Auto-refresh
						</label>
					</div>
					<button 
						class="btn btn-outline-primary btn-sm"
						onclick={handleRefresh}
						disabled={loading}
					>
						<i class="fas fa-sync-alt" class:fa-spin={loading}></i>
						Refresh
					</button>
				</div>
			</div>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<div class="alert alert-info d-flex align-items-center" role="alert">
				<i class="fas fa-info-circle me-2"></i>
				<div>
					<strong>Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block.
					{#if autoRefresh}
						<span class="badge bg-success ms-2">Auto-refreshing every {REFRESH_INTERVAL/1000}s</span>
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-body p-0">
					<DataTable 
						{headers} 
						data={transactions} 
						{loading}
						emptyMessage="No pending transactions in mempool"
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

			{#if !loading && transactions.length > 0}
				<div class="text-center mt-3">
					<small class="text-muted">
						Showing {transactions.length} of {totalPages * ITEMS_PER_PAGE} pending transactions
					</small>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.card {
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.h3 {
		color: var(--bs-body-color);
		font-weight: 600;
	}

	.form-check-input:checked {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	.btn-outline-primary {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	.btn-outline-primary:hover {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	.alert-info {
		background-color: rgba(var(--bs-info-rgb), 0.1);
		border-color: rgba(var(--bs-info-rgb), 0.2);
		color: var(--bs-info-text-emphasis);
	}

	.badge {
		font-size: 0.7rem;
	}

	:global(.fa-spin) {
		animation: fa-spin 1s infinite linear;
	}

	@keyframes fa-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>