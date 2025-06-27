<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getMempool } from '$lib/utils/api.js';
	import { FEE_ERGOTREE, ERG_DECIMALS } from '$lib/utils/constants.js';
	import { formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { socketService } from '$lib/services/socketService.js';

	let transactions = [];
	let groupedTransactions = [];
	let loading = true;
	let error = null;
	let totalPages = 1;
	let useRealTime = true;
	let refreshInterval;
	let isSocketConnected = false;
	let showConflicts = false;
	let showInfoCard = true;

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

	// Socket store unsubscribe functions
	let unsubscribeConnection;
	let unsubscribeMempool;
	let unsubscribeLastUpdate;

	// Get pagination params from URL
	$: limit = parseInt($page.url.searchParams.get('limit') || DEFAULT_LIMIT.toString(), 10);
	$: offset = parseInt($page.url.searchParams.get('offset') || '0', 10);
	$: currentPage = Math.floor(offset / limit) + 1;

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
				console.log(`Conflict detected: ${spendingTxs.length} transactions trying to spend box ${boxId}`);
				console.log('Conflicting transactions:', spendingTxs.map(tx => tx.id));
				
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

			// Initial load
			await loadTransactions();
			
			// Start fallback polling if not using real-time or not on first page
			if (!useRealTime || currentPage !== 1) {
				startFallbackPolling();
			}
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
			totalPages = Math.ceil((data.total || 0) / limit);
			
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
		
		// Manage real-time updates based on page
		if (newPage === 1 && useRealTime) {
			stopFallbackPolling();
		} else {
			startFallbackPolling();
		}
		
		// Smooth scroll to top
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

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<div class="page-header mb-0 px-0">
				<div class="header-content p-0">
					<h1 class="page-title p-0">
						<i class="fas fa-clock me-3 title-icon"></i>
						Mempool Transactions
					</h1>
					<div class="header-info">
						{#if !loading && displayTransactions.length > 0}
							<span class="info-text">
								Showing {offset + 1} - {Math.min(offset + limit, offset + displayTransactions.length)} transactions
							</span>
						{/if}
					</div>
				</div>
			</div>

			{#if error}
				<ErrorMessage message={error} type="danger" dismissible />
			{/if}

			<div class="mempool-info">
				{#if showInfoCard}
					<div class="info-card">
						<i class="fas fa-info-circle info-icon"></i>
						<div class="info-content">
							<strong>Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block.
						</div>
						<button class="dismiss-btn" onclick={dismissInfoCard} title="Dismiss">
							<i class="fas fa-times"></i>
						</button>
					</div>
				{/if}
				
				<div class="controls-card">
					<div class="control-section">
						<div class="connection-status">
							<div class="status-indicator" class:connected={isSocketConnected} class:disconnected={!isSocketConnected}>
								<i class="fas fa-circle"></i>
							</div>
							<span class="status-text">
								{isSocketConnected ? 'Real-time' : 'Fallback'}
							</span>
						</div>
						
						<div class="form-check form-switch">
							<input 
								class="form-check-input" 
								type="checkbox" 
								id="realTimeToggle"
								bind:checked={useRealTime}
								onchange={toggleRealTime}
								disabled={!isSocketConnected || currentPage !== 1}
							>
							<label class="form-check-label" for="realTimeToggle">
								Real-time updates
							</label>
						</div>
						
						<div class="form-check form-switch">
							<input 
								class="form-check-input" 
								type="checkbox" 
								id="conflictsToggle"
								bind:checked={showConflicts}
							>
							<label class="form-check-label" for="conflictsToggle">
								Show conflicts only
							</label>
						</div>
					</div>
				</div>
			</div>

			<div class="glass-container">
				<DataTable 
					{headers} 
					data={displayTransactions} 
					{loading}
					emptyMessage={showConflicts ? "No conflicting transactions found" : "No pending transactions in mempool"}
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

	.page-header {
		padding: 1.5rem 2rem;
		margin-bottom: 1.5rem;
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
		color: #ffc107;
		font-size: 1.8rem;
	}


	.info-text {
		color: var(--text-light);
		font-size: 0.95rem;
		font-weight: 500;
	}

	.form-check-input:checked {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}

	.form-check-label {
		color: var(--text-strong);
		font-weight: 500;
	}

	.btn-refresh {
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--glass-border-light);
		box-shadow: var(--glass-shadow-sm);
		color: var(--text-strong);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 500;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}

	.btn-refresh:hover {
		background: var(--main-color);
		border-color: var(--main-color);
		color: white;
		transform: translateY(-2px);
		box-shadow: var(--glass-shadow-md);
	}

	.btn-refresh:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.mempool-info {
		margin-bottom: 1.5rem;
	}

	.info-card {
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--glass-border-light);
		border-radius: 12px;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
		position: relative;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: var(--text-light);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		margin-left: auto;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
	}

	.dismiss-btn:hover {
		background: var(--glass-bg-subtle);
		color: var(--main-color);
	}

	.controls-card {
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border: 1px solid var(--glass-border-light);
		border-radius: 12px;
		padding: 1rem 1.5rem;
	}

	.control-section {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.info-icon {
		color: #17a2b8;
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.info-content {
		color: var(--text-strong);
		font-size: 0.95rem;
	}

	.refresh-badge {
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}

	.refresh-badge.realtime {
		background: #28a745;
	}

	.refresh-badge.polling {
		background: #ffc107;
		color: #212529;
	}

	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.header-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-info > * {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-indicator {
		font-size: 0.7rem;
	}

	.status-indicator.connected {
		color: #28a745;
	}

	.status-indicator.disconnected {
		color: #dc3545;
	}

	.status-text {
		color: var(--text-light);
		font-weight: 500;
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

	:global(.fa-spin) {
		animation: fa-spin 1s infinite linear;
	}

	@keyframes fa-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
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

		.header-controls {
			align-items: flex-start;
		}

		.control-group {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>