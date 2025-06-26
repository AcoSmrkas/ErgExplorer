<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getTokens } from '$lib/utils/api.js';
	import { formatNumber, formatDateString, formatTokenAmount } from '$lib/utils/formatting.js';

	let tokens = [];
	let loading = true;
	let error = null;
	let currentPage = 1;
	let totalPages = 1;
	let searchQuery = '';
	let sortBy = 'createdAt';
	let sortDirection = 'desc';
	let showNFTs = true;
	let showFungible = true;
	
	const ITEMS_PER_PAGE = 50;

	$: offset = (currentPage - 1) * ITEMS_PER_PAGE;
	$: filteredTokens = filterTokens(tokens, searchQuery, showNFTs, showFungible);

	const headers = [
		{ 
			label: 'Token', 
			field: 'name',
			render: (value, row) => `
				<div class="d-flex align-items-center">
					<img src="${getTokenIcon(row.tokenId, row.name)}" alt="${row.name || 'Token'}" class="token-icon me-2" width="24" height="24">
					<div>
						<div class="fw-bold">${row.name || 'Unnamed Token'}</div>
						<small class="text-muted font-monospace">${row.tokenId.slice(0, 16)}...</small>
					</div>
				</div>
			`
		},
		{ 
			label: 'Type', 
			field: 'type',
			render: (value, row) => {
				const isNFT = row.decimals === 0 && row.emissionAmount === '1';
				return `<span class="badge ${isNFT ? 'bg-info' : 'bg-success'}">${isNFT ? 'NFT' : 'Token'}</span>`;
			}
		},
		{ 
			label: 'Supply', 
			field: 'emissionAmount',
			render: (value, row) => formatTokenAmount(value, row.decimals)
		},
		{ 
			label: 'Decimals', 
			field: 'decimals',
			render: (value) => formatNumber(value)
		},
		{ 
			label: 'Created', 
			field: 'createdAt',
			sortKey: 'createdAt',
			render: (value) => formatDateString(value)
		},
		{ 
			label: 'Actions', 
			field: 'tokenId',
			render: (value) => `<a href="/tokens/${value}" class="btn btn-outline-primary btn-sm">View</a>`
		}
	];

	onMount(async () => {
		await loadTokens();
	});

	function getTokenIcon(tokenId, name) {
		// Check for known token icons in static/images/tokens/
		const knownTokens = {
			// Add mappings for known tokens
		};
		
		if (knownTokens[tokenId]) {
			return `/images/tokens/${knownTokens[tokenId]}`;
		}
		
		// Default token icon
		return '/images/logo-new.png';
	}

	function filterTokens(tokenList, query, includeNFTs, includeFungible) {
		return tokenList.filter(token => {
			// Type filter
			const isNFT = token.decimals === 0 && token.emissionAmount === '1';
			if (isNFT && !includeNFTs) return false;
			if (!isNFT && !includeFungible) return false;
			
			// Search filter
			if (query) {
				const searchLower = query.toLowerCase();
				return (
					token.name?.toLowerCase().includes(searchLower) ||
					token.tokenId.toLowerCase().includes(searchLower) ||
					token.description?.toLowerCase().includes(searchLower)
				);
			}
			
			return true;
		});
	}

	async function loadTokens() {
		try {
			loading = true;
			error = null;
			
			const data = await getTokens({
				limit: ITEMS_PER_PAGE,
				offset,
				sortBy,
				sortDirection
			});
			
			tokens = data.items || [];
			totalPages = Math.ceil((data.total || 0) / ITEMS_PER_PAGE);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load tokens:', err);
		} finally {
			loading = false;
		}
	}

	async function handlePageChange(event) {
		currentPage = event.detail.page;
		await loadTokens();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function handleFilterChange() {
		currentPage = 1;
		await loadTokens();
	}

	function handleSearch(event) {
		if (event.key === 'Enter' || event.type === 'click') {
			handleFilterChange();
		}
	}

	function clearFilters() {
		searchQuery = '';
		showNFTs = true;
		showFungible = true;
		handleFilterChange();
	}
</script>

<svelte:head>
	<title>Issued Tokens - Erg Explorer</title>
	<meta name="description" content="Browse all tokens and NFTs issued on the Ergo blockchain with advanced filtering and search capabilities.">
</svelte:head>

<div class="container-fluid">
	<div class="row">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h1 class="h3 mb-0">
					<i class="fas fa-coins me-2 text-primary"></i>
					Issued Tokens
				</h1>
				<div class="text-muted">
					{#if !loading && filteredTokens.length > 0}
						Showing {filteredTokens.length} tokens
					{/if}
				</div>
			</div>

			<!-- Filters -->
			<div class="card mb-4">
				<div class="card-body">
					<div class="row g-3">
						<div class="col-md-6">
							<label class="form-label">Search tokens</label>
							<div class="input-group">
								<input 
									bind:value={searchQuery}
									onkeydown={handleSearch}
									type="text" 
									class="form-control" 
									placeholder="Search by name, ID, or description..."
								>
								<button class="btn btn-outline-primary" type="button" onclick={handleFilterChange}>
									<i class="fas fa-search"></i>
								</button>
							</div>
						</div>
						<div class="col-md-3">
							<label class="form-label">Token Types</label>
							<div class="d-flex gap-3">
								<div class="form-check">
									<input 
										bind:checked={showFungible}
										onchange={handleFilterChange}
										class="form-check-input" 
										type="checkbox" 
										id="showFungible"
									>
									<label class="form-check-label" for="showFungible">
										Tokens
									</label>
								</div>
								<div class="form-check">
									<input 
										bind:checked={showNFTs}
										onchange={handleFilterChange}
										class="form-check-input" 
										type="checkbox" 
										id="showNFTs"
									>
									<label class="form-check-label" for="showNFTs">
										NFTs
									</label>
								</div>
							</div>
						</div>
						<div class="col-md-3 d-flex align-items-end">
							<button class="btn btn-outline-secondary" onclick={clearFilters}>
								<i class="fas fa-times me-1"></i>
								Clear Filters
							</button>
						</div>
					</div>
				</div>
			</div>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<div class="card">
				<div class="card-body p-0">
					<DataTable 
						{headers} 
						data={filteredTokens} 
						{loading}
						emptyMessage="No tokens found matching your criteria"
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

			{#if !loading && tokens.length > 0}
				<div class="mt-3">
					<div class="row text-center">
						<div class="col-md-3">
							<div class="stat-card">
								<div class="stat-value">{formatNumber(tokens.length)}</div>
								<div class="stat-label">Total Tokens</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card">
								<div class="stat-value">
									{formatNumber(tokens.filter(t => t.decimals === 0 && t.emissionAmount === '1').length)}
								</div>
								<div class="stat-label">NFTs</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card">
								<div class="stat-value">
									{formatNumber(tokens.filter(t => !(t.decimals === 0 && t.emissionAmount === '1')).length)}
								</div>
								<div class="stat-label">Fungible Tokens</div>
							</div>
						</div>
						<div class="col-md-3">
							<div class="stat-card">
								<div class="stat-value">{formatNumber(filteredTokens.length)}</div>
								<div class="stat-label">Filtered Results</div>
							</div>
						</div>
					</div>
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

	.text-primary {
		color: var(--main-color) !important;
	}

	.btn-outline-primary {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	.btn-outline-primary:hover {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	.form-check-input:checked {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	:global(.token-icon) {
		border-radius: 50%;
		object-fit: cover;
		background-color: var(--bs-light);
	}

	.stat-card {
		padding: 1rem;
		background: rgba(var(--bs-primary-rgb), 0.05);
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--main-color);
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.85rem;
		color: var(--bs-secondary-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge {
		font-size: 0.75rem;
	}

	.bg-info {
		background-color: #17a2b8 !important;
	}

	.bg-success {
		background-color: #28a745 !important;
	}
</style>