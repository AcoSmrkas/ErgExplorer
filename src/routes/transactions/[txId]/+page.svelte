<script>
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import { formatErgValue, formatDateString, formatNumber, formatFileSize, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import AddressLink from '$lib/components/ui/AddressLink.svelte';
import BoxLink from '$lib/components/ui/BoxLink.svelte';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { usePrices } from '$lib/composables/useAsyncData.js';
	import { FEE_ERGOTREE } from '$lib/utils/constants.js';
    import { formatValue } from '$lib/utils/numberFormatting.js';
    import { currentPrices } from '$lib/stores/priceStore.js';
    import { tokenIconsStore } from '$lib/stores/tokenIconsStore.js';

	export let data;
	$: ({ transaction, txId } = data);
	
	// Use composable for price data
	const { ergPrice, loadPrices } = usePrices();
	
	
	// Create assets cell with scrollable list
	function createAssetsCell(assets) {
		if (!assets || assets.length === 0) return '—';
		
		// Reactive dependency on token icons store to trigger re-render when icons are loaded
		$tokenIconsStore;
		
		// Sort assets by priority: 1) USD value (if exists), 2) has token icon, 3) alphabetically
		const sortedAssets = [...assets].sort((a, b) => {
			const priceA = $currentPrices[a.tokenId];
			const priceB = $currentPrices[b.tokenId];
			const adjustedAmountA = a.amount / Math.pow(10, a.decimals || 0);
			const adjustedAmountB = b.amount / Math.pow(10, b.decimals || 0);
			const usdValueA = priceA ? adjustedAmountA * priceA : 0;
			const usdValueB = priceB ? adjustedAmountB * priceB : 0;
			
			// First sort by USD value (descending)
			if (usdValueA > 0 && usdValueB > 0) {
				return usdValueB - usdValueA;
			} else if (usdValueA > 0 && usdValueB === 0) {
				return -1;
			} else if (usdValueA === 0 && usdValueB > 0) {
				return 1;
			}
			
			// If both have no USD value, check for token icons
			const titleA = getAssetTitleParams(null, a.tokenId, a.name, true);
			const titleB = getAssetTitleParams(null, b.tokenId, b.name, true);
			const hasIconA = titleA.includes('<img') || titleA.includes('token-icon');
			const hasIconB = titleB.includes('<img') || titleB.includes('token-icon');
			
			if (hasIconA && !hasIconB) {
				return -1;
			} else if (!hasIconA && hasIconB) {
				return 1;
			}
			
			// Finally, sort alphabetically by name
			return (a.name || '').localeCompare(b.name || '');
		});
		
		const assetItems = sortedAssets.map(asset => {
			const assetTitle = getAssetTitleParams(null, asset.tokenId, asset.name, true);
			const amount = formatValue(asset.amount / Math.pow(10, asset.decimals || 0), 0, false, false, true);
			const usdAmount = formatPriceUSD(asset.amount, asset.decimals, $currentPrices[asset.tokenId]);
			const usdAmountString = usdAmount === '($0.00)' ? '' : `<span class="text-light">${usdAmount}</span>`;

			return `
				<div class="asset-item">
					<div class="asset-info">
						${assetTitle}
					</div>
					<div class="asset-amount">${amount} ${usdAmountString}</div>
				</div>
			`;
		}).join('');
		
		return `
			<div class="assets-container">
				${assetItems}
			</div>
		`;
	}

	// Shared table headers (identical for inputs and outputs)
	const tableHeaders = [
		{ 
			label: 'Index', 
			field: 'index',
			render: (value, row, index) => `<span class="index-number">${index}</span>`
		},
		{ 
			label: 'Box ID', 
			field: 'boxId',
			component: BoxLink,
			componentProps: (row) => ({
				boxId: row.boxId || "",
				startChars: 16,
				endChars: 4,
				showCopy: true
			})
		},
		{ 
			label: 'Address', 
			field: 'address',
			component: AddressLink,
			componentProps: (row) => ({
				address: row.address || "",
				startChars: 9,
				endChars: 4,
				showCopy: true
			})
		},
		{ 
			label: 'Value', 
			field: 'value',
			render: (value) => `${formatErgValue(value)}`
		},
		{ 
			label: 'Assets', 
			field: 'assets',
			render: (value) => createAssetsCell(value)
		}
	];

	onMount(async () => {
		await loadPrices();
	});


	// Calculate transaction metrics
	$: totalInputValue = transaction?.inputs?.reduce((sum, input) => sum + (parseInt(input.value) || 0), 0) || 0;
	$: totalOutputValue = transaction?.outputs?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
	$: feeAmount = calculateFee(transaction);
	$: isConfirmed = transaction?.inclusionHeight > 0;
	$: burnedAssets = calculateBurnedAssets(transaction);
	
	// Helper functions
	function calculateFee(tx) {
		if (!tx?.outputs) return 0;
		const feeOutput = tx.outputs.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}
	
	function calculateBurnedAssets(tx) {
		if (!tx) return [];
		// Implementation would track assets in inputs vs outputs to find burned assets
		// For now, return empty array - can be enhanced later
		return [];
	}

	// Generate info text for page header
	function getInfoText() {
		if (!transaction) return '';
		const status = isConfirmed ? 'Confirmed' : 'Pending';
		const inputs = transaction.inputs?.length || 0;
		const outputs = transaction.outputs?.length || 0;
		return `${status} • ${inputs} inputs → ${outputs} outputs • ${formatFileSize(transaction.size || 0)}`;
	}
</script>

<svelte:head>
	<title>Transaction {formatAddress(txId, 16, 8)} - Erg Explorer</title>
	<meta name="description" content="View transaction details, inputs, outputs, and fees for Ergo transaction {txId}">
</svelte:head>

{#if transaction}
	<div class="container-fluid p-0">
		<div class="row p-0">
			<div class="col-12 p-0">
				<PageHeader 
					title="Transaction" 
					icon="fa-exchange-alt" 
					info={getInfoText()}
				/>

				<div class="container-fluid p-0">

				<!-- Transaction Summary - Hidden on mobile, shown after outputs -->
				<div class="row mb-4 p-0 d-none d-md-block">
					<div class="col-12 p-0">
						<div class="glass-card">
							<div class="card-header">
								<div class="header-content">
									<h2 class="section-title">Transaction Details</h2>
								</div>
							</div>
							<div class="card-content">
								<div class="row">
									<div class="col-lg-6 p-0 p-md-4">
										<div class="detail-section">
											<div class="detail-row">
												<span class="detail-label">Transaction ID:</span>
												<span class="detail-value">
													<div class="tx-id-row">
														<span class="font-monospace tx-id-text">{txId.slice(0, 8)}...{txId.slice(-4)}</span>
														<CopyButton 
															text={txId}
															label="Copy"
															successMessage="Transaction ID copied to clipboard!"
															size="small"
															inline={true}
														/>
													</div>
												</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Status:</span>
												<span class="detail-value">
													{#if isConfirmed}
														<span class="status-badge confirmed">Confirmed</span>
													{:else}
														<span class="status-badge pending">Pending</span>
													{/if}
												</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Block Height:</span>
												<span class="detail-value">
													{#if transaction.inclusionHeight}
														<a href="/blocks/{transaction.inclusionHeight}" class="text-link">{formatNumber(transaction.inclusionHeight)}</a>
													{:else}
														<span class="text-muted">Pending</span>
													{/if}
												</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Timestamp:</span>
												<span class="detail-value">{formatDateString(transaction.timestamp)}</span>
											</div>
										</div>
									</div>
									<div class="col-lg-6 p-0 p-md-4">
										<div class="detail-section">
											<div class="detail-row">
												<span class="detail-label">Fee:</span>
												<span class="detail-value">
													{@html formatErgValue(feeAmount)}
													{#if $ergPrice}
														<br><small class="text-light">{formatPriceUSD(feeAmount, $ergPrice)}</small>
													{/if}
												</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Confirmations:</span>
												<span class="detail-value">
													{#if transaction.numConfirmations}
														{formatNumber(transaction.numConfirmations)}
													{:else}
														<span class="text-warning">Pending</span>
													{/if}
												</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Size:</span>
												<span class="detail-value">{formatFileSize(transaction.size)}</span>
											</div>
											<div class="detail-row">
												<span class="detail-label">Fee per Byte:</span>
												<span class="detail-value">{@html formatErgValue(feeAmount / (transaction.size || 1), 9)}</span>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Inputs -->
				{#if transaction.inputs?.length > 0}
					<Card 
						title="Inputs" 
						icon="fa-sign-in-alt" 
						count={transaction.inputs.length}
						noPadding={true}
					>
						<!-- Desktop/Tablet Table View -->
						<div class="d-none d-md-block">
							<DataTable 
								headers={tableHeaders} 
								data={transaction.inputs} 
								loading={false}
								sortable={false}
							/>
						</div>
						
						<!-- Mobile Card View -->
						<div class="d-md-none">
							{#each transaction.inputs as input, index}
								<div class="mobile-item-card" style="background: {index % 2 === 1 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'}">
									<div class="mobile-item-header">
										<span class="mobile-item-index">#{index}</span>
										<BoxLink boxId={input.boxId} startChars={8} endChars={4} showCopy={true} linkClass="mobile-box-link" />
									</div>
									<div class="mobile-item-details">
										<div class="mobile-detail-row">
											<span class="mobile-label">Address:</span>
											<AddressLink address={input.address || ""} startChars={8} endChars={4} showCopy={true} />
										</div>
										<div class="mobile-detail-row">
											<span class="mobile-label">Value:</span>
											<span class="mobile-value">{@html formatErgValue(input.value)}</span>
										</div>
										{#if input.assets?.length > 0}
											<div class="mobile-detail-row mobile-assets-row">
												<span class="mobile-label">Assets:</span>
												<div class="mobile-assets-scrollable">
													{@html createAssetsCell(input.assets)}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Outputs -->
				{#if transaction.outputs?.length > 0}
					<Card 
						title="Outputs" 
						icon="fa-sign-out-alt" 
						count={transaction.outputs.length}
						noPadding={true}
					>
						<!-- Desktop/Tablet Table View -->
						<div class="d-none d-md-block">
							<DataTable 
								headers={tableHeaders} 
								data={transaction.outputs} 
								loading={false}
								sortable={false}
							/>
						</div>
						
						<!-- Mobile Card View -->
						<div class="d-md-none">
							{#each transaction.outputs as output, index}
								<div class="mobile-item-card" style="background: {index % 2 === 1 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)'}">
									<div class="mobile-item-header">
										<span class="mobile-item-index">#{index}</span>
										<BoxLink boxId={output.boxId} startChars={8} endChars={4} showCopy={true} linkClass="mobile-box-link" />
									</div>
									<div class="mobile-item-details">
										<div class="mobile-detail-row">
											<span class="mobile-label">Address:</span>
											<AddressLink address={output.address || ""} startChars={8} endChars={4} showCopy={true} />
										</div>
										<div class="mobile-detail-row">
											<span class="mobile-label">Value:</span>
											<span class="mobile-value">{@html formatErgValue(output.value)}</span>
										</div>
										{#if output.assets?.length > 0}
											<div class="mobile-detail-row mobile-assets-row">
												<span class="mobile-label">Assets:</span>
												<div class="mobile-assets-scrollable">
													{@html createAssetsCell(output.assets)}
												</div>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Transaction Details - Mobile Only -->
				<div class="d-md-none">
					<Card title="Transaction Details" icon="fa-info-circle">
						<div class="detail-section">
							<div class="detail-row">
								<span class="detail-label">Transaction ID:</span>
								<span class="detail-value">
									<div class="tx-id-row">
										<span class="font-monospace tx-id-text">{txId.slice(0, 8)}...{txId.slice(-4)}</span>
										<CopyButton 
											text={txId}
											label="Copy"
											successMessage="Transaction ID copied to clipboard!"
											size="small"
											inline={true}
										/>
									</div>
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Status:</span>
								<span class="detail-value">
									{#if isConfirmed}
										<span class="status-badge confirmed">Confirmed</span>
									{:else}
										<span class="status-badge pending">Pending</span>
									{/if}
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Block Height:</span>
								<span class="detail-value">
									{#if transaction.inclusionHeight}
										<a href="/blocks/{transaction.inclusionHeight}" class="text-link">{formatNumber(transaction.inclusionHeight)}</a>
									{:else}
										<span class="text-muted">Pending</span>
									{/if}
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Timestamp:</span>
								<span class="detail-value">{formatDateString(transaction.timestamp)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Fee:</span>
								<span class="detail-value">
									{@html formatErgValue(feeAmount)}
									{#if $ergPrice}
										<br><small class="text-light">{formatPriceUSD(feeAmount, $ergPrice)}</small>
									{/if}
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Confirmations:</span>
								<span class="detail-value">
									{#if transaction.numConfirmations}
										{formatNumber(transaction.numConfirmations)}
									{:else}
										<span class="text-warning">Pending</span>
									{/if}
								</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Size:</span>
								<span class="detail-value">{formatFileSize(transaction.size)}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Fee per Byte:</span>
								<span class="detail-value">{@html formatErgValue(feeAmount / (transaction.size || 1), 9)}</span>
							</div>
						</div>
					</Card>
				</div>

				<!-- Burned Assets -->
				{#if burnedAssets.length > 0}
					<Card title="Burned Assets" icon="fa-fire">
						<div class="burned-assets-list">
							{#each burnedAssets as asset}
								<div class="burned-asset-item">
									<TokenDisplay {asset} showPrice={true} />
								</div>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Raw Data -->
				<Card title="Raw Transaction Data" icon="fa-code">
					<div class="raw-data-header">
						<CopyButton 
							text={JSON.stringify(transaction, null, 2)}
							label="Copy JSON"
							successMessage="Raw transaction data copied to clipboard!"
							size="small"
						/>
					</div>
					<pre class="raw-data"><code>{JSON.stringify(transaction, null, 2)}</code></pre>
				</Card>
			</div>
		</div>
	</div>
</div>
{:else}
	<div class="text-center p-5">
		<i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
		<p class="text-muted">Transaction not found</p>
	</div>
{/if}

<style>
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	:global(.card-body) {
		background-color: unset !important;
	}

	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
		flex-shrink: 0;
		min-width: 120px;
	}

	.detail-value {
		color: var(--text-strong);
		font-size: 0.9rem;
		text-align: right;
		word-break: break-word;
		flex: 1;
	}

	.status-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 8px;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		line-height: 1.2;
	}

	.status-badge.confirmed {
		background: rgba(40, 167, 69, 0.2);
		color: #28a745;
		border: 1px solid rgba(40, 167, 69, 0.3);
	}

	.status-badge.pending {
		background: rgba(255, 193, 7, 0.2);
		color: #ffc107;
		border: 1px solid rgba(255, 193, 7, 0.3);
	}

	.burned-assets-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.burned-asset-item {
		padding: 1rem;
		background: var(--glass-bg-subtle);
		border-radius: 8px;
		border: 1px solid rgba(220, 53, 69, 0.2);
	}

	/* Consolidated link styles */
	:global(.address-link),
	:global(.text-link),
	:global(.box-link) {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	:global(.text-link) {
		font-weight: 600;
	}

	:global(.address-link:hover),
	:global(.text-link:hover) {
		color: var(--main-color);
	}

	:global(.box-link:hover) {
		color: var(--info-color);
	}

	:global(.assets-container) {
		max-height: 120px; /* Height for approximately 3 items */
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
	}

	:global(.asset-item) {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.3rem 0;
		background: transparent;
		border-radius: 0;
		border: none;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		min-height: 40px;
	}

	:global(.asset-item:last-child) {
		border-bottom: none;
	}

	:global(.asset-info) {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	:global(.asset-amount) {
		flex-shrink: 0;
		font-weight: 500;
		color: var(--text-strong);
		font-size: 0.85rem;
		margin-left: 0.5rem;
	}

	/* Scrollbar styles */
	:global(.assets-container::-webkit-scrollbar),
	.raw-data::-webkit-scrollbar {
		width: 4px;
	}

	:global(.assets-container::-webkit-scrollbar-track),
	.raw-data::-webkit-scrollbar-track {
		background: var(--glass-bg-subtle);
		border-radius: 2px;
	}

	:global(.assets-container::-webkit-scrollbar-thumb),
	.raw-data::-webkit-scrollbar-thumb {
		background: var(--glass-border-medium);
		border-radius: 2px;
	}

	:global(.assets-container::-webkit-scrollbar-thumb:hover),
	.raw-data::-webkit-scrollbar-thumb:hover {
		background: var(--main-color);
	}

	:global(.index-number) {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
	}

	.raw-data-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.raw-data {
		background: #000000;
		border: 1px solid var(--glass-border-light);
		border-radius: 8px;
		padding: 1rem;
		overflow-x: auto;
		font-size: 0.8rem;
		max-height: 400px;
		overflow-y: auto;
		margin: 0;
	}

	.raw-data code {
		color: #ffffff;
		font-family: 'Courier New', Monaco, monospace;
		white-space: pre;
		background: transparent;
	}

	.tx-id-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.tx-id-text {
		color: var(--text-strong);
		font-size: 0.9rem;
	}
	
	/* Mobile-specific table optimizations */
	@media (max-width: 991px) {
		/* Hide less important columns on tablets */
		:global(.glass-table th:nth-child(1)),
		:global(.glass-table td:nth-child(1)) {
			display: none;
		}
	}
	
	@media (max-width: 768px) {
		/* Make assets container more compact on mobile */
		:global(.assets-container) {
			max-height: 80px;
			font-size: 0.75rem;
		}
		
		:global(.asset-item) {
			padding: 0rem 0 !important;
			min-height: 40px !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
		}
		
		:global(.asset-amount) {
			font-size: 0.75rem;
		}
		
		/* Compact table styling */
		:global(.glass-table) {
			font-size: 0.8rem;
		}
		
		:global(.glass-table th),
		:global(.glass-table td) {
			padding: 0.5rem 0.3rem;
		}
		
		/* Hide Index column on mobile */
		:global(.glass-table th:nth-child(1)),
		:global(.glass-table td:nth-child(1)) {
			display: none;
		}
		
		/* Make Box ID column narrower */
		:global(.glass-table th:nth-child(2)),
		:global(.glass-table td:nth-child(2)) {
			width: 80px;
			min-width: 80px;
		}
		
		/* Make Address column responsive */
		:global(.glass-table th:nth-child(3)),
		:global(.glass-table td:nth-child(3)) {
			width: 90px;
			min-width: 90px;
		}
		
		/* Stack transaction details vertically */
		.tx-id-row {
			flex-direction: row;
			align-items: center;
			gap: 0.3rem;
			justify-content: flex-end;
		}
		
		.tx-id-text {
			font-size: 0.8rem;
		}
		
		/* Add border between timestamp and fee on mobile when in single column */
		.col-lg-6:first-child .detail-section .detail-row:last-child {
			border-bottom: 1px solid var(--glass-border-light);
			padding-bottom: 0.75rem;
			margin-bottom: 0;
		}
		
		.col-lg-6:last-child .detail-section {
			padding-top: 0rem;
		}
		
		/* Raw data section mobile optimization */
		.raw-data {
			font-size: 0.7rem;
			max-height: 250px;
			padding: 0.25rem;
		}
		
		.raw-data-header {
			margin-bottom: 0.5rem;
			padding-bottom: 0.25rem;
		}
	}

	@media (max-width: 576px) {
		/* Ultra-mobile optimizations */
		:global(.glass-table th:nth-child(5)),
		:global(.glass-table td:nth-child(5)) {
			display: none; /* Hide Assets column on very small screens */
		}
		
		:global(.glass-table) {
			font-size: 0.75rem;
		}
		
		:global(.glass-table th),
		:global(.glass-table td) {
			padding: 0.4rem 0.2rem;
		}
		
		.raw-data {
			font-size: 0.65rem;
			max-height: 200px;
			padding: 0.5rem;
		}
		
		.tx-id-text {
			font-size: 0.75rem;
		}
		
		/* Make status badge smaller */
		.status-badge {
			padding: 0.1rem 0.4rem;
			font-size: 0.65rem;
		}
	}

	/* Mobile card layout styles */
	.mobile-item-card {
		background: var(--glass-bg-subtle);
		border: none;
		border-radius: 0;
		padding: 0.75rem 0;
		margin: 0;
	}


	.mobile-item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		padding: 0 1rem 0.5rem 1rem;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.mobile-item-index {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-light);
	}

	.mobile-item-details {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0 1rem;
	}

	.mobile-detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.mobile-label {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-light);
		flex-shrink: 0;
	}

	.mobile-value {
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-strong);
		text-align: right;
	}

	.mobile-assets-count {
		font-size: 0.75rem;
		color: var(--main-color);
		font-weight: 500;
		background: rgba(var(--main-color-rgb), 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 12px;
		border: 1px solid rgba(var(--main-color-rgb), 0.2);
	}

	/* Mobile assets styles */
	.mobile-assets-row {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
	}

	.mobile-assets-scrollable {
		width: 100%;
		max-height: 120px;
		overflow-y: auto;
	}


</style>