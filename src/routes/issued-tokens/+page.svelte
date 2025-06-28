<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import { formatNumber, formatDateString, formatTokenAmount, formatAddress } from '$lib/utils/formatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { getApiHost, getBlock, getTransaction } from '$lib/utils/api.js';
	import { getCachedTokens } from '$lib/stores/tokenCache.js';
	import { isTestnet } from '$lib/stores/network.svelte.js';

	let tokens = [];
	let tokensWithDetails = [];
	let loading = true;
	let loadingDetails = false;
	let error = null;
	let totalPages = 1;
	let totalItems = 0;
	let query = '';
	let tokenType = 'all';
	let orderBy = 'recent';
	let hideUtility = false;
	let hideBurned = false;

	const ITEMS_PER_PAGE = 20;

	// Get params from URL
	$: limit = parseInt($page.url.searchParams.get('limit') || ITEMS_PER_PAGE.toString(), 10);
	$: offset = parseInt($page.url.searchParams.get('offset') || '0', 10);
	$: currentPage = Math.floor(offset / limit) + 1;

	// Get filter params from URL
	$: {
		const urlQuery = $page.url.searchParams.get('query');
		const urlType = $page.url.searchParams.get('type');
		const urlOrder = $page.url.searchParams.get('order');
		const urlHideUtility = $page.url.searchParams.get('hideUtility');
		const urlHideBurned = $page.url.searchParams.get('hideBurned');
		
		if (urlQuery) query = urlQuery;
		if (urlType) tokenType = urlType;
		if (urlOrder) orderBy = urlOrder;
		if (urlHideUtility === 'true') hideUtility = true;
		if (urlHideBurned === 'true') hideBurned = true;
	}

	// Watch for URL parameter changes and reload data
	$: if ($page.url.pathname === '/issued-tokens') {
		loadTokens();
	}

	const tokenTypes = [
		{ value: 'all', label: 'All' },
		{ value: 'token', label: 'Token' },
		{ value: 'nft', label: 'NFT' },
		{ value: 'image', label: 'Image' },
		{ value: 'audio', label: 'Audio' },
		{ value: 'video', label: 'Video' },
		{ value: 'artcollection', label: 'Art Collection' },
		{ value: 'file', label: 'File' },
		{ value: 'membership', label: 'Membership' }
	];

	const orderOptions = [
		{ value: 'recent', label: 'Recently Issued' },
		{ value: 'nameAsc', label: 'Alphabetical: A to Z' },
		{ value: 'nameDesc', label: 'Alphabetical: Z to A' }
	];

	// DataTable headers
	const headers = [
		{ 
			label: 'Token', 
			field: 'name',
			render: (value, token) => renderTokenCell(token)
		},
		{ 
			label: 'Type', 
			field: 'type',
			render: (value, token) => renderTypeCell(token)
		},
		{ 
			label: 'Supply', 
			field: 'emissionAmount',
			render: (value, token) => formatTokenAmount(token.emissionAmount, token.decimals)
		},
		{ 
			label: 'Description', 
			field: 'description',
			render: (value, token) => formatDescription(token.detailedDescription || token.description)
		},
		{ 
			label: 'Date', 
			field: 'mintDate',
			render: (value, token) => token.mintDate || ''
		}
	];

	onMount(() => {
		loadTokens();
	});

	async function loadTokens() {
		try {
			loading = true;
			error = null;

			let apiUrl;
			if (isTestnet()) {
				apiUrl = `${getApiHost()}tokens?limit=${limit}&offset=${offset}`;
			} else {
				const queryParam = query ? `&query=${encodeURIComponent(query)}` : '';
				apiUrl = `${getApiHost()}tokens/search?limit=${limit}&offset=${offset}&type=${tokenType}&order=${orderBy}&hideUtility=${hideUtility}&hideBurned=${hideBurned}${queryParam}`;
			}
			
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch tokens: ${response.statusText}`);
			}

			const data = await response.json();
			tokens = data.items || [];
			totalItems = data.total || 0;
			totalPages = Math.ceil(totalItems / limit);

			// Fetch detailed token data for each token
			await loadTokenDetails(tokens);

			// Show data immediately and load dates in background
			loadTokenDates(tokensWithDetails);

		} catch (err) {
			error = err.message;
			console.error('Failed to load tokens:', err);
		} finally {
			loading = false;
		}
	}

	async function loadTokenDetails(tokenList) {
		if (!tokenList.length) {
			tokensWithDetails = [];
			return;
		}

		try {
			loadingDetails = true;
			
			// Extract token IDs
			const tokenIds = tokenList.map(token => token.id);
			
			// Fetch detailed data using cached token system
			const detailedTokens = await getCachedTokens(tokenIds);
			
			// Merge basic token data with detailed data
			tokensWithDetails = tokenList.map(token => {
				const detail = detailedTokens.find(d => d.id === token.id);
				return {
					...token,
					detail: detail,
					cachedurl: detail?.cachedurl,
					iconurl: detail?.iconurl,
					detailedDescription: detail?.description,
					ticker: detail?.ticker,
					scam: detail?.scam
				};
			});
		} catch (err) {
			console.error('Failed to load token details:', err);
			tokensWithDetails = tokenList.map(token => ({ ...token, detail: null }));
		} finally {
			loadingDetails = false;
		}
	}

	async function loadTokenDates(tokenList) {
		if (!tokenList.length) return;

		// Initialize all tokens with empty date (no loading state to avoid delay)
		tokensWithDetails = tokenList.map(token => ({
			...token,
			mintDate: ''
		}));

		// Load dates for each token with fallback strategies
		const datePromises = tokenList.map(async (token, index) => {
			try {
				let timestamp = null;

				// Strategy 1: Try transaction API if transactionId exists and is not empty
				if (token.transactionId && token.transactionId.trim() !== '') {
					try {
						const txData = await getTransaction(token.transactionId);
						if (txData?.timestamp) {
							timestamp = txData.timestamp;
						}
					} catch (err) {
						console.warn(`Failed to fetch transaction ${token.transactionId}:`, err);
					}
				}

				// Strategy 2: Try block API by blockId if still no timestamp
				if (!timestamp && token.blockId && token.blockId.trim() !== '') {
					try {
						const blockData = await getBlock(token.blockId);
						if (blockData?.block?.header?.timestamp) {
							timestamp = blockData.block.header.timestamp;
						} else if (blockData?.header?.timestamp) {
							timestamp = blockData.header.timestamp;
						} else if (blockData?.timestamp) {
							timestamp = blockData.timestamp;
						}
					} catch (err) {
						console.warn(`Failed to fetch block by id ${token.blockId}:`, err);
					}
				}

				// Update the token with the date
				if (timestamp) {
					const formattedDate = formatDateString(timestamp);
					tokensWithDetails[index] = {
						...tokensWithDetails[index],
						mintDate: formattedDate
					};
				} else {
					tokensWithDetails[index] = {
						...tokensWithDetails[index],
						mintDate: 'N/A'
					};
				}

			} catch (err) {
				console.error(`Failed to load date for token ${token.id}:`, err);
				tokensWithDetails[index] = {
					...tokensWithDetails[index],
					mintDate: 'Error'
				};
			}
		});

		// Wait for a few tokens to load, then update UI progressively
		await Promise.allSettled(datePromises.slice(0, 3));
		tokensWithDetails = [...tokensWithDetails];

		// Continue loading the rest in background
		await Promise.allSettled(datePromises);
		tokensWithDetails = [...tokensWithDetails];
	}

	// Parse NFT type from R7 register serialized value
	function parseNftTypeFromR7(r7Value) {
		if (!r7Value || typeof r7Value !== 'string') return null;
		
		// R7 values are hex encoded, we need to check the pattern
		// NFT types have specific patterns in R7 register
		const r7Lower = r7Value.toLowerCase();
		
		// EIP-0004 standard NFT type mappings
		if (r7Lower === '0e020101') return 'image';        // [0x01, 0x01] - Image NFT
		if (r7Lower === '0e020102') return 'audio';        // [0x01, 0x02] - Audio NFT  
		if (r7Lower === '0e020103') return 'video';        // [0x01, 0x03] - Video NFT
		if (r7Lower === '0e020104') return 'artcollection'; // [0x01, 0x04] - Art Collection
		if (r7Lower === '0e02010f') return 'file';         // [0x01, 0x0F] - File Attachment
		if (r7Lower === '0e020201') return 'membership';   // [0x02, 0x01] - Membership token
		
		// Check if it starts with NFT pattern (0e0201)
		if (r7Lower.startsWith('0e0201')) return 'nft';
		
		// Some tokens might have different encoding - let's try to decode hex values
		// The value "550000" from your example might be a different encoding
		try {
			// Convert to hex if it's a decimal number
			if (/^\d+$/.test(r7Value)) {
				const hexValue = parseInt(r7Value).toString(16).padStart(8, '0');
				
				// Check common NFT patterns in different formats
				if (hexValue.includes('0101')) return 'image';
				if (hexValue.includes('0102')) return 'audio';
				if (hexValue.includes('0103')) return 'video';
				if (hexValue.includes('0104')) return 'artcollection';
			}
		} catch (err) {
			console.warn('Error parsing R7 value:', err);
		}
		
		return null;
	}

	// Get the actual token type considering R7 register data
	function getActualTokenType(token) {
		// First check if token is burned
		if (token.isBurned === 't') return 'burned';
		
		// Try to get type from R7 register if detailed token data is available
		const r7Value = token.detail?.additionalRegisters?.R7?.serializedValue;
		if (r7Value) {
			const r7Type = parseNftTypeFromR7(r7Value);
			if (r7Type) return r7Type;
		}
		
		// Fallback to the original type field from search API
		if (token.type) return token.type;
		
		// Final fallback based on token characteristics
		return token.decimals === 0 && token.emissionAmount === '1' ? 'nft' : 'token';
	}

	function getTokenTypeIcon(token) {
		const actualType = getActualTokenType(token);
		
		switch (actualType) {
			case 'burned': return 'fas fa-fire text-danger';
			case 'image': return 'fas fa-image text-warning';
			case 'audio': return 'fas fa-music text-warning';
			case 'video': return 'fas fa-video text-warning';
			case 'artcollection': return 'fas fa-palette text-warning';
			case 'file': return 'fas fa-file text-warning';
			case 'membership': return 'fas fa-id-card text-warning';
			case 'nft': return 'fas fa-gem text-warning';
			default: return 'fas fa-coins text-info'; // regular token
		}
	}

	function getTokenTypeLabel(token) {
		const actualType = getActualTokenType(token);
		
		switch (actualType) {
			case 'burned': return 'Burned';
			case 'image': return 'Image NFT';
			case 'audio': return 'Audio NFT';
			case 'video': return 'Video NFT';
			case 'artcollection': return 'Art Collection';
			case 'file': return 'File NFT';
			case 'membership': return 'Membership';
			case 'nft': return 'NFT';
			default: return 'Token';
		}
	}

	function formatDescription(description) {
		if (!description) return '';
		return description.length > 100 ? description.substring(0, 100) + '...' : description;
	}

	function renderTokenCell(token) {
		const imageHtml = token.cachedurl 
			? `<img src="${token.cachedurl}" alt="${token.name || 'NFT'}" class="token-nft-image me-2" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" onerror="this.style.display='none'"/>` 
			: (token.iconurl && !token.cachedurl)
				? `<img src="${token.iconurl}" alt="${token.name || 'Token'}" class="token-icon-image me-2" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'"/>` 
				: '';
		
		const assetTitle = getAssetTitleParams(token.detail, token.id, token.name, true);
		const tokenId = `<div class="token-id" style="font-family: monospace; font-size: 0.75rem; color: var(--text-light); margin-top: 0.25rem;">${formatAddress(token.id, 15, 4)}</div>`;
		const ticker = token.ticker && token.ticker !== token.name 
			? `<div class="token-ticker" style="font-family: monospace; font-size: 0.75rem; color: var(--main-color); font-weight: 600; margin-top: 0.1rem;">(${token.ticker})</div>` 
			: '';
		
		return `<div class="d-flex align-items-center"><div class="me-2">${imageHtml}</div><div>${assetTitle}${tokenId}${ticker}</div></div>`;
	}

	function renderTypeCell(token) {
		const icon = getTokenTypeIcon(token);
		const label = getTokenTypeLabel(token);
		const scamWarning = token.scam ? '<i class="fas fa-exclamation-triangle text-danger ms-1" title="Reported as suspicious"></i>' : '';
		
		return `<span class="d-flex align-items-center gap-2"><i class="${icon}"></i>${label}${scamWarning}</span>`;
	}

	async function handleFilterChange() {
		const url = new URL($page.url);
		
		if (query) {
			url.searchParams.set('query', query);
		} else {
			url.searchParams.delete('query');
		}
		
		if (tokenType !== 'all') {
			url.searchParams.set('type', tokenType);
		} else {
			url.searchParams.delete('type');
		}
		
		if (orderBy !== 'recent') {
			url.searchParams.set('order', orderBy);
		} else {
			url.searchParams.delete('order');
		}
		
		if (hideUtility) {
			url.searchParams.set('hideUtility', 'true');
		} else {
			url.searchParams.delete('hideUtility');
		}
		
		if (hideBurned) {
			url.searchParams.set('hideBurned', 'true');
		} else {
			url.searchParams.delete('hideBurned');
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

	function handleSearch(event) {
		if (event.key === 'Enter') {
			handleFilterChange();
		}
	}

	// Generate info text for page header
	function getInfoText() {
		if (loading || !tokens.length) return '';
		const start = offset + 1;
		const end = Math.min(offset + limit, totalItems);
		return `Showing ${start}-${end} of ${formatNumber(totalItems)} tokens`;
	}

</script>

<svelte:head>
	<title>Issued Tokens - Erg Explorer</title>
	<meta name="description" content="Browse all tokens and NFTs issued on the Ergo blockchain">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="Issued Tokens" 
				icon="fa-coins" 
				info={getInfoText()}
			/>

			<div class="container-fluid p-0">
				<!-- Filters -->
				<div class="row mb-4 p-0">
					<div class="col-md-4 ps-0">
						<label class="form-label" for="query">Search:</label>
						<div class="input-group">
							<input 
								bind:value={query}
								on:keydown={handleSearch}
								type="text" 
								class="form-control" 
								id="query"
								placeholder="Search tokens..."
							>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button class="btn btn-primary" type="button" on:click={handleFilterChange}>
								<i class="fas fa-search"></i>
							</button>
						</div>
					</div>
					<div class="col-md-2">
						<label class="form-label" for="tokenType">Filter:</label>
						<select bind:value={tokenType} class="form-select" id="tokenType" on:change={handleFilterChange}>
							{#each tokenTypes as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</div>
					<div class="col-md-2">
						<label class="form-label" for="orderBy">Order:</label>
						<select bind:value={orderBy} class="form-select" id="orderBy" on:change={handleFilterChange}>
							{#each orderOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					{#if !isTestnet()}
						<div class="col-md-4 pe-0">
							<label class="form-label">Options:</label>
							<div class="d-flex gap-3 mt-1">
								<div class="form-check">
									<input 
										bind:checked={hideUtility}
										on:change={handleFilterChange}
										class="form-check-input" 
										type="checkbox" 
										id="hideUtility"
									>
									<label class="form-check-label" for="hideUtility">
										Hide utility
									</label>
								</div>
								<div class="form-check">
									<input 
										bind:checked={hideBurned}
										on:change={handleFilterChange}
										class="form-check-input" 
										type="checkbox" 
										id="hideBurned"
									>
									<label class="form-check-label" for="hideBurned">
										Hide burned
									</label>
								</div>
							</div>
						</div>
					{/if}
				</div>

				{#if loading}
					<Loading text="Loading issued tokens..." />
				{:else if error}
					<ErrorMessage message={error} type="danger" dismissible />
				{:else if tokens.length === 0}
					<div class="div-cell-dark">
						No tokens found matching your criteria.
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

					<!-- Tokens DataTable -->
					<DataTable 
						{headers} 
						data={tokensWithDetails} 
						loading={loading || loadingDetails}
						emptyMessage="No tokens found matching your criteria"
					/>

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
	/* Form styling */
	.form-check-input:checked {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	/* Date column width adjustment */
	:global(.glass-table th:last-child),
	:global(.glass-table td:last-child) {
		min-width: 120px;
		white-space: nowrap;
	}

	/* Type column width adjustment (second column) */
	:global(.glass-table th:nth-child(2)),
	:global(.glass-table td:nth-child(2)) {
		min-width: 140px;
		white-space: nowrap;
	}
</style>