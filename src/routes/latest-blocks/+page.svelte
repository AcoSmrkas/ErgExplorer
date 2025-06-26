<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import AddressFormatter from '$lib/components/data/AddressFormatter.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getBlocks, getPrices } from '$lib/utils/api.js';
	import { formatDateString, formatErgValue, formatFileSize, formatNumber, formatDifficulty, formatPriceUSD } from '$lib/utils/formatting.js';

	let blocks = [];
	let loading = true;
	let error = null;
	let currentPage = 1;
	let totalPages = 1;
	let ergPrice = null;
	
	const ITEMS_PER_PAGE = 20;

	$: offset = (currentPage - 1) * ITEMS_PER_PAGE;

	const headers = [
		{ label: 'Height', field: 'height', sortKey: 'height', render: (value, row) => `<a href="/blocks/${row.id}" data-block-id="${row.id}" aria-label="View block ${value}"><i class="fas fa-link text-info me-1"></i></a><span class="fw-bold">${formatNumber(value, 0, true)}</span>` },
		{ label: 'Time', field: 'timestamp', sortKey: 'timestamp', render: (value) => formatDateString(value) },
		{ label: 'Transactions', field: 'transactionsCount', sortKey: 'transactionsCount', render: (value) => formatNumber(value) },
		{ label: 'Mined by', field: 'miner', render: (value) => `<span class="miner-cell" data-address="${value.address}" data-name="${value.name}"></span>` },
		{ label: 'Reward', field: 'minerReward', sortKey: 'minerReward', render: (value) => `${formatErgValue(value)} ERG<br><small class="text-muted">${formatPriceUSD(value, ergPrice)}</small>` },
		{ label: 'Difficulty', field: 'difficulty', sortKey: 'difficulty', render: (value) => formatDifficulty(value) },
		{ label: 'Size', field: 'size', sortKey: 'size', render: (value) => formatFileSize(value) }
	];

	onMount(async () => {
		await Promise.all([loadBlocks(), loadPrices()]);
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadBlocks() {
		try {
			loading = true;
			error = null;
			
			const data = await getBlocks({
				limit: ITEMS_PER_PAGE,
				offset,
				sortBy: 'height',
				sortDirection: 'desc'
			});
			
			blocks = data.items || [];
			totalPages = Math.ceil((data.total || 0) / ITEMS_PER_PAGE);
			
			// Enhance blocks data after render for miner addresses
			setTimeout(() => enhanceMinerCells(), 100);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load blocks:', err);
		} finally {
			loading = false;
		}
	}

	function enhanceMinerCells() {
		const minerCells = document.querySelectorAll('.miner-cell');
		minerCells.forEach(cell => {
			const address = cell.dataset.address;
			const name = cell.dataset.name;
			
			if (address) {
				// Create AddressFormatter component manually
				cell.innerHTML = `
					<div class="address-formatter">
						<span class="address-text" title="${address}">
							${name || `${address.slice(0, 6)}...${address.slice(-6)}`}
						</span>
						<a href="/addresses/${address}" class="ms-1 text-primary">
							<i class="fas fa-external-link-alt"></i>
						</a>
					</div>
				`;
			}
		});
	}

	async function handlePageChange(event) {
		currentPage = event.detail.page;
		await loadBlocks();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Latest Blocks - Erg Explorer</title>
	<meta name="description" content="View the latest blocks mined on the Ergo blockchain with details about transactions, miners, and rewards.">
</svelte:head>

<div class="container-fluid">
	<div class="row">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h1 class="h3 mb-0">
					<i class="fas fa-cubes me-2 text-primary"></i>
					Latest Blocks
				</h1>
				<div class="text-muted">
					{#if !loading && blocks.length > 0}
						Showing {ITEMS_PER_PAGE * (currentPage - 1) + 1} - {Math.min(ITEMS_PER_PAGE * currentPage, blocks.length)} blocks
					{/if}
				</div>
			</div>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<div class="card">
				<div class="card-body p-0">
					<DataTable 
						{headers} 
						data={blocks} 
						{loading}
						emptyMessage="No blocks found"
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
	</div>
</div>

<style>
	.card {
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	:global(.address-formatter) {
		display: inline-flex;
		align-items: center;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}

	:global(.address-text) {
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.h3 {
		color: var(--bs-body-color);
		font-weight: 600;
	}

	.text-primary {
		color: var(--main-color) !important;
	}
</style>