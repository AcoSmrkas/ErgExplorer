<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import StatsGrid from '$lib/components/ui/StatsGrid.svelte';
	import RawDataToggle from '$lib/components/ui/RawDataToggle.svelte';
	import { getBlock } from '$lib/utils/api.js';
	import { formatErgValue, formatDateString, formatNumber, formatFileSize, formatDifficulty, formatPriceUSD } from '$lib/utils/formatting.js';
	import { useAsyncData, usePrices } from '$lib/composables/useAsyncData.js';
	import { useClipboard } from '$lib/composables/useClipboard.js';

	let blockId = $page.params.id;
	
	// Use composables for data management
	const { data: block, loading, error, fetchData } = useAsyncData();
	const { ergPrice, loadPrices } = usePrices();
	const { copyBlockId } = useClipboard();
	
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

	// Computed properties for stats grid
	$: stats = $block ? [
		{
			label: 'Height',
			value: formatNumber($block.height, 0, true),
			icon: 'fa-layer-group',
			color: 'primary'
		},
		{
			label: 'Transactions',
			value: formatNumber($block.transactionsCount || 0),
			icon: 'fa-exchange-alt',
			color: 'info'
		},
		{
			label: 'Size',
			value: formatFileSize($block.size),
			icon: 'fa-file',
			color: 'warning'
		},
		{
			label: 'Difficulty',
			value: formatDifficulty($block.difficulty),
			icon: 'fa-chart-line',
			color: 'success'
		}
	] : [];

	onMount(async () => {
		await Promise.all([
			fetchData(() => getBlock(blockId), 'Failed to load block'),
			loadPrices()
		]);
	});
</script>

<svelte:head>
	<title>Block {$block?.height || blockId.slice(0, 16)} - Erg Explorer</title>
	<meta name="description" content="View block details, transactions, and miner information for Ergo block {blockId}">
</svelte:head>

{#if $loading}
	<Loading text="Loading block details..." />
{:else if $error}
	<ErrorMessage message={$error} type="danger" />
{:else if $block}
	<div class="col-md-12">
		<div class="row w-100">
			<div class="col-md-12 mb-3 mb-md-4">
				<h2 class="m-0">Block {formatNumber($block.height)}</h2>
			</div>
		</div>

		<!-- Block Stats Grid -->
		<StatsGrid {stats} />

		<!-- Block Summary -->
		<Card title="Block Details" icon="fa-cube">
			<div class="flex-between mb-3">
				<h6 class="mb-0">Basic Information</h6>
				<button 
					class="copy-btn"
					onclick={() => copyBlockId($block.id)}
					title="Copy block ID"
				>
					<i class="fas fa-copy"></i>
				</button>
			</div>
			<div class="row">
				<div class="col-lg-6">
					<table class="table table-sm">
						<tbody>
							<tr>
								<td><strong>Height:</strong></td>
								<td>{formatNumber($block.height)}</td>
							</tr>
							<tr>
								<td><strong>Block ID:</strong></td>
								<td>
									<span class="font-monospace text-truncate-custom" title={$block.id}>
										{$block.id}
									</span>
								</td>
							</tr>
							<tr>
								<td><strong>Timestamp:</strong></td>
								<td>{formatDateString($block.timestamp)}</td>
							</tr>
							<tr>
								<td><strong>Transactions:</strong></td>
								<td>{formatNumber($block.transactionsCount)}</td>
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
									<a href="/addresses/{$block.miner.address}" class="font-monospace">
										{$block.miner.name || `${$block.miner.address.slice(0, 12)}...`}
									</a>
								</td>
							</tr>
							<tr>
								<td><strong>Reward:</strong></td>
								<td class="text-success">
									{formatErgValue($block.minerReward)} ERG
									{#if $ergPrice}
										<br><small class="text-muted">{formatPriceUSD($block.minerReward, $ergPrice)}</small>
									{/if}
								</td>
							</tr>
							<tr>
								<td><strong>Difficulty:</strong></td>
								<td>{formatDifficulty($block.difficulty)}</td>
							</tr>
							<tr>
								<td><strong>Size:</strong></td>
								<td>{formatFileSize($block.size)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</Card>


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
		{#if $block.blockTransactions?.length > 0}
			<Card 
				title="Transactions" 
				icon="fa-exchange-alt" 
				count={$block.blockTransactions.length}
				noPadding={true}
			>
				<DataTable 
					headers={txHeaders} 
					data={$block.blockTransactions} 
					loading={false}
					sortable={false}
				/>
			</Card>
		{/if}

		<!-- Raw Data -->
		<RawDataToggle data={$block} title="Raw Block Data" />
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
		color: var(--info-color) !important;
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
</style>