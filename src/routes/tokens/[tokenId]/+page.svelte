<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import DataTable from '$lib/components/data/DataTable.svelte';
	import TokenDisplay from '$lib/components/data/TokenDisplay.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import { getToken, getPrices } from '$lib/utils/api.js';
	import { formatTokenAmount, formatDateString, formatNumber } from '$lib/utils/formatting.js';

	let tokenId = $page.params.tokenId;
	let token = null;
	let loading = true;
	let error = null;
	let ergPrice = null;
	let showRawData = false;
	
	const holderHeaders = [
		{ 
			label: 'Address', 
			field: 'address',
			render: (value) => `<a href="/addresses/${value}" class="font-monospace">${value.slice(0, 12)}...${value.slice(-12)}</a>`
		},
		{ 
			label: 'Balance', 
			field: 'balance',
			render: (value) => formatTokenAmount(value, token?.decimals || 0)
		},
		{ 
			label: 'Percentage', 
			field: 'percentage',
			render: (value) => `${(value * 100).toFixed(2)}%`
		}
	];

	onMount(async () => {
		await Promise.all([loadToken(), loadPrices()]);
	});

	async function loadPrices() {
		try {
			const priceData = await getPrices();
			ergPrice = priceData?.price || null;
		} catch (err) {
			console.warn('Failed to load prices:', err);
		}
	}

	async function loadToken() {
		try {
			loading = true;
			error = null;
			
			const data = await getToken(tokenId);
			token = data;
			
		} catch (err) {
			error = err.message;
			console.error('Failed to load token:', err);
		} finally {
			loading = false;
		}
	}

	async function copyTokenId() {
		try {
			await navigator.clipboard.writeText(tokenId);
			
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
		} catch (err) {
			console.error('Failed to copy token ID:', err);
		}
	}

	$: isNFT = token?.decimals === 0 && token?.emissionAmount === '1';
	$: totalSupply = formatTokenAmount(token?.emissionAmount || '0', token?.decimals || 0);
</script>

<svelte:head>
	<title>Token {token?.name || tokenId.slice(0, 16)} - Erg Explorer</title>
	<meta name="description" content="View token details, metadata, and holder information for {token?.name || 'Ergo token'} {tokenId}">
</svelte:head>

{#if loading}
	<Loading text="Loading token details..." />
{:else if error}
	<ErrorMessage message={error} type="danger" />
{:else if token}
	<div class="col-md-12">
		<div class="row w-100">
			<div class="col-md-12 mb-3 mb-md-4">
				<h2 class="m-0 d-flex align-items-center">
					<img src="/images/logo-new.png" alt="Token" class="token-icon me-3" width="40" height="40">
					{token.name || 'Unnamed Token'}
					<span class="badge {isNFT ? 'bg-info' : 'bg-success'} ms-2">
						{isNFT ? 'NFT' : 'Token'}
					</span>
				</h2>
			</div>
		</div>

		<!-- Token Summary -->
		<div class="card mb-4">
			<div class="card-header">
				<h5 class="card-title mb-0">
					<i class="fas fa-coins me-2"></i>
					Token Details
				</h5>
			</div>
			<div class="card-body">
				<div class="row">
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Name:</strong></td>
									<td>{token.name || 'Unnamed Token'}</td>
								</tr>
								<tr>
									<td><strong>Token ID:</strong></td>
									<td>
										<button 
											class="btn-link text-decoration-none p-0 border-0 bg-transparent font-monospace"
											onclick={copyTokenId}
											title="Click to copy token ID"
										>
											{tokenId}
										</button>
									</td>
								</tr>
								<tr>
									<td><strong>Type:</strong></td>
									<td>
										<span class="badge {isNFT ? 'bg-info' : 'bg-success'}">
											{isNFT ? 'NFT' : 'Fungible Token'}
										</span>
									</td>
								</tr>
								<tr>
									<td><strong>Decimals:</strong></td>
									<td>{formatNumber(token.decimals)}</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="col-lg-6">
						<table class="table table-sm">
							<tbody>
								<tr>
									<td><strong>Total Supply:</strong></td>
									<td class="text-primary">{totalSupply}</td>
								</tr>
								<tr>
									<td><strong>Created:</strong></td>
									<td>{formatDateString(token.createdAt)}</td>
								</tr>
								<tr>
									<td><strong>Box ID:</strong></td>
									<td>
										{#if token.boxId}
											<a href="/boxes/{token.boxId}" class="font-monospace">
												{token.boxId.slice(0, 16)}...
											</a>
										{:else}
											—
										{/if}
									</td>
								</tr>
								<tr>
									<td><strong>Emission Box:</strong></td>
									<td>
										{#if token.emissionBoxId}
											<a href="/boxes/{token.emissionBoxId}" class="font-monospace">
												{token.emissionBoxId.slice(0, 16)}...
											</a>
										{:else}
											—
										{/if}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				{#if token.description}
					<div class="mt-3">
						<h6><strong>Description:</strong></h6>
						<p class="text-muted">{token.description}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Token Stats -->
		<div class="row mb-4">
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Total Supply</h6>
						<h4 class="text-primary">{totalSupply}</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Decimals</h6>
						<h4 class="text-info">{formatNumber(token.decimals)}</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Holders</h6>
						<h4 class="text-success">{formatNumber(token.holders?.length || 0)}</h4>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="card h-100">
					<div class="card-body text-center">
						<h6 class="card-title">Type</h6>
						<h5>
							<span class="badge {isNFT ? 'bg-info' : 'bg-success'} fs-6">
								{isNFT ? 'NFT' : 'Token'}
							</span>
						</h5>
					</div>
				</div>
			</div>
		</div>

		<!-- NFT Metadata (if applicable) -->
		{#if isNFT && token.metadata}
			<div class="card mb-4">
				<div class="card-header">
					<h5 class="card-title mb-0">
						<i class="fas fa-image me-2"></i>
						NFT Metadata
					</h5>
				</div>
				<div class="card-body">
					<div class="row">
						{#if token.metadata.image}
							<div class="col-md-4">
								<img 
									src={token.metadata.image} 
									alt={token.name || 'NFT'}
									class="img-fluid rounded"
									style="max-height: 300px;"
								>
							</div>
						{/if}
						<div class="col-md-8">
							{#if token.metadata.attributes}
								<h6><strong>Attributes:</strong></h6>
								<div class="row">
									{#each token.metadata.attributes as attr}
										<div class="col-md-6 mb-2">
											<span class="badge bg-secondary me-1">{attr.trait_type}:</span>
											{attr.value}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Holders -->
		{#if token.holders && token.holders.length > 0}
			<div class="card mb-4">
				<div class="card-header">
					<h5 class="card-title mb-0">
						<i class="fas fa-users me-2"></i>
						Top Holders ({token.holders.length})
					</h5>
				</div>
				<div class="card-body p-0">
					<DataTable 
						headers={holderHeaders} 
						data={token.holders.slice(0, 20)} 
						loading={false}
						sortable={true}
					/>
				</div>
			</div>
		{/if}

		<!-- Raw Data -->
		<div class="card">
			<div class="card-header d-flex justify-content-between align-items-center">
				<h5 class="card-title mb-0">
					<i class="fas fa-code me-2"></i>
					Raw Token Data
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
					<pre class="bg-dark text-light p-3 rounded font-monospace small overflow-auto">{JSON.stringify(token, null, 2)}</pre>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<ErrorMessage message="Token not found" type="warning" />
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

	.token-icon {
		border-radius: 50%;
		object-fit: cover;
		background-color: var(--bs-light);
	}

	.badge {
		font-size: 0.75rem;
	}

	.bg-info {
		background-color: var(--info-color) !important;
	}

	.bg-success {
		background-color: #28a745 !important;
	}

	.bg-secondary {
		background-color: #6c757d !important;
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