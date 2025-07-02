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
	import { FEE_ERGOTREE, ERG_DECIMALS, FEE_ADDRESS } from '$lib/utils/constants.js';
	import { formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { socketService } from '$lib/services/socketService.js';
import { boxResolutionService } from '$lib/services/boxResolutionService.js';
	import { addressBook } from '$lib/stores/addressBook.js';
	import MempoolTransactionPopup from '$lib/components/mempool/MempoolTransactionPopup.svelte';
	import { extractAddresses, generateAddressBadges, getKnownAddresses } from '$lib/utils/mempoolBadges.js';
    import { getAssetTitleParams } from '$lib/utils/tokenIcons';

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
	let resolvedTransactions = [];
	let currentAddressBook = [];

	// Local popup state for mempool transactions
	let transactionPopup = {
		visible: false,
		x: 0,
		y: 0,
		transaction: null,
		transactionId: ''
	};
	let hideTimeout = null;

	// Subscribe to address book updates
	addressBook.subscribe(value => {
		currentAddressBook = value;
	});

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
		const txToBoxMap = new Map();

		// Build maps of boxId to transactions and transactions to boxes
		txs.forEach(tx => {
			const txBoxes = [];
			tx.inputs?.forEach(input => {
				if (!boxToTxMap.has(input.boxId)) {
					boxToTxMap.set(input.boxId, []);
				}
				boxToTxMap.get(input.boxId).push(tx.id);
				txBoxes.push(input.boxId);
			});
			if (txBoxes.length > 0) {
				txToBoxMap.set(tx.id, txBoxes);
			}
		});

		// Find transactions that conflict (share at least one input box)
		const conflictGroups = new Map();
		const processedTxs = new Set();
		let conflictGroupId = 1;

		for (const [txId, boxes] of txToBoxMap) {
			if (processedTxs.has(txId)) continue;

			// Find all transactions that conflict with this one
			const conflictingTxs = new Set([txId]);
			const toProcess = [txId];

			while (toProcess.length > 0) {
				const currentTx = toProcess.pop();
				const currentBoxes = txToBoxMap.get(currentTx) || [];

				// For each box this transaction spends, find other transactions that spend it
				currentBoxes.forEach(boxId => {
					const spendingTxs = boxToTxMap.get(boxId) || [];
					spendingTxs.forEach(spendingTxId => {
						if (!conflictingTxs.has(spendingTxId)) {
							conflictingTxs.add(spendingTxId);
							toProcess.push(spendingTxId);
						}
					});
				});
			}

			// If more than one transaction in this group, it's a conflict
			if (conflictingTxs.size > 1) {
				const conflictingBoxes = new Set();
				conflictingTxs.forEach(txId => {
					const txBoxes = txToBoxMap.get(txId) || [];
					txBoxes.forEach(boxId => {
						const spenders = boxToTxMap.get(boxId) || [];
						if (spenders.length > 1) {
							conflictingBoxes.add(boxId);
						}
					});
				});

				conflictingTxs.forEach(txId => {
					conflictGroups.set(txId, {
						groupId: conflictGroupId,
						conflictingBoxes: Array.from(conflictingBoxes),
						conflictCount: conflictingTxs.size
					});
					processedTxs.add(txId);
				});
				conflictGroupId++;
			}
		}

		// Add conflict information to transactions
		return txs.map(tx => ({
			...tx,
			conflictGroup: conflictGroups.has(tx.id) ? conflictGroups.get(tx.id).groupId : null,
			conflictingBoxes: conflictGroups.has(tx.id) ? conflictGroups.get(tx.id).conflictingBoxes : [],
			conflictCount: conflictGroups.has(tx.id) ? conflictGroups.get(tx.id).conflictCount : 0
		}));
	}

	// Helper function to calculate fee for a transaction
	function calculateFee(tx) {
		const feeOutput = tx.outputs?.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}

	// Helper function to calculate ERG actually transferred between different addresses
	function calculateTransferredErg(tx) {
		if (!tx.inputs || !tx.outputs) return 0;

		// Sum ERG by address for inputs
		const inputsByAddress = new Map();
		tx.inputs.forEach(input => {
			if (input.address && input.value) {
				const current = inputsByAddress.get(input.address) || 0;
				inputsByAddress.set(input.address, current + parseInt(input.value));
			}
		});

		// Sum ERG by address for outputs (excluding fee)
		const outputsByAddress = new Map();
		tx.outputs.forEach(output => {
			if (output.address && output.value && output.ergoTree !== FEE_ERGOTREE) {
				const current = outputsByAddress.get(output.address) || 0;
				outputsByAddress.set(output.address, current + parseInt(output.value));
			}
		});

		// Calculate net transfers
		let totalTransferred = 0;
		const allAddresses = new Set([...inputsByAddress.keys(), ...outputsByAddress.keys()]);

		allAddresses.forEach(address => {
			const inputAmount = inputsByAddress.get(address) || 0;
			const outputAmount = outputsByAddress.get(address) || 0;
			const netChange = outputAmount - inputAmount;

			// Only count positive net changes (addresses that received more than they sent)
			if (netChange > 0) {
				totalTransferred += netChange;
			}
		});

		return totalTransferred;
	}

	// Helper function to calculate transaction priority score
	function calculateTransactionPriority(tx) {
		let score = 0;
		
		// 1. Fee priority (0-1000 points based on fee amount)
		const fee = calculateFee(tx);
		const feeScore = Math.min(fee / 1000000, 1000); // Scale fee to max 1000 points
		score += feeScore;
		
		// 2. Storage rent bonus (500 points)
		const extractResult = extractAddresses(tx);
		if (extractResult.hasStorageRent) {
			score += 500;
		}
		
		// 3. Known entity involvement bonus (300 points)
		const knownAddresses = getKnownAddresses(extractResult.addressMap, currentAddressBook, 10);
		if (knownAddresses.length > 0) {
			score += 300;
		}
		
		// 4. Conflict group penalty (but keep them visible)
		if (tx.conflictGroup) {
			score += 100; // Small bonus to keep conflicts visible
		}
		
		// 5. Asset transfer bonus (100 points)
		const hasAssets = tx.inputs?.some(input => input.assets?.length > 0) || 
						  tx.outputs?.some(output => output.assets?.length > 0);
		if (hasAssets) {
			score += 100;
		}
		
		// 6. Size efficiency bonus (smaller transactions get slight bonus)
		const sizeBonus = tx.size ? Math.max(0, 50 - (tx.size / 1000)) : 0;
		score += sizeBonus;
		
		return score;
	}

	// Reactive statement to group transactions - use resolved if available
	$: sourceTransactions = resolvedTransactions.length > 0 ? resolvedTransactions : transactions;
	$: groupedTransactions = groupConflictingTransactions(sourceTransactions);
	$: displayTransactions = showConflicts ? 
		groupedTransactions.filter(tx => tx.conflictGroup).sort((a, b) => {
			// First sort by conflict group
			if (a.conflictGroup !== b.conflictGroup) {
				return a.conflictGroup - b.conflictGroup;
			}
			// Then by fee (highest first)
			return calculateFee(b) - calculateFee(a);
		}) : 
		groupedTransactions.sort((a, b) => {
			// Prioritize double-spend groups over everything else
			const hasConflictA = a.conflictGroup ? 1 : 0;
			const hasConflictB = b.conflictGroup ? 1 : 0;
			
			if (hasConflictA !== hasConflictB) {
				return hasConflictB - hasConflictA; // Conflicts first
			}
			
			// If both have conflicts, sort by conflict group, then fee
			if (a.conflictGroup && b.conflictGroup) {
				if (a.conflictGroup !== b.conflictGroup) {
					return a.conflictGroup - b.conflictGroup;
				}
				// Same conflict group, sort by fee (highest first)
				return calculateFee(b) - calculateFee(a);
			}
			
			// If neither has conflicts, use priority score
			if (!a.conflictGroup && !b.conflictGroup) {
				const scoreA = calculateTransactionPriority(a);
				const scoreB = calculateTransactionPriority(b);
				
				if (scoreA !== scoreB) {
					return scoreB - scoreA;
				}
				
				// If scores are equal, sort by fee as tiebreaker
				const feeA = calculateFee(a);
				const feeB = calculateFee(b);
				return feeB - feeA;
			}
			
			return 0;
		});

	const headers = [
		{ 
			label: 'Transaction ID', 
			field: 'id', 
			render: (value, row) => {
				const conflictBadge = row.conflictGroup ? 
					`<span class="conflict-badge" title="Competing with ${row.conflictCount - 1} other transaction(s) for the same UTXO. Only one will succeed.">
						#${row.conflictGroup}
					</span>` : '';
				
				// Extract addresses and generate address badges
				const extractResult = extractAddresses(row);
				const addressBadges = generateAddressBadges(extractResult, currentAddressBook);
				
				return `<a href="/transactions/${value}" class="height-link" data-transaction-hover="${value}">${formatAddress(value, 9, 4)}</a> ${conflictBadge} ${addressBadges}`;
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
			label: 'Ins', 
			field: 'inputs', 
			render: (value) => formatNumber(value?.length || 0) 
		},
		{ 
			label: 'Outs', 
			field: 'outputs', 
			render: (value) => formatNumber(value?.length || 0) 
		},
		{ 
			label: 'ERG Transferred', 
			field: null, 
			render: (value, row) => {
				const transferredValue = calculateTransferredErg(row);
				return `${formatErgValue(transferredValue)} <small class="text-muted">${formatPriceUSD(transferredValue, 9, $ergPrice.value)}</small>`;
			}
		},
		{ 
			label: 'Assets', 
			field: null, 
			render: (value, row) => {
				const allAssets = new Set();
				
				// Extract assets from inputs and outputs
				row.inputs?.forEach(input => {
					input.assets?.forEach(asset => {
						const displayName = asset.name || (asset.tokenId ? asset.tokenId.slice(0, 6) + '...' : 'Unknown');
						allAssets.add({
							tokenId: asset.tokenId,
							name: asset.name,
							displayName: displayName
						});
					});
				});
				
				row.outputs?.forEach(output => {
					output.assets?.forEach(asset => {
						const displayName = asset.name || (asset.tokenId ? asset.tokenId.slice(0, 6) + '...' : 'Unknown');
						allAssets.add({
							tokenId: asset.tokenId,
							name: asset.name,
							displayName: displayName
						});
					});
				});
				
				if (allAssets.size === 0) {
					return '<span class="text-muted text-center">-</span>';
				}
				
				const assetsList = Array.from(allAssets);
				const fullList = assetsList.join(', ');
				
				if (assetsList.length === 1) {
					return `<div class="asset-container" title="${fullList}">
						<div class="asset-name">${getAssetTitleParams(assetsList[0], assetsList[0].tokenId, assetsList[0].name)}</div>
					</div>`;
				} else {
					return `<div class="asset-container" title="${fullList}">
						<div class="asset-name">${getAssetTitleParams(assetsList[0], assetsList[0].tokenId, assetsList[0].name)}</div>
						<div class="asset-more">+${assetsList.length - 1} more</div>
					</div>`;
				}
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
			// Set up box resolution service
			boxResolutionService.setSocketService(socketService);
			
			// Subscribe to socket stores
			unsubscribeConnection = socketService.getConnectionStatus().subscribe(status => {
				isSocketConnected = status;
			});

			unsubscribeMempool = socketService.getMempoolTransactions().subscribe(async (socketTransactions) => {
				if (useRealTime && currentPage === 1 && socketTransactions.length > 0) {
					transactions = socketTransactions.slice(0, limit);
					loading = false;
					error = null;
					// Start asset resolution in background
					resolveAssetsInBackground(socketTransactions.slice(0, limit));
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

			// Set up custom hover handlers for mempool transactions
			setupMempoolTransactionHovers();
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
		if (hideTimeout) {
			clearTimeout(hideTimeout);
		}
		if (unsubscribeConnection) unsubscribeConnection();
		if (unsubscribeMempool) unsubscribeMempool();
		if (unsubscribeLastUpdate) unsubscribeLastUpdate();
	}

	// Custom hover handler for mempool transactions to use existing data
	function setupMempoolTransactionHovers() {
		if (typeof document === 'undefined') return;

		// Handle mouseover for mempool transaction links
		document.addEventListener('mouseover', (event) => {
			const link = event.target.closest('[data-transaction-hover]');
			if (!link || !link.closest('.mempool-container')) return; // Only handle mempool hovers
			
			const txId = link.getAttribute('data-transaction-hover');
			if (!txId) return;

			// Clear any pending hide timeout
			if (hideTimeout) {
				clearTimeout(hideTimeout);
				hideTimeout = null;
			}

			// Find the transaction data in our current transactions
			const transaction = displayTransactions.find(tx => tx.id === txId);
			if (!transaction) return;

			// Set popup position and show with existing transaction data
			transactionPopup = {
				visible: true,
				x: event.clientX + 20,
				y: event.clientY - 10,
				transaction: transaction,
				transactionId: txId
			};
		});

		// Handle mouseout
		document.addEventListener('mouseout', (event) => {
			const link = event.target.closest('[data-transaction-hover]');
			if (!link || !link.closest('.mempool-container')) return;

			const relatedTarget = event.relatedTarget;
			
			// Don't hide if moving to the popup itself
			if (relatedTarget && relatedTarget.closest('.mempool-transaction-popup')) return;

			// Don't hide if moving to another transaction link in mempool
			if (relatedTarget && relatedTarget.closest('[data-transaction-hover]') && relatedTarget.closest('.mempool-container')) return;

			// Hide popup after delay
			hideTimeout = setTimeout(() => {
				transactionPopup = {
					...transactionPopup,
					visible: false
				};
				hideTimeout = null;
			}, 150);
		});

		// Handle mouse enter on popup to cancel hide timeout
		document.addEventListener('mouseover', (event) => {
			if (event.target.closest('.mempool-transaction-popup')) {
				if (hideTimeout) {
					clearTimeout(hideTimeout);
					hideTimeout = null;
				}
			}
		});

		// Handle mouse leave from popup
		document.addEventListener('mouseout', (event) => {
			const popup = event.target.closest('.mempool-transaction-popup');
			if (!popup) return;

			const relatedTarget = event.relatedTarget;
			
			// Don't hide if moving to a transaction link in mempool
			if (relatedTarget && relatedTarget.closest('[data-transaction-hover]') && relatedTarget.closest('.mempool-container')) return;
			
			// Don't hide if still inside popup
			if (relatedTarget && relatedTarget.closest('.mempool-transaction-popup')) return;

			// Hide popup after delay
			hideTimeout = setTimeout(() => {
				transactionPopup = {
					...transactionPopup,
					visible: false
				};
				hideTimeout = null;
			}, 150);
		});

		// Fallback: hide popup if mouse moves away from mempool area entirely
		document.addEventListener('mousemove', (event) => {
			if (!transactionPopup.visible) return;

			const isOverMempoolContainer = event.target.closest('.mempool-container');
			const isOverPopup = event.target.closest('.mempool-transaction-popup');
			const isOverTransactionLink = event.target.closest('[data-transaction-hover]');

			// If mouse is not over mempool area, popup, or transaction links, hide popup
			if (!isOverMempoolContainer && !isOverPopup && !isOverTransactionLink) {
				if (hideTimeout) {
					clearTimeout(hideTimeout);
				}
				hideTimeout = setTimeout(() => {
					transactionPopup = {
						...transactionPopup,
						visible: false
					};
					hideTimeout = null;
				}, 300); // Longer delay for mouse move fallback
			}
		});
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
			
			// Start asset resolution in background
			if (transactions.length > 0) {
				resolveAssetsInBackground(transactions);
			}
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load mempool:', err);
		} finally {
			loading = false;
		}
	}

	async function resolveAssetsInBackground(txs) {
		if (!txs || txs.length === 0) return;
		
		try {
			// Process transactions in small batches to avoid overwhelming the API
			const batchSize = 3;
			const processedTxs = [];
			
			for (let i = 0; i < txs.length; i += batchSize) {
				const batch = txs.slice(i, i + batchSize);
				const batchPromises = batch.map(async (tx) => {
					try {
						// Process transaction data (convert ergotrees to addresses)
						const processedTx = boxResolutionService.processTransactionData(tx);
						
						// Resolve input box data for asset information
						const resolvedTx = await boxResolutionService.resolveInputBoxData(processedTx, {
							prioritizeSocket: true,
							maxConcurrency: 2 // Keep it low to avoid API spam
						});
						
						return resolvedTx;
					} catch (error) {
						console.warn('Failed to resolve assets for transaction:', tx.id, error);
						return tx; // Return original transaction on error
					}
				});
				
				const batchResults = await Promise.all(batchPromises);
				processedTxs.push(...batchResults);
				
				// Small delay between batches to be gentle on the API
				if (i + batchSize < txs.length) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}
			
			// Update resolved transactions
			resolvedTransactions = processedTxs;
			
		} catch (error) {
			console.error('Asset resolution failed:', error);
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

<div class="container-fluid p-0 mempool-container">
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

<!-- Mempool Transaction Popup -->
<MempoolTransactionPopup 
	visible={transactionPopup.visible}
	x={transactionPopup.x}
	y={transactionPopup.y}
	transaction={transactionPopup.transaction}
	transactionId={transactionPopup.transactionId}
/>

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

	/* Column width customization for assets column */
	:global(.glass-table th:nth-child(6), .glass-table td:nth-child(6)) {
		max-width: 180px;
		min-width: 120px;
		width: 150px;
		vertical-align: top;
	}

	/* Asset container styling */
	:global(.asset-container) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		width: 100%;
	}

	/* Asset name styling - single line with ellipsis */
	:global(.asset-name) {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85rem;
		line-height: 1.2;
		color: var(--text-strong);
	}

	/* Asset more indicator styling */
	:global(.asset-more) {
		font-size: 0.75rem;
		color: var(--text-light);
		line-height: 1;
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


	:global(.asset-list) {
		font-size: 0.8rem;
		color: var(--text-strong);
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	:global(.address-badge) {
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		margin-left: 0.25rem;
		display: inline-block;
	}

	:global(.badge-info) {
		background: #17a2b8;
		color: white;
	}

	:global(.badge-primary) {
		background: #007bff;
		color: white;
	}

	:global(.badge-warning) {
		background: #ffc107;
		color: #212529;
	}

	:global(.badge-success) {
		background: #28a745;
		color: white;
	}

	:global(.badge-secondary) {
		background: #6c757d;
		color: white;
	}

	:global(.badge-mew) {
		background: #4a0e4e;
		color: white;
	}

	:global(.badge-spectrum) {
		background: #a855f7;
		color: white;
	}

	:global(.badge-crooks) {
		background: #84cc16;
		color: white;
	}

	:global(.badge-gold) {
		background: #fbbf24;
		color: #1f2937;
	}

	:global(.badge-usd) {
		background: #6366f1;
		color: white;
	}

	:global(.badge-duck) {
		background: #fde047;
		color: #1f2937;
	}

	:global(.badge-rosen) {
		background: #f43f5e;
		color: white;
	}

	:global(.badge-teal) {
		background: #0891b2;
		color: white;
	}

	:global(.badge-storage-rent) {
		background: #f59e0b;
		color: #1f2937;
	}

</style>