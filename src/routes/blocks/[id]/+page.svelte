<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getBlock, getPrices } from '$lib/utils/api.js';
	import { formatErgValue, formatDateString, formatNumber, formatFileSize, formatDifficulty, formatPriceUSD } from '$lib/utils/formatting.js';

	let blockId = $page.params.id;
	let block = null;
	let loading = true;
	let error = null;
	let ergPrice = null;
	let showRawData = false;
	
	const txHeaders = [
		{ 
			label: 'Transaction ID', 
			field: 'id',
			render: (value) => `<a href="/transactions/${value}" class="fw-bold font-monospace">${value.slice(0, 16)}...</a>` 
		},
		{ 
			label: 'Inputs', 
			field: 'inputsCount',
			render: (value) => formatNumber(value || 0)
		},
		{ 
			label: 'Outputs', 
			field: 'outputsCount',
			render: (value) => formatNumber(value || 0)
		},
		{ 
			label: 'Size', 
			field: 'size',
			render: (value) => formatFileSize(value)
		}
	];

	onMount(async () => {
		await Promise.all([loadBlock(), loadPrices()]);
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadBlock() {
		try {
			loading = true;
			error = null;
			
			const data = await getBlock(blockId);
			block = data;
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load block:', err);
		} finally {
			loading = false;
		}
	}

	async function copyBlockId() {
		try {
			await navigator.clipboard.writeText(blockId);
			
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
		} catch (err) {
			console.error('Failed to copy block ID:', err);
		}
	}
</script>

<svelte:head>
	<title>Block {block?.height || blockId.slice(0, 16)} - Erg Explorer</title>
	<meta name="description" content="View block details, transactions, and miner information for Ergo block {blockId}">
</svelte:head>

{#if loading}
	<Loading text="Loading block details..." />
{:else if error}
	<ErrorMessage message={error} type="danger" />
{:else if block}
	<div class="col-md-12">
		<div class="row w-100">
			<div class="col-md-12 mb-3 mb-md-4">
				<h2 class="m-0">Block {formatNumber(block.height)}</h2>
			</div>
		</div>

		<!-- Block Summary -->
		<div class="card mb-4">
			<div class="card-header">
				<h5 class="card-title mb-0">
					<i class="fas fa-cube me-2"></i>
					Block Details
				</h5>
			</div>
			<div class="card-body">
				<div class="row">
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Height:</strong></td>
									<td>{formatNumber(block.height)}</td>
								</tr>
								<tr>
									<td><strong>Block ID:</strong></td>
									<td>
										<button 
											class="btn-link text-decoration-none p-0 border-0 bg-transparent font-monospace"
											onclick={copyBlockId}
											title="Click to copy block ID"
										>
											{block.id}
										</button>
									</td>
								</tr>
								<tr>
									<td><strong>Timestamp:</strong></td>
									<td>{formatDateString(block.timestamp)}</td>
								</tr>
								<tr>
									<td><strong>Transactions:</strong></td>
									<td>{formatNumber(block.transactionsCount)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Miner:</strong></td>
									<td>
										<a href="/addresses/{block.miner.address}" class="font-monospace">
											{block.miner.name || `${block.miner.address.slice(0, 12)}...`}
										</a>
									</td>
								</tr>
								<tr>
									<td><strong>Reward:</strong></td>
									<td class="text-success">
										{formatErgValue(block.minerReward)} ERG
										{#if ergPrice}
											<br><small class="text-muted">{formatPriceUSD(block.minerReward, ergPrice)}</small>
										{/if}
									</td>
								</tr>
								<tr>
									<td><strong>Difficulty:</strong></td>
									<td>{formatDifficulty(block.difficulty)}</td>
								</tr>
								<tr>
									<td><strong>Size:</strong></td>
									<td>{formatFileSize(block.size)}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>

		<!-- Block Stats -->
		<div class="row mb-4">
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Height</h6>
						<h4 class="text-primary">{formatNumber(block.height)}</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Transactions</h6>
						<h4 class="text-info">{formatNumber(block.transactionsCount)}</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Reward</h6>
						<h4 class="text-success">{formatErgValue(block.minerReward)} ERG</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Difficulty</h6>
						<h4 class="text-warning">{formatDifficulty(block.difficulty)}</h4>
					</div>
				</div>
			</div>
		</div>

		<!-- Navigation -->
		<div class="row mb-4">
			<div class="col-12">
				<div class="d-flex justify-content-between">
					{#if block.height > 1}
						<a href="/blocks/{block.height - 1}" class="btn btn-outline-primary">
							<i class="fas fa-chevron-left me-1"></i>
							Previous Block
						</a>
					{:else}
						<span></span>
					{/if}
					
					<a href="/blocks/{block.height + 1}" class="btn btn-outline-primary">
						Next Block
						<i class="fas fa-chevron-right ms-1"></i>
					</a>
				</div>
			</div>
		</div>

		<!-- Transactions -->
		{#if block.blockTransactions?.length > 0}
			<div class="card mb-4">
				<div class="card-header">
					<h5 class="card-title mb-0">
						<i class="fas fa-exchange-alt me-2"></i>
						Transactions ({block.blockTransactions.length})
					</h5>
				</div>
				<div class="card-body p-0">
					<DataTable 
						headers={txHeaders} 
						data={block.blockTransactions} 
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
					Raw Block Data
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
					<pre class="bg-dark text-light p-3 rounded font-monospace small overflow-auto">{JSON.stringify(block, null, 2)}</pre>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<ErrorMessage message="Block not found" type="warning" />
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

	.text-primary {
		color: var(--main-color) !important;
	}

	.text-info {
		color: #17a2b8 !important;
	}

	.text-success {
		color: #28a745 !important;
	}

	.text-warning {
		color: #ffc107 !important;
	}

	h2 {
		color: var(--bs-body-color);
		font-weight: 600;
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

	.btn-outline-primary {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	.btn-outline-primary:hover {
		background-color: var(--main-color);
		border-color: var(--main-color);
		color: white;
	}
</style>