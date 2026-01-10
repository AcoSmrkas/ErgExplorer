<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import TokenFilters from '$lib/components/tokens/TokenFilters.svelte';
	import TokenList from '$lib/components/tokens/TokenList.svelte';
	import { formatNumber, formatDateString } from '$lib/utils/formatting.js';
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

	onMount(() => {
		loadTokens();
	});

	async function loadTokens() {
		try {
			loading = true;
			error = null;

			let apiUrl;
			if (isTestnet()) {
				apiUrl = `${getApiHost(2)}tokens?limit=${limit}&offset=${offset}`;
			} else {
				const queryParam = query ? `&query=${encodeURIComponent(query)}` : '';
				apiUrl = `${getApiHost(2)}tokens/search?limit=${limit}&offset=${offset}&type=${tokenType}&order=${orderBy}&hideUtility=${hideUtility}&hideBurned=${hideBurned}${queryParam}`;
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
				<TokenFilters 
					bind:query
					bind:tokenType
					bind:orderBy
					bind:hideUtility
					bind:hideBurned
					onFilterChange={handleFilterChange}
				/>

				{#if error}
					<ErrorMessage message={error} type="danger" dismissible />
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

					<TokenList 
						tokens={tokensWithDetails}
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