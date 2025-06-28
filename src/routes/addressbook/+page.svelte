<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { formatNumber, formatAddress } from '$lib/utils/formatting.js';
	import { getApiHost } from '$lib/utils/api.js';
	import { isTestnet } from '$lib/stores/network.svelte.js';

	let addresses = [];
	let tokens = [];
	let loading = true;
	let error = null;
	let addressType = 'all';
	let orderBy = 'nameAsc';
	let totalPages = 1;
	let totalItems = 0;

	const ITEMS_PER_PAGE = 20;

	// Get pagination params from URL
	$: limit = parseInt($page.url.searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
	$: offset = parseInt($page.url.searchParams.get('offset') || '0', 10);
	$: currentPage = Math.floor(offset / limit) + 1;

	// Get filter params from URL
	$: {
		const urlType = $page.url.searchParams.get('type');
		const urlOrder = $page.url.searchParams.get('order');
		if (urlType) addressType = urlType;
		if (urlOrder) orderBy = urlOrder;
	}

	// Watch for URL parameter changes and reload data
	$: if ($page.url.pathname === '/addressbook') {
		loadAddresses();
	}

	// Group addresses by name
	$: groupedAddresses = groupAddressesByName(addresses);

	const addressTypes = [
		{ value: 'all', label: 'All' },
		{ value: 'exchange', label: 'Exchange' },
		{ value: 'service', label: 'Service' },
		{ value: 'mining-pool', label: 'Mining Pool' },
		{ value: 'nft-artist', label: 'NFT Artist' }
	];

	const orderOptions = [
		{ value: 'nameAsc', label: 'Alphabetical: A to Z' },
		{ value: 'nameDesc', label: 'Alphabetical: Z to A' }
	];

	onMount(() => {
		loadAddresses();
	});

	async function loadAddresses() {
		try {
			loading = true;
			error = null;

			const apiUrl = `${getApiHost()}addressbook/getAddresses?offset=${offset}&limit=${limit}&type=${addressType}&order=${orderBy}&testnet=${isTestnet() ? '1' : '0'}`;
			
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch addresses: ${response.statusText}`);
			}

			const data = await response.json();
			addresses = data.items || [];
			tokens = data.tokens || [];
			totalItems = data.total || 0;
			totalPages = Math.ceil(totalItems / limit);

			// Debug: log the actual data to see what types we have
			console.log('API Response:', data);
			console.log('First few addresses:', addresses.slice(0, 3));
			if (addresses.length > 0) {
				console.log('Available types:', [...new Set(addresses.map(addr => addr.type))]);
			}

		} catch (err) {
			error = err.message;
			console.error('Failed to load addressbook:', err);
		} finally {
			loading = false;
		}
	}

	function groupAddressesByName(addressList) {
		const groups = {};
		
		addressList.forEach(item => {
			if (!groups[item.name]) {
				groups[item.name] = {
					name: item.name,
					type: item.type,
					url: item.url,
					addresses: []
				};
			}
			groups[item.name].addresses.push(item);
		});
		
		return Object.values(groups);
	}

	function getTokenForName(name) {
		return tokens.find(token => token.addressname === name);
	}

	function getTypeClass(type) {
		switch(type.toLowerCase()) {
			case 'exchange': return 'badge-info';
			case 'service': return 'badge-primary';
			case 'mining pool': return 'badge-warning';
			case 'nft artist': return 'badge-success';
			default: return 'badge-secondary';
		}
	}

	function getAddressTypeClass(urltype) {
		if (!urltype) return '';
		
		const type = urltype.toLowerCase();
		if (type.includes('hot')) return 'hot';
		if (type.includes('cold')) return 'cold';
		if (type.includes('wallet')) return 'wallet';
		if (type.includes('exchange')) return 'exchange';
		return '';
	}

	function getBadgeColor(type) {
		console.log('Badge type:', type); // Debug log
		if (!type) return '#6c757d';
		
		const normalizedType = type.toLowerCase().trim().replace(/\s+/g, '-');
		console.log('Normalized type:', normalizedType); // Debug log
		
		let color = '#6c757d'; // default gray
		
		// More flexible matching
		if (normalizedType.includes('exchange')) color = '#17a2b8';
		else if (normalizedType.includes('service')) color = '#ff851b';
		else if (normalizedType.includes('mining')) color = '#ffc107';
		else if (normalizedType.includes('nft') || normalizedType.includes('artist')) color = '#28a745';
		
		console.log('Returning color:', color, 'for type:', type); // Debug log
		return color;
	}

	function getBadgeTextColor(type) {
		if (!type) return 'white';
		const normalizedType = type.toLowerCase().trim();
		
		// Yellow background needs black text for readability
		if (normalizedType.includes('mining')) return '#000';
		return 'white';
	}

	async function handleFilterChange() {
		const url = new URL($page.url);
		
		if (addressType === 'all') {
			url.searchParams.delete('type');
		} else {
			url.searchParams.set('type', addressType);
		}
		
		if (orderBy === 'nameAsc') {
			url.searchParams.delete('order');
		} else {
			url.searchParams.set('order', orderBy);
		}
		
		url.searchParams.delete('offset');
		await goto(url.pathname + url.search, { replaceState: false });
	}

	async function handlePageChange(event) {
		const newPage = event.detail.page;
		const newOffset = (newPage - 1) * limit;
		const url = new URL($page.url);
		
		if (newOffset === 0) {
			url.searchParams.delete('offset');
		} else {
			url.searchParams.set('offset', newOffset.toString());
		}
		
		await goto(url.pathname + url.search, { replaceState: false });
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// Generate info text for page header
	function getInfoText() {
		if (loading || !groupedAddresses.length) return '';
		const start = offset + 1;
		const end = Math.min(offset + limit, totalItems);
		return `Showing ${start}-${end} of ${formatNumber(totalItems)} entries`;
	}
</script>

<svelte:head>
	<title>Address Book - Erg Explorer</title>
	<meta name="description" content="Directory of known addresses on the Ergo blockchain">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="Address Book" 
				icon="fa-address-book" 
				info={getInfoText()}
			/>

			<div class="container-fluid p-0">
				<!-- Filters -->
				<div class="row mb-4 p-0">
					<div class="col-md-6 ps-3 ps-md-0 pe-3 pe-md-unset">
						<label class="form-label" for="orderBy">Order:</label>
						<select bind:value={orderBy} class="form-select" id="orderBy" onchange={handleFilterChange}>
							{#each orderOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<div class="col-md-6 ps-3 ps-md-0 pe-3 pe-md-0 mt-2 md-md-0">
						<label class="form-label" for="addressType">Filter:</label>
						<select bind:value={addressType} class="form-select" id="addressType" onchange={handleFilterChange}>
							{#each addressTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>
				</div>

			{#if loading}
				<Loading text="Loading address book..." />
			{:else if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{:else if groupedAddresses.length === 0}
				<div class="div-cell-dark">
					There are no entries in the address book.
				</div>
			{:else}
				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="mb-1">
						<Pagination 
							{currentPage} 
							{totalPages}
							on:pageChange={handlePageChange}
						/>
					</div>
				{/if}

				<!-- Address Groups -->
				<div class="row w-100">
					{#each groupedAddresses as group}
						<div class="col-12 mb-4 p-0 glass-card-holder">
							<div class="glass-card">
								<div class="card-header">
									<h2 class="section-title">{group.name}</h2>
									<span class="badge {getTypeClass(group.type)}">{group.type}</span>
								</div>
								<div class="card-content">
									{#if group.url}
										<div class="contact-item">
											<span class="contact-label">Website:</span>
											<a href="{group.url}" target="_blank" rel="noopener" class="contact-link">
												{group.url}
												<i class="fas fa-external-link-alt ms-1"></i>
											</a>
										</div>
									{/if}
									
									<div class="addresses-section">
										<h6 class="addresses-label">
											<i class="fas fa-wallet me-2"></i>
											Address{group.addresses.length > 1 ? 'es' : ''}
										</h6>
										<div class="addresses-list">
											{#each group.addresses as address, index}
												<div class="address-item" class:mb-0={index === group.addresses.length - 1}>
													<div class="address-row">
														<div class="address-content">
															{#if address.urltype}
																<span class="address-type {getAddressTypeClass(address.urltype)}">{address.urltype}</span>
															{/if}
															<a 
																href="/addresses/{address.address}" 
																class="address-link"
																data-address={address.address}
															>
																<span class="d-none d-md-inline">{formatAddress(address.address, 32, 6)}</span>
																<span class="d-md-none">{formatAddress(address.address, 15, 4)}</span>
															</a>
														</div>
														<CopyButton 
															text={address.address} 
															label="Copy address" 
															successMessage="Address copied to clipboard!"
														/>
													</div>
												</div>
											{/each}
										</div>
									</div>

									{#if getTokenForName(group.name)}
										{@const token = getTokenForName(group.name)}
										<div class="contact-item mb-0">
											<span class="contact-label">Token:</span>
											<a 
												href="/tokens/{token.id}" 
												data-token-id={token.id}
												data-token-name={token.name || ''}
												class="contact-link token-link"
												title="Click to view token details"
											>
												{token.id}
											</a>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Bottom Pagination -->
				{#if totalPages > 1}
					<div class="mt-2">
						<Pagination 
							{currentPage} 
							{totalPages}
							on:pageChange={handlePageChange}
						/>
					</div>
				{/if}
			{/if}
			</div>
		</div>
	</div>
</div>

<div class="page-bottom-margin"></div>

<style>
	.glass-card-holder:last-child {
		margin-bottom: 0 !important;
	}

	.addresses-section {
		margin: 1.5rem 0;
	}

	.addresses-label {
		color: var(--text-strong);
		font-weight: 600;
		font-size: 1rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
	}

	.addresses-label i {
		color: var(--main-color);
	}

	.addresses-list {
		background: var(--glass-bg-subtle);
		border: 1px solid var(--glass-border-light);
		border-radius: 8px;
		overflow: hidden;
	}

	.address-item {
		border-bottom: 1px solid var(--glass-border-light);
		transition: background-color 0.2s ease;
	}

	.address-item:hover {
		background: var(--glass-bg-light);
	}

	.address-item.mb-0 {
		border-bottom: none;
	}

	.address-row {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		gap: 1rem;
	}

	.address-content {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.address-type {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		min-width: fit-content;
		background-color: var(--main-color);
		color: white;
	}

	/* Color coding for address types */
	.address-type.hot {
		background-color: #dc3545;
		color: white;
	}

	.address-type.cold {
		background-color: #17a2b8;
		color: white;
	}

	.address-type.wallet {
		background-color: #28a745;
		color: white;
	}

	.address-type.exchange {
		background-color: #ffc107;
		color: #000;
	}

	.address-link {
		font-family: monospace;
		font-size: 0.95rem;
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 500;
		flex: 1;
		transition: color 0.3s ease;
	}

	.address-link:hover {
		color: var(--main-color);
	}

	@media (max-width: 768px) {
		.address-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.address-link {
			word-break: break-all;
		}

		.address-type {
			align-self: flex-start;
		}
	}
</style>