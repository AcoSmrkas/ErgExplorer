<script>
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	import TransactionDetailsSection from '$lib/components/transaction/TransactionDetailsSection.svelte';
	import BoxCard from '$lib/components/transaction/BoxCard.svelte';
	import { usePrices } from '$lib/composables/useAsyncData.js';
	import { useTransaction } from '$lib/composables/useTransaction.js';
	import { 
		calculateFee, 
		calculateBurnedAssets, 
		getInfoText,
		calculateTotalInputValue,
		calculateTotalOutputValue
	} from '$lib/utils/transactionHelpers.js';

	export let data;
	$: ({ transaction: initialTransaction, txId, initialStatus } = data);
	
	// Use transaction monitoring service for real-time updates
	const { transaction: monitoredTransaction, getStatusText, getStatusType: getMonitoringStatusType } = useTransaction(data.txId);
	
	// Use monitored transaction data when available, fallback to initial data
	$: transaction = $monitoredTransaction?.data || initialTransaction;
	$: transactionStatus = $monitoredTransaction?.status || initialStatus;
	
	// If we have no initial transaction but monitoring found one, use that
	$: if (!transaction && $monitoredTransaction?.data) {
		transaction = $monitoredTransaction.data;
	}
	
	// Use composable for price data
	const { ergPrice, loadPrices } = usePrices();
	
	onMount(async () => {
		await loadPrices();
	});

	// Calculate transaction metrics
	$: totalInputValue = calculateTotalInputValue(transaction);
	$: totalOutputValue = calculateTotalOutputValue(transaction);
	$: feeAmount = calculateFee(transaction);
	$: txIsConfirmed = transactionStatus === 'confirmed' || transaction?.inclusionHeight > 0;
	$: burnedAssets = calculateBurnedAssets(transaction);
	$: infoText = getInfoText(transaction, txIsConfirmed);
	
	// Real-time status information
	$: statusBadge = transactionStatus !== 'confirmed' ? { 
		text: getStatusText($monitoredTransaction), 
		type: getMonitoringStatusType($monitoredTransaction) 
	} : null;
	
	// Check if transaction might be at risk of being dropped
	$: isAtDropRisk = $monitoredTransaction?.retryCount > 0 && transactionStatus === 'unconfirmed';
	
	// Debug logging
	$: if ($monitoredTransaction) {
		console.log('Monitored transaction status:', $monitoredTransaction.status);
		console.log('Transaction status:', transactionStatus);
		console.log('Is confirmed:', txIsConfirmed);
		console.log('Monitored data:', $monitoredTransaction);
	}
</script>

<svelte:head>
	<title>Transaction {formatAddress(txId, 16, 8)} - Erg Explorer</title>
	<meta name="description" content="View transaction details, inputs, outputs, and fees for Ergo transaction {txId}">
</svelte:head>

{#if transaction || $monitoredTransaction?.data}
	<div class="container-fluid p-0">
		<div class="row p-0">
			<div class="col-12 p-0">
				<PageHeader 
					title="Transaction" 
					icon="fa-exchange-alt" 
					info={infoText}
					timestamp={txIsConfirmed ? transaction?.timestamp : null}
					statusBadge={statusBadge}
				>
					<div slot="subtitle" class="tx-id-section">
						<div class="d-flex align-items-center gap-2">
							<span class="tx-id-display font-monospace">ID: {formatAddress(txId, 10, 4)}</span>
							<CopyButton 
								text={txId}
								label=""
								successMessage="Transaction ID copied!"
								size="small"
								inline={true}
							/>
						</div>
					</div>
				</PageHeader>

				<div class="container-fluid p-0">

				<!-- Real-time monitoring indicator -->
				{#if $monitoredTransaction && ($monitoredTransaction.status === 'unconfirmed' || !txIsConfirmed)}
					<div class="monitoring-indicator mb-3">
						<div class="glass-card p-2">
							<div class="d-flex align-items-center justify-content-center">
								<i class="fas fa-satellite-dish text-info me-2"></i>
								<small class="text-muted">
									Monitoring transaction status in real-time via {$monitoredTransaction.source}
									{#if $monitoredTransaction.lastUpdate}
										• Last update: {new Date($monitoredTransaction.lastUpdate).toLocaleTimeString()}
									{/if}
								</small>
							</div>
						</div>
					</div>
				{/if}

				<!-- Drop risk warning -->
				{#if isAtDropRisk}
					<div class="drop-risk-warning mb-3">
						<div class="glass-card p-3">
							<div class="d-flex align-items-center">
								<i class="fas fa-exclamation-triangle text-warning me-2"></i>
								<div>
									<div class="text-warning fw-bold">Transaction at risk</div>
									<small class="text-muted">
										This transaction has not been found in the mempool for {$monitoredTransaction?.retryCount || 0} check(s). 
										It may be dropped after 2 failed checks.
									</small>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Inputs & Outputs - 2 Column Layout -->
				{#if transaction.inputs?.length > 0 || transaction.outputs?.length > 0}
					<div class="inputs-outputs-container">
						<div class="row">
							<!-- Inputs Column -->
							{#if transaction.inputs?.length > 0}
								<div class="col-md-6 p-0 pe-md-3">
									<Card 
										title="Inputs" 
										icon="fa-sign-in-alt" 
										count={transaction.inputs.length}
										noPadding={true}
									>
										<div class="boxes-list">
											{#each transaction.inputs as input, index}
												<BoxCard 
													box={input} 
													{index} 
													type="input"
													isConfirmed={txIsConfirmed}
												/>
											{/each}
										</div>
									</Card>
								</div>
							{/if}
							
							<!-- Outputs Column -->
							{#if transaction.outputs?.length > 0}
								<div class="col-md-6 p-0 ps-md-3">
									<Card 
										title="Outputs" 
										icon="fa-sign-out-alt" 
										count={transaction.outputs.length}
										noPadding={true}
									>
										<div class="boxes-list">
											{#each transaction.outputs as output, index}
												<BoxCard 
													box={output} 
													{index} 
													type="output"
													isConfirmed={txIsConfirmed}
												/>
											{/each}
										</div>
									</Card>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Transaction Details - Mobile Only -->
				<div class="d-block">
					<Card title="Transaction Details" icon="fa-info-circle">
						<TransactionDetailsSection 
							{transaction} 
							{txId} 
							isConfirmed={txIsConfirmed} 
							{feeAmount} 
							{totalOutputValue}
						/>
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
				<Card>
					<div slot="header" class="d-flex justify-content-between align-items-center w-100">
						<h5 class="card-title mb-0">
							<i class="fas fa-code me-2"></i>
							Raw Transaction Data
						</h5>
						<div class="ms-auto">
							<CopyButton 
								text={JSON.stringify(transaction, null, 2)}
								label="Copy JSON"
								successMessage="Raw transaction data copied to clipboard!"
								size="small"
							/>
						</div>
					</div>
					<pre class="raw-data"><code>{JSON.stringify(transaction, null, 2)}</code></pre>
				</Card>
			</div>
		</div>
	</div>
</div>
{:else if $monitoredTransaction?.status === 'error'}
	<div class="text-center p-5">
		<i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
		<h4 class="text-muted mb-3">Transaction Not Found</h4>
		<div class="mt-4">
			<a href="/mempool" class="btn btn-outline-primary me-2">
				<i class="fas fa-clock me-1"></i>Check Mempool
			</a>
			<a href="/" class="btn btn-outline-secondary">
				<i class="fas fa-home me-1"></i>Go Home
			</a>
		</div>
	</div>
{:else if $monitoredTransaction?.status === 'dropped'}
	<div class="text-center p-5">
		<i class="fas fa-times-circle fa-3x text-warning mb-3"></i>
		<h4 class="text-warning mb-3">Transaction Dropped</h4>
		<p class="text-muted mb-3">
			This transaction was in the mempool but has been dropped and is no longer pending confirmation.
			{#if $monitoredTransaction.previousStatus}
				<br><small class="text-light">Previous status: {$monitoredTransaction.previousStatus}</small>
			{/if}
		</p>
		<div class="alert alert-warning mt-3">
			<h6><i class="fas fa-info-circle me-2"></i>Common reasons for dropped transactions:</h6>
			<ul class="text-start mb-0">
				<li>Double-spend detected (another transaction spent the same inputs)</li>
				<li>Transaction fee too low for current network conditions</li>
				<li>Network congestion caused timeout</li>
				<li>Invalid transaction format or data</li>
			</ul>
		</div>
		<div class="mt-4">
			<a href="/mempool" class="btn btn-outline-primary me-2">
				<i class="fas fa-clock me-1"></i>Check Mempool
			</a>
			<button class="btn btn-outline-info me-2" onclick={() => window.location.reload()}>
				<i class="fas fa-refresh me-1"></i>Retry Check
			</button>
			<a href="/" class="btn btn-outline-secondary">
				<i class="fas fa-home me-1"></i>Go Home
			</a>
		</div>
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
	:global(.box-link),
	:global(.block-link) {
		color: var(--text-strong);
		text-decoration: none !important;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	:global(.text-link) {
		font-weight: 600;
	}

	:global(.address-link:hover),
	:global(.text-link:hover) {
		color: var(--main-color);
		text-decoration: none !important;
	}

	:global(.box-link:hover),
	:global(.block-link:hover) {
		color: var(--info-color);
		text-decoration: none !important;
	}

	/* Scrollbar styles */
	.raw-data::-webkit-scrollbar {
		width: 4px;
	}

	.raw-data::-webkit-scrollbar-track {
		background: var(--glass-bg-subtle);
		border-radius: 2px;
	}

	.raw-data::-webkit-scrollbar-thumb {
		background: var(--glass-border-medium);
		border-radius: 2px;
	}

	.raw-data::-webkit-scrollbar-thumb:hover {
		background: var(--main-color);
	}

	:global(.index-number) {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
	}

	.tx-id-section {
		padding: 0.5rem 0 0 0;
	}

	.tx-id-display {
		color: var(--text-light);
		font-size: 0.9rem;
		opacity: 0.9;
	}


	.raw-data {
		background: #000000;
		border: 1px solid var(--glass-border-light);
		border-radius: 8px;
		padding: 1rem;
		font-size: 0.8rem;
		max-height: 400px;
		overflow-y: auto;
		margin: 0;
		word-break: break-all;
	}

	.raw-data code {
		color: #ffffff;
		font-family: 'Courier New', Monaco, monospace;
		white-space: pre-wrap;
		background: transparent;
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
	}

	/* Monitoring indicator styles */
	.monitoring-indicator {
		animation: pulse-subtle 2s infinite;
	}

	@keyframes pulse-subtle {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	/* Inputs & Outputs Layout */
	.inputs-outputs-container {
		margin-bottom: 0rem;
	}

	.boxes-list {
		max-height: 600px;
		overflow-y: auto;
		/* padding-right: 0.5rem; */
	}

	.boxes-list::-webkit-scrollbar {
		width: 6px;
	}

	.boxes-list::-webkit-scrollbar-track {
		background: var(--glass-bg-subtle);
		border-radius: 3px;
	}

	.boxes-list::-webkit-scrollbar-thumb {
		background: var(--glass-border-medium);
		border-radius: 3px;
	}

	.boxes-list::-webkit-scrollbar-thumb:hover {
		background: var(--main-color);
	}

	/* Responsive adjustments */
	@media (max-width: 767px) {
		.inputs-outputs-container .row {
			flex-direction: column;
		}

		.inputs-outputs-container .col-md-6 {
			width: 100%;
		}

		.boxes-list {
			max-height: 400px;
		}
	}



</style>