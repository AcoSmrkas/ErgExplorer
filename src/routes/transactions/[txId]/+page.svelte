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
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import TransactionDetailsSection from '$lib/components/transaction/TransactionDetailsSection.svelte';
	import MobileTransactionCard from '$lib/components/transaction/MobileTransactionCard.svelte';
	import AssetsList from '$lib/components/transaction/AssetsList.svelte';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { usePrices } from '$lib/composables/useAsyncData.js';
	import { 
		calculateFee, 
		calculateBurnedAssets, 
		getBoxStatus, 
		getStatusType, 
		getInfoText,
		calculateTotalInputValue,
		calculateTotalOutputValue
	} from '$lib/utils/transactionHelpers.js';
    import { formatValue } from '$lib/utils/numberFormatting.js';
    import { currentPrices } from '$lib/stores/priceStore.js';
    import { tokenIconsStore } from '$lib/stores/tokenIconsStore.js';

	export let data;
	$: ({ transaction, txId } = data);
	
	// Use composable for price data
	const { ergPrice, loadPrices } = usePrices();
	
	

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
			component: AssetsList,
			componentProps: (row) => ({
				assets: row.assets
			})
		}
	];

	onMount(async () => {
		await loadPrices();
	});


	// Calculate transaction metrics
	$: totalInputValue = calculateTotalInputValue(transaction);
	$: totalOutputValue = calculateTotalOutputValue(transaction);
	$: feeAmount = calculateFee(transaction);
	$: isConfirmed = transaction?.inclusionHeight > 0;
	$: burnedAssets = calculateBurnedAssets(transaction);
	$: infoText = getInfoText(transaction, isConfirmed);
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
					info={infoText}
					timestamp={isConfirmed ? transaction?.timestamp : null}
					statusBadge={!isConfirmed ? { text: 'Pending', type: 'warning' } : null}
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
									<div class="col-12 p-0 p-md-4">
										<TransactionDetailsSection 
											{transaction} 
											{txId} 
											{isConfirmed} 
											{feeAmount} 
											{totalOutputValue} 
											ergPrice={$ergPrice} 
										/>
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
								<MobileTransactionCard 
									item={input} 
									{index} 
									{getBoxStatus} 
									{getStatusType} 
									type="input"
								/>
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
								<MobileTransactionCard 
									item={output} 
									{index} 
									{getBoxStatus} 
									{getStatusType} 
									type="output"
								/>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Transaction Details - Mobile Only -->
				<div class="d-md-none">
					<Card title="Transaction Details" icon="fa-info-circle">
						<TransactionDetailsSection 
							{transaction} 
							{txId} 
							{isConfirmed} 
							{feeAmount} 
							{totalOutputValue} 
							ergPrice={$ergPrice} 
							mobile={true}
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
		
		
	}



</style>