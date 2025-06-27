<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getBlocks } from '$lib/utils/api.js';
	import { formatDateString, formatErgValue, formatFileSize, formatNumber, formatDifficulty, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { addAddress, getOwner, addressBook } from '$lib/stores/addressBook.js';

	let blocks = [];
	let loading = true;
	let error = null;
	let totalPages = 1;
	
	const DEFAULT_LIMIT = 20;

	// Get pagination params from URL
	$: limit = parseInt($page.url.searchParams.get('limit') || DEFAULT_LIMIT.toString(), 10);
	$: offset = parseInt($page.url.searchParams.get('offset') || '0', 10);
	$: currentPage = Math.floor(offset / limit) + 1;

	const headers = [
		{ label: 'Height', field: 'height', render: (value, row) => `<a href="/blocks/${row.id}" data-block-id="${row.id}" class="height-link">${formatNumber(value, 0, true)}</a>` },
		{ label: 'Time', field: 'timestamp', render: (value) => formatDateString(value) },
		{ label: 'Transactions', field: 'transactionsCount', render: (value) => formatNumber(value) },
		{ label: 'Mined by', field: 'miner', render: (value, row, index) => renderMinerCell(value, index) },
		{ label: 'Reward', field: 'minerReward', render: (value) => `${formatErgValue(value)} <small class="text-muted">${formatPriceUSD(value, 9, $ergPrice.value)}</small>` },
		{ label: 'Difficulty', field: 'difficulty', render: (value) => formatDifficulty(value) },
		{ label: 'Size', field: 'size', render: (value) => formatFileSize(value) }
	];

	onMount(async () => {
		await loadBlocks();
	});

	addressBook.subscribe(() => {
		updateMinerCells();
	});
	
	// Function to render miner cell with addressbook integration
	function renderMinerCell(miner, index) {
		if (!miner?.address) return '';
		
		// Add address to fetch queue for addressbook lookup
		addAddress(miner.address);
		
		return `<span class="miner-cell-reactive" data-address="${miner.address}" data-index="${index}"></span>`;
	}
	
	function updateMinerCells() {
		if (!browser) return;
		
		const minerCells = document.querySelectorAll('.miner-cell-reactive');
		
		minerCells.forEach(cell => {
			const address = cell.dataset.address;
			const index = parseInt(cell.dataset.index);
			
			if (address && blocks[index]?.miner?.address === address) {
				// Get friendly name from addressbook
				const friendlyName = getOwner(address, $addressBook);
				
				// Use friendly name, fallback to provided name, then formatted address
				const displayName = friendlyName || 
									formatAddress(blocks[index].miner.address, 9, 4) || 
									formatAddress(address, 6, 6);
				
				cell.innerHTML = `<a href="/addresses/${address}" class="miner-link" data-address="${address}">${displayName}</a>`;
			}
		});
	}

	async function loadBlocks() {
		try {
			loading = true;
			error = null;
			
			const data = await getBlocks({
				limit,
				offset,
				sortBy: 'height',
				sortDirection: 'desc'
			});
			
			blocks = data.items || [];
			totalPages = Math.ceil((data.total || 0) / limit);
		} catch (err) {
			error = err.message;
			console.error('Failed to load blocks:', err);
		} finally {
			loading = false;
		}
	}


	async function handlePageChange(event) {
		const newPage = event.detail.page;
		const newOffset = (newPage - 1) * limit;
		const url = new URL($page.url);
		
		// Update offset and limit in URL
		if (newOffset === 0) {
			url.searchParams.delete('offset');
		} else {
			url.searchParams.set('offset', newOffset.toString());
		}
		
		if (limit === DEFAULT_LIMIT) {
			url.searchParams.delete('limit');
		} else {
			url.searchParams.set('limit', limit.toString());
		}
		
		// Update URL without full page reload
		await goto(url.pathname + url.search, { 
			replaceState: false,
			noScroll: false,
			keepFocus: false
		});
		
		// Smooth scroll to top
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Latest Blocks - Erg Explorer</title>
	<meta name="description" content="View the latest blocks mined on the Ergo blockchain with details about transactions, miners, and rewards.">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<div class="page-header glass-header mb-0">
				<div class="header-content">
					<h1 class="page-title">
						<i class="fas fa-cubes me-3 title-icon"></i>
						Latest Blocks
					</h1>
					<div class="header-info">
						{#if !loading && blocks.length > 0}
							<span class="info-text">
								Showing {offset + 1} - {Math.min(offset + limit, offset + blocks.length)} blocks
							</span>
						{/if}
					</div>
				</div>
			</div>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<div class="glass-container">
				<DataTable 
					{headers} 
					data={blocks} 
					{loading}
					emptyMessage="No blocks found"
				/>
			</div>

			{#if !loading && totalPages > 1}
				<div class="mt-2">
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

<div class="page-bottom-margin"></div>

<style>
	.glass-container {
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-md);
		-webkit-backdrop-filter: var(--glass-blur-md);
		box-shadow: var(--glass-shadow-sm);
		border-radius: 16px;
		overflow: hidden;
		padding: 0;
	}

	:global(.height-link) {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.3s ease;
	}

	:global(.height-link:hover) {
		color: var(--main-color);
	}

	:global(.miner-link) {
		color: var(--text-strong);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	:global(.miner-link:hover) {
		color: var(--main-color);
	}

	.page-header {
		padding: 1.5rem 0;
		margin-bottom: 1rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-title {
		color: var(--text-strong);
		font-weight: 700;
		font-size: 2rem;
		margin: 0;
		display: flex;
		align-items: center;
	}

	.title-icon {
		color: var(--main-color);
		font-size: 1.8rem;
	}

	.header-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.info-text {
		color: var(--text-light);
		font-size: 0.95rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 1rem 1.5rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.title-icon {
			font-size: 1.4rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}

		.header-info {
			align-items: flex-start;
		}
	}

	.page-bottom-margin {
		height: 2rem;
	}

	/* Prevent line breaks in reward column */
	:global(.glass-table td:nth-child(5)) {
		white-space: nowrap;
	}
</style>