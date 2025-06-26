<script>
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import AddressFormatter from '$lib/components/data/AddressFormatter.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { formatNumber } from '$lib/utils/formatting.js';

	let addresses = [];
	let loading = true;
	let error = null;
	let searchQuery = '';
	let selectedCategory = 'all';

	$: filteredAddresses = filterAddresses(addresses, searchQuery, selectedCategory);

	// Known addresses - in a real app this would come from an API
	const knownAddresses = [
		{
			address: '9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk',
			name: 'ErgExplorer Donation',
			category: 'service',
			description: 'Official donation address for ErgExplorer development',
			verified: true
		},
		{
			address: '9fRAWhdxEsTcdb8PhGNrpfhBmXNpUGcGVCKVNEJUQCrEQpGpBZR',
			name: 'Ergo Foundation',
			category: 'foundation',
			description: 'Official Ergo Foundation address',
			verified: true
		},
		{
			address: '9f5ZKbECVTm25JTRQHDHGM5ehC8tUw5g1fCBQ4aaE9rEhQvQv3u',
			name: 'Spectrum Finance',
			category: 'defi',
			description: 'Spectrum Finance DEX protocol',
			verified: true
		},
		{
			address: '9h7L7sUHZk43VQC3PHtSp5ujAWcZtYmWATBH746YReeCVVt1dDL',
			name: 'SigmaUSD Bank',
			category: 'defi',
			description: 'SigmaUSD algorithmic stablecoin protocol',
			verified: true
		},
		{
			address: '9iE2MadGSrn1ivHmRZJWWxmZrWqu3YjvjmTSV4qWVx5mRd8sBJT',
			name: 'ErgoMixer',
			category: 'privacy',
			description: 'Non-interactive mixing protocol for privacy',
			verified: true
		},
		{
			address: '9fVtBCMJPpGvTuWNZhZwN7X6Vf7TsWc3VnKnFX8Ysj9X6eLVx5K',
			name: 'Mining Pool Hub',
			category: 'mining',
			description: 'Popular Ergo mining pool',
			verified: false
		},
		{
			address: '9gE8XqmJvQQgBJpToGhUhLKh6FeSkNBV7sQVv5Rt4RyXv8ZWKtu',
			name: 'NightOwl Casino',
			category: 'gaming',
			description: 'Decentralized casino on Ergo',
			verified: false
		},
		{
			address: '9fRfAMqvhGT4dB8B3NYXqH5fHVwWuAhgFXY3UjPKWVR9fQp7Lmo',
			name: 'CYTI Token',
			category: 'token',
			description: 'CYTI governance token address',
			verified: true
		}
	];

	const headers = [
		{ 
			label: 'Name', 
			field: 'name',
			render: (value, row) => `
				<div class="d-flex align-items-center">
					<div>
						<div class="fw-bold">${value}</div>
						${row.verified ? '<span class="badge bg-success ms-2"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
					</div>
				</div>
			`
		},
		{ 
			label: 'Address', 
			field: 'address',
			render: (value) => `<span class="address-cell" data-address="${value}"></span>`
		},
		{ 
			label: 'Category', 
			field: 'category',
			render: (value) => `<span class="badge bg-primary">${getCategoryLabel(value)}</span>`
		},
		{ 
			label: 'Description', 
			field: 'description',
			render: (value) => value || '—'
		},
		{ 
			label: 'Actions', 
			field: 'address',
			render: (value) => `
				<div class="btn-group btn-group-sm">
					<a href="/addresses/${value}" class="btn btn-outline-primary">
						<i class="fas fa-eye"></i> View
					</a>
					<button class="btn btn-outline-secondary copy-address" data-address="${value}">
						<i class="fas fa-copy"></i>
					</button>
				</div>
			`
		}
	];

	const categories = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'service', label: 'Services' },
		{ value: 'foundation', label: 'Foundation' },
		{ value: 'defi', label: 'DeFi' },
		{ value: 'privacy', label: 'Privacy' },
		{ value: 'mining', label: 'Mining' },
		{ value: 'gaming', label: 'Gaming' },
		{ value: 'token', label: 'Tokens' }
	];

	onMount(() => {
		loadAddresses();
	});

	function loadAddresses() {
		loading = true;
		// Simulate API loading
		setTimeout(() => {
			addresses = knownAddresses;
			loading = false;
			
			// Enhance address cells after render
			setTimeout(() => enhanceAddressCells(), 100);
		}, 500);
	}

	function enhanceAddressCells() {
		const addressCells = document.querySelectorAll('.address-cell');
		addressCells.forEach(cell => {
			const address = cell.dataset.address;
			if (address) {
				cell.innerHTML = `
					<span class="font-monospace">${address.slice(0, 12)}...${address.slice(-12)}</span>
				`;
			}
		});

		// Add copy functionality to copy buttons
		const copyButtons = document.querySelectorAll('.copy-address');
		copyButtons.forEach(button => {
			button.addEventListener('click', () => {
				const address = button.dataset.address;
				copyToClipboard(address);
			});
		});
	}

	async function copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			
			// Show toast notification
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}

	function filterAddresses(addressList, query, category) {
		return addressList.filter(addr => {
			// Category filter
			if (category !== 'all' && addr.category !== category) return false;
			
			// Search filter
			if (query) {
				const searchLower = query.toLowerCase();
				return (
					addr.name.toLowerCase().includes(searchLower) ||
					addr.address.toLowerCase().includes(searchLower) ||
					addr.description?.toLowerCase().includes(searchLower)
				);
			}
			
			return true;
		});
	}

	function getCategoryLabel(category) {
		const cat = categories.find(c => c.value === category);
		return cat ? cat.label : category;
	}

	function handleSearch(event) {
		if (event.key === 'Enter' || event.type === 'click') {
			// Filter will update automatically due to reactive statement
		}
	}

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'all';
	}
</script>

<svelte:head>
	<title>Address Book - Erg Explorer</title>
	<meta name="description" content="Directory of known and verified addresses on the Ergo blockchain including services, DeFi protocols, and notable entities.">
</svelte:head>

<div class="container-fluid">
	<div class="row">
		<div class="col-12">
			<div class="d-flex justify-content-between align-items-center mb-4">
				<h1 class="h3 mb-0">
					<i class="fas fa-address-book me-2 text-primary"></i>
					Address Book
				</h1>
				<div class="text-muted">
					{#if !loading && filteredAddresses.length > 0}
						{filteredAddresses.length} of {addresses.length} addresses
					{/if}
				</div>
			</div>

			<div class="alert alert-info d-flex align-items-center mb-4" role="alert">
				<i class="fas fa-info-circle me-2"></i>
				<div>
					<strong>Address Directory:</strong> A curated list of known addresses on the Ergo blockchain. 
					<span class="badge bg-success ms-2"><i class="fas fa-check-circle"></i> Verified</span> addresses are officially confirmed.
				</div>
			</div>

			<!-- Filters -->
			<div class="card mb-4">
				<div class="card-body">
					<div class="row g-3">
						<div class="col-md-6">
							<label class="form-label">Search addresses</label>
							<div class="input-group">
								<input 
									bind:value={searchQuery}
									onkeydown={handleSearch}
									type="text" 
									class="form-control" 
									placeholder="Search by name, address, or description..."
								>
								<button class="btn btn-outline-primary" type="button" onclick={handleSearch}>
									<i class="fas fa-search"></i>
								</button>
							</div>
						</div>
						<div class="col-md-4">
							<label class="form-label">Category</label>
							<select bind:value={selectedCategory} class="form-select">
								{#each categories as category}
									<option value={category.value}>{category.label}</option>
								{/each}
							</select>
						</div>
						<div class="col-md-2 d-flex align-items-end">
							<button class="btn btn-outline-secondary w-100" onclick={clearFilters}>
								<i class="fas fa-times me-1"></i>
								Clear
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
						data={filteredAddresses} 
						{loading}
						emptyMessage="No addresses found matching your criteria"
						sortable={true}
					/>
				</div>
			</div>

			{#if !loading && addresses.length > 0}
				<div class="mt-4">
					<div class="row text-center">
						<div class="col-md-2">
							<div class="stat-card">
								<div class="stat-value">{formatNumber(addresses.length)}</div>
								<div class="stat-label">Total</div>
							</div>
						</div>
						<div class="col-md-2">
							<div class="stat-card">
								<div class="stat-value">
									{formatNumber(addresses.filter(a => a.verified).length)}
								</div>
								<div class="stat-label">Verified</div>
							</div>
						</div>
						{#each categories.slice(1) as category}
							<div class="col-md-2">
								<div class="stat-card">
									<div class="stat-value">
										{formatNumber(addresses.filter(a => a.category === category.value).length)}
									</div>
									<div class="stat-label">{category.label}</div>
								</div>
							</div>
						{/each}
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

	.alert-info {
		background-color: rgba(var(--bs-info-rgb), 0.1);
		border-color: rgba(var(--bs-info-rgb), 0.2);
		color: var(--bs-info-text-emphasis);
	}

	.stat-card {
		padding: 1rem;
		background: rgba(var(--bs-primary-rgb), 0.05);
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.stat-value {
		font-size: 1.25rem;
		font-weight: bold;
		color: var(--main-color);
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.8rem;
		color: var(--bs-secondary-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge {
		font-size: 0.75rem;
	}

	.bg-success {
		background-color: #28a745 !important;
	}

	.bg-primary {
		background-color: var(--main-color) !important;
	}

	:global(.btn-group-sm > .btn) {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}
</style>