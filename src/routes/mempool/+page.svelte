<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import MempoolControls from '$lib/components/mempool/MempoolControls.svelte';
	import MempoolList from '$lib/components/mempool/MempoolList.svelte';
	import { getMempool } from '$lib/utils/api.js';
	import { createPaginationHandler } from '$lib/utils/usePagination.js';
	import { FEE_ERGOTREE, ERG_DECIMALS } from '$lib/utils/constants.js';
	import { formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { socketService } from '$lib/services/socketService.js';

	let transactions = [];
	let groupedTransactions = [];
	let loading = true;
	let error = null;
	let totalPages = 1;
	let totalItems = 0;
	let useRealTime = true;
	let refreshInterval;
	let isSocketConnected = false;
	let showConflicts = false;
	let showInfoCard = true;
	let lastUpdate = null;

	// Load dismissed state from localStorage
	if (browser) {
		const dismissed = localStorage.getItem('mempool-info-dismissed');
		showInfoCard = dismissed !== 'true';
	}

	function dismissInfoCard() {
		showInfoCard = false;
		if (browser) {
			localStorage.setItem('mempool-info-dismissed', 'true');
		}
	}
	
	const DEFAULT_LIMIT = 50;
	const FALLBACK_REFRESH_INTERVAL = 10000; // 10 seconds
	const SOCKET_WAIT_TIME = 3000; // Wait 3 seconds for socket connection before fallback

	// Socket store unsubscribe functions
	let unsubscribeConnection;
	let unsubscribeMempool;
	let unsubscribeLastUpdate;

	// Use pagination utility
	$: pagination = createPaginationHandler($page, loadTransactions, DEFAULT_LIMIT);
	$: ({ limit, offset, currentPage } = pagination);

	// Function to detect and group conflicting transactions
	function groupConflictingTransactions(txs) {
		const boxToTxMap = new Map();
		const conflicts = new Map();

		// Build map of boxId to transactions that try to spend it
		txs.forEach(tx => {
			tx.inputs?.forEach(input => {
				if (!boxToTxMap.has(input.boxId)) {
					boxToTxMap.set(input.boxId, []);
				}
				boxToTxMap.get(input.boxId).push(tx);
			});
		});

		// Find conflicts (same box spent by multiple transactions)
		let conflictGroupId = 1;
		for (const [boxId, spendingTxs] of boxToTxMap) {
			if (spendingTxs.length > 1) {
				// Multiple transactions trying to spend same box - assign same group ID
				spendingTxs.forEach(tx => {
					if (!conflicts.has(tx.id)) {
						conflicts.set(tx.id, { 
							groupId: conflictGroupId, 
							conflictingBoxes: [],
							conflictCount: spendingTxs.length
						});
					}
					conflicts.get(tx.id).conflictingBoxes.push(boxId);
				});
				conflictGroupId++;
			}
		}

		// Add conflict information to transactions
		return txs.map(tx => ({
			...tx,
			conflictGroup: conflicts.has(tx.id) ? conflicts.get(tx.id).groupId : null,
			conflictingBoxes: conflicts.has(tx.id) ? conflicts.get(tx.id).conflictingBoxes : [],
			conflictCount: conflicts.has(tx.id) ? conflicts.get(tx.id).conflictCount : 0
		}));
	}

	// Helper function to calculate fee for a transaction
	function calculateFee(tx) {
		const feeOutput = tx.outputs?.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}

	// Reactive statement to group transactions
	$: groupedTransactions = groupConflictingTransactions(transactions);
	$: displayTransactions = showConflicts ? 
		groupedTransactions.filter(tx => tx.conflictGroup).sort((a, b) => {
			// First sort by conflict group
			if (a.conflictGroup !== b.conflictGroup) {
				return a.conflictGroup - b.conflictGroup;
			}
			// Then by fee (highest first)
			return calculateFee(b) - calculateFee(a);
		}) : 
		groupedTransactions;

	const headers = [
		{ 
			label: 'Transaction ID', 
			field: 'id', 
			render: (value, row) => {
				const conflictBadge = row.conflictGroup ? 
					`<span class="conflict-badge" title="Competing with ${row.conflictCount - 1} other transaction(s) for the same UTXO. Only one will succeed.">
						Double-spend #${row.conflictGroup}
					</span>` : '';
				return `<a href="/transactions/${value}" class="height-link">${formatAddress(value, 15, 4)}</a> ${conflictBadge}`;
			}
		},
		{ 
			label: 'Fee', 
			field: null, 
			render: (value, row) => {
				// Find fee output by checking for fee ergotree
				const feeOutput = row.outputs?.find(output => output.ergoTree === FEE_ERGOTREE);
				
				const fee = feeOutput ? parseInt(feeOutput.value) : 0;
				return fee > 0 ? `${formatErgValue(fee, ERG_DECIMALS)} <small class="text-muted">${formatPriceUSD(fee, 9, $ergPrice.value)}</small>` : 'N/A';
			}
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
			label: 'ERG Transferred', 
			field: 'outputs', 
			render: (value) => {
				const totalValue = value?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
				return `${formatErgValue(totalValue)} <small class="text-muted">${formatPriceUSD(totalValue, 9, $ergPrice.value)}</small>`;
			}
		},
		{ 
			label: 'Size', 
			field: 'size', 
			render: (value) => formatFileSize(value) 
		}
	];

	onMount(async () => {
		if (browser) {
			// Subscribe to socket stores
			unsubscribeConnection = socketService.getConnectionStatus().subscribe(status => {
				isSocketConnected = status;
			});

			unsubscribeMempool = socketService.getMempoolTransactions().subscribe(socketTransactions => {
				if (useRealTime && currentPage === 1 && socketTransactions.length > 0) {
					transactions = socketTransactions.slice(0, limit);
					loading = false;
					error = null;
				}
			});

			unsubscribeLastUpdate = socketService.getLastUpdate().subscribe(timestamp => {
				lastUpdate = timestamp;
			});

			// Wait for socket connection before falling back to API
			setTimeout(async () => {
				if (!isSocketConnected || !useRealTime || currentPage !== 1) {
					await loadTransactions();
					
					// Start fallback polling if not using real-time or not on first page
					if (!useRealTime || currentPage !== 1) {
						startFallbackPolling();
					}
				} else {
					// Socket is connected, but if no data comes in after another second, load via API
					setTimeout(async () => {
						if (loading) {
							await loadTransactions();
						}
					}, 1000);
				}
			}, SOCKET_WAIT_TIME);
		}
		
		return () => {
			cleanup();
		};
	});

	onDestroy(() => {
		cleanup();
	});

	function cleanup() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		if (unsubscribeConnection) unsubscribeConnection();
		if (unsubscribeMempool) unsubscribeMempool();
		if (unsubscribeLastUpdate) unsubscribeLastUpdate();
	}
	
	// Watch for URL parameter changes and reload data
	$: if ($page.url.pathname === '/mempool') {
		loadTransactions();
	}


	async function loadTransactions() {
		try {
			loading = true;
			error = null;
			
			const data = await getMempool({
				limit,
				offset
			});
			
			transactions = data.items || [];
			totalItems = data.total || 0;
			totalPages = Math.ceil(totalItems / limit);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load mempool:', err);
		} finally {
			loading = false;
		}
	}

	function startFallbackPolling() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		
		refreshInterval = setInterval(async () => {
			if (!loading) {
				await loadTransactions();
			}
		}, FALLBACK_REFRESH_INTERVAL);
	}

	function stopFallbackPolling() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
			refreshInterval = null;
		}
	}

	function toggleRealTime() {
		useRealTime = !useRealTime;
		
		if (useRealTime && currentPage === 1) {
			stopFallbackPolling();
			// Force reload from socket data if available
			socketService.getMempoolTransactions().subscribe(socketTransactions => {
				if (socketTransactions.length > 0) {
					transactions = socketTransactions.slice(0, limit);
				}
			})();
		} else {
			startFallbackPolling();
		}
	}

	async function handlePageChange(event) {
		const newPage = event.detail.page;
		
		// Use pagination utility
		await pagination.handlePageChange(event);
		
		// Manage real-time updates based on page
		if (newPage === 1 && useRealTime) {
			stopFallbackPolling();
		} else {
			startFallbackPolling();
		}
	}

	async function handleRefresh() {
		await loadTransactions();
	}
</script>

<svelte:head>
	<title>Mempool - Erg Explorer</title>
	<meta name="description" content="View pending transactions in the Ergo blockchain mempool awaiting confirmation.">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="Mempool Transactions" 
				icon="fa-clock" 
				info={pagination.getInfoText(displayTransactions, totalItems, loading)}
			/>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<MempoolControls 
				{isSocketConnected}
				bind:showConflicts
				{showInfoCard}
				onDismissInfo={dismissInfoCard}
			/>

			<MempoolList 
				transactions={displayTransactions}
				{headers}
				{loading}
				emptyMessage={showConflicts ? "No double-spend transactions found" : "No pending transactions in mempool"}
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

<style>
	.page-bottom-margin {
		height: 2rem;
	}

	/* Column width customization for value column */
	:global(.glass-table th:nth-child(5), .glass-table td:nth-child(5)) {
		width: 200px;
		min-width: 200px;
	}

	/* Prevent line breaks in value column */
	:global(.glass-table td:nth-child(5)) {
		white-space: nowrap;
	}

	/* Link styling */
	:global(.height-link) {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.3s ease;
	}

	:global(.height-link:hover) {
		color: var(--main-color);
	}

	:global(.conflict-badge) {
		background: #dc3545;
		color: white;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.5rem;
		display: inline-block;
	}

	:global(.fa-spin) {
		animation: spin 1s infinite linear;
	}

	/* Global keyframes defined in common-components.css */
</style>