<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { getBlocks } from '$lib/utils/api.js';
	import { getLatestBlocksHeaders } from '$lib/config/tableConfigs.js';

	let blocks = [];
	let loading = true;
	let error = null;
	let totalPages = 1;
	let totalItems = 0;
	
	const DEFAULT_LIMIT = 20;

	// Get pagination params from URL
	$: limit = parseInt($page.url.searchParams.get('limit') || DEFAULT_LIMIT.toString(), 10);
	$: offset = parseInt($page.url.searchParams.get('offset') || '0', 10);
	$: currentPage = Math.floor(offset / limit) + 1;

	// Watch for URL parameter changes and reload data
	$: if ($page.url.pathname === '/latest-blocks') {
		loadBlocks();
	}

	onMount(async () => {
		await loadBlocks();
	});

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
			totalItems = data.total || 0;
			totalPages = Math.ceil(totalItems / limit);
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

	// Generate info text for page header
	function getInfoText() {
		if (loading || !blocks.length) return '';
		const start = offset + 1;
		const end = Math.min(offset + limit, offset + blocks.length);
		return `Showing ${start} - ${end}${totalItems ? ` of ${totalItems}` : ''} blocks`;
	}

</script>

<svelte:head>
	<title>Latest Blocks - Erg Explorer</title>
	<meta name="description" content="View the latest blocks mined on the Ergo blockchain with details about transactions, miners, and rewards.">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="Latest Blocks" 
				icon="fa-cubes" 
				info={getInfoText()}
			/>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<DataTable 
				headers={getLatestBlocksHeaders()}
				data={blocks} 
				{loading}
				emptyMessage="No blocks found"
			/>

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

