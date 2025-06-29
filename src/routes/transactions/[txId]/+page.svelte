<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import AddressFormatter from '$lib/components/data/AddressFormatter.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getTransaction, getPrices } from '$lib/utils/api.js';
	import { formatErgValue, formatDateString, formatNumber, formatFileSize, formatPriceUSD } from '$lib/utils/formatting.js';

	let txId = $page.params.txId;
	let transaction = null;
	let loading = true;
	let error = null;
	let ergPrice = null;
	let showRawData = false;
	
	const inputHeaders = [
		{ 
			label: 'Box ID', 
			field: 'boxId',
			render: (value) => `<a href="/boxes/${value}" class="font-monospace">${value.slice(0, 16)}...</a>` 
		},
		{ 
			label: 'Address', 
			field: 'address',
			render: (value) => `<span class="address-cell" data-address="${value}"></span>`
		},
		{ 
			label: 'Value', 
			field: 'value',
			render: (value) => `${formatErgValue(value)} ERG`
		},
		{ 
			label: 'Assets', 
			field: 'assets',
			render: (value) => value?.length ? `${value.length} assets` : '—'
		}
	];

	const outputHeaders = [
		{ 
			label: 'Box ID', 
			field: 'boxId',
			render: (value) => `<a href="/boxes/${value}" class="font-monospace">${value.slice(0, 16)}...</a>` 
		},
		{ 
			label: 'Address', 
			field: 'address',
			render: (value) => `<span class="address-cell" data-address="${value}"></span>`
		},
		{ 
			label: 'Value', 
			field: 'value',
			render: (value) => `${formatErgValue(value)} ERG`
		},
		{ 
			label: 'Assets', 
			field: 'assets',
			render: (value) => value?.length ? `${value.length} assets` : '—'
		}
	];

	onMount(async () => {
		await Promise.all([loadTransaction(), loadPrices()]);
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadTransaction() {
		try {
			loading = true;
			error = null;
			
			const data = await getTransaction(txId);
			transaction = data;
			
			// Enhance address cells after render
			setTimeout(() => enhanceAddressCells(), 100);
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load transaction:', err);
		} finally {
			loading = false;
		}
	}

	function enhanceAddressCells() {
		const addressCells = document.querySelectorAll('.address-cell');
		addressCells.forEach(cell => {
			const address = cell.dataset.address;
			if (address) {
				cell.innerHTML = `
					<a href="/addresses/${address}" class="font-monospace">
						${address.slice(0, 12)}...${address.slice(-12)}
					</a>
				`;
			}
		});
	}

	async function copyTxId() {
		try {
			await navigator.clipboard.writeText(txId);
			
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
		} catch (err) {
			console.error('Failed to copy transaction ID:', err);
		}
	}

	$: totalInputValue = transaction?.inputs?.reduce((sum, input) => sum + (parseInt(input.value) || 0), 0) || 0;
	$: totalOutputValue = transaction?.outputs?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
	$: feeAmount = totalInputValue - totalOutputValue;
	$: isConfirmed = transaction?.inclusionHeight > 0;
</script>

<svelte:head>
	<title>Transaction {txId.slice(0, 16)}... - Erg Explorer</title>
	<meta name="description" content="View transaction details, inputs, outputs, and fees for Ergo transaction {txId}">
</svelte:head>

{#if loading}
	<Loading text="Loading transaction details..." />
{:else if error}
	<ErrorMessage message={error} type="danger" />
{:else if transaction}
	<div class="col-md-12">
		<div class="row w-100">
			<div class="col-md-12 mb-3 mb-md-4">
				<h2 class="m-0">Transaction</h2>
			</div>
		</div>

		<!-- Transaction Summary -->
		<div class="card mb-4">
			<div class="card-header">
				<h5 class="card-title mb-0">
					<i class="fas fa-exchange-alt me-2"></i>
					Transaction Details
				</h5>
			</div>
			<div class="card-body">
				<div class="row">
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Transaction ID:</strong></td>
									<td>
										<button 
											class="btn-link text-decoration-none p-0 border-0 bg-transparent font-monospace"
											onclick={copyTxId}
											title="Click to copy transaction ID"
										>
											{txId}
										</button>
									</td>
								</tr>
								<tr>
									<td><strong>Status:</strong></td>
									<td>
										{#if isConfirmed}
											<span class="badge bg-success">Confirmed</span>
										{:else}
											<span class="badge bg-warning">Pending</span>
										{/if}
									</td>
								</tr>
								<tr>
									<td><strong>Block Height:</strong></td>
									<td>
										{#if transaction.inclusionHeight}
											<a href="/blocks/{transaction.inclusionHeight}">{formatNumber(transaction.inclusionHeight)}</a>
										{:else}
											Pending
										{/if}
									</td>
								</tr>
								<tr>
									<td><strong>Timestamp:</strong></td>
									<td>{formatDateString(transaction.timestamp)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Fee:</strong></td>
									<td class="text-warning">
										{formatErgValue(feeAmount)} ERG
										{#if ergPrice}
											<br><small class="text-muted">{formatPriceUSD(feeAmount, ergPrice)}</small>
										{/if}
									</td>
								</tr>
								<tr>
									<td><strong>Size:</strong></td>
									<td>{formatFileSize(transaction.size)}</td>
								</tr>
								<tr>
									<td><strong>Inputs:</strong></td>
									<td>{formatNumber(transaction.inputs?.length || 0)}</td>
								</tr>
								<tr>
									<td><strong>Outputs:</strong></td>
									<td>{formatNumber(transaction.outputs?.length || 0)}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<!-- Value Summary -->
		<div class="row mb-4">
			<div class="col-md-4">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title text-success">Total Input</h6>
						<h4 class="text-success">{formatErgValue(totalInputValue)} ERG</h4>
						{#if ergPrice}
							<small class="text-muted">{formatPriceUSD(totalInputValue, ergPrice)}</small>
						{/if}
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title text-primary">Total Output</h6>
						<h4 class="text-primary">{formatErgValue(totalOutputValue)} ERG</h4>
						{#if ergPrice}
							<small class="text-muted">{formatPriceUSD(totalOutputValue, ergPrice)}</small>
						{/if}
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title text-warning">Fee</h6>
						<h4 class="text-warning">{formatErgValue(feeAmount)} ERG</h4>
						{#if ergPrice}
							<small class="text-muted">{formatPriceUSD(feeAmount, ergPrice)}</small>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Inputs -->
		{#if transaction.inputs?.length > 0}
			<div class="card mb-4">
				<div class="card-header">
					<h5 class="card-title mb-0">
						<i class="fas fa-sign-in-alt me-2"></i>
						Inputs ({transaction.inputs.length})
					</h5>
				</div>
				<div class="card-body p-0">
					<DataTable 
						headers={inputHeaders} 
						data={transaction.inputs} 
						loading={false}
						sortable={false}
					/>
				</div>
			</div>
		{/if}

		<!-- Outputs -->
		{#if transaction.outputs?.length > 0}
			<div class="card mb-4">
				<div class="card-header">
					<h5 class="card-title mb-0">
						<i class="fas fa-sign-out-alt me-2"></i>
						Outputs ({transaction.outputs.length})
					</h5>
				</div>
				<div class="card-body p-0">
					<DataTable 
						headers={outputHeaders} 
						data={transaction.outputs} 
						loading={false}
						sortable={false}
					/>
				</div>
			</div>
		{/if}

		<!-- Raw Data -->
		<div class="card">
			<div class="card-header d-flex justify-content-between align-items-center">
				<h5 class="card-title mb-0">
					<i class="fas fa-code me-2"></i>
					Raw Transaction Data
				</h5>
				<button 
					class="btn btn-outline-light btn-sm"
					onclick={() => showRawData = !showRawData}
				>
					{showRawData ? 'Hide' : 'Show'} Raw Data
				</button>
			</div>
			{#if showRawData}
				<div class="card-body">
					<pre class="bg-dark text-light p-3 rounded font-monospace small overflow-auto">{JSON.stringify(transaction, null, 2)}</pre>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<ErrorMessage message="Transaction not found" type="warning" />
{/if}

<style>
	.card {
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		border-radius: 12px;
		overflow: hidden;
	}

	.card-header {
		background: linear-gradient(135deg, var(--main-color) 0%, rgba(34, 127, 158, 0.1) 100%);
		color: white;
		border: none;
	}

	.btn-link:hover {
		color: var(--main-color) !important;
	}

	h2 {
		color: var(--bs-body-color);
		font-weight: 600;
	}

	.badge {
		font-size: 0.75rem;
	}

	.bg-success {
		background-color: #28a745 !important;
	}

	.bg-warning {
		background-color: #ffc107 !important;
		color: #000 !important;
	}

	.table td {
		vertical-align: middle;
		border-color: var(--bs-border-color-translucent);
	}

	pre {
		max-height: 400px;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.btn-outline-light {
		border-color: rgba(255, 255, 255, 0.5);
		color: white;
	}

	.btn-outline-light:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: white;
		color: white;
	}
</style>