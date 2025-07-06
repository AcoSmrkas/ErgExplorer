<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import ErrorMessage from '$lib/components/ui/ErrorMessage.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import RawDataToggle from '$lib/components/ui/RawDataToggle.svelte';
	import DetailRow from '$lib/components/ui/DetailRow.svelte';
	import StatusBadge from '$lib/components/ui/StatusBadge.svelte';
	import AssetList from '$lib/components/ui/AssetList.svelte';
	import { formatErgValue, formatNumber, formatAddress } from '$lib/utils/formatting.js';
	import { API_ENDPOINTS } from '$lib/utils/constants.js';
	import { isTestnet } from '$lib/stores/network.svelte.js';
	import { useAsyncData } from '$lib/composables/useAsyncData.js';

	let boxId = $page.params.id;
	let showRawData = false;

	// Use composables for data management
	const { data: boxData, loading, error, fetchData } = useAsyncData();

	async function loadBoxData() {
		return fetchData(async () => {
			// Try confirmed box first using ErgoplatformAPI
			let boxUrl = `${API_ENDPOINTS.ERGOPLATFORM}boxes/${boxId}`;
			if (isTestnet()) {
				boxUrl = `https://api-testnet.ergoplatform.com/api/v1/boxes/${boxId}`;
			}

			let response = await fetch(boxUrl);
			
			if (!response.ok) {
				// Try unconfirmed/mempool box
				boxUrl = `${API_ENDPOINTS.ERGOPLATFORM_BASE}boxes/unconfirmed/${boxId}`;
				if (isTestnet()) {
					boxUrl = `https://api-testnet.ergoplatform.com/boxes/unconfirmed/${boxId}`;
				}
				response = await fetch(boxUrl);
				
				if (!response.ok) {
					throw new Error('Box not found');
				}
			}

			return await response.json();
		}, 'Failed to load box data');
	}

	function getBoxStatus() {
		if (!$boxData) return '';
		if ($boxData.spentTransactionId) return 'Spent';
		if ($boxData.mainChain === false) return 'Unconfirmed';
		return 'Unspent';
	}

	function getStatusType() {
		const status = getBoxStatus();
		switch (status) {
			case 'Spent': return 'danger';
			case 'Unconfirmed': return 'warning';
			case 'Unspent': return 'success';
			default: return 'default';
		}
	}

	onMount(() => {
		loadBoxData();
	});
</script>

<svelte:head>
	<title>Box {boxId ? formatAddress(boxId, 8, 4) : 'Details'} - Erg Explorer</title>
	<meta name="description" content="View details for Ergo box {boxId || 'N/A'}">
</svelte:head>

<div class="container-fluid p-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<PageHeader 
				title="Box Details" 
				icon="fa-cube" 
			/>

			{#if $loading}
				<Loading text="Loading box..." />
			{:else if $error}
				<ErrorMessage message={$error} type="danger" dismissible />
			{:else if $boxData}
				<!-- Box Header Card -->
				<Card title="Box ID" headerClass="flex-between">
					<div slot="header">
						<h3 class="section-title mb-0">Box ID</h3>
						<div class="d-flex align-items-center gap-2">
							<StatusBadge status={getBoxStatus()} type={getStatusType()} />
							<CopyButton 
								text={$boxData.boxId || boxId} 
								label="Copy Box ID" 
								successMessage="Box ID copied to clipboard!"
							/>
						</div>
					</div>
					<div class="box-id-display">
						<span class="d-none d-md-inline font-monospace">{$boxData.boxId || boxId}</span>
						<span class="d-md-none font-monospace">{formatAddress($boxData.boxId || boxId, 12, 8)}</span>
					</div>
				</Card>

				<!-- Box Information -->
				<Card title="Box Information" icon="fa-info-circle">
					<div class="info-grid">
						<DetailRow 
							label="Value" 
							value="{formatErgValue($boxData.value || 0)} ERG" 
						/>
						
						{#if $boxData.creationHeight}
							<DetailRow 
								label="Creation Height" 
								value={formatNumber($boxData.creationHeight)}
								href="/blocks/{$boxData.creationHeight}"
								dataAttribute="data-block-id"
								dataValue={$boxData.creationHeight}
							/>
						{/if}

						{#if $boxData.settlementHeight}
							<DetailRow 
								label="Settlement Height" 
								value={formatNumber($boxData.settlementHeight)}
								href="/blocks/{$boxData.settlementHeight}"
								dataAttribute="data-block-id"
								dataValue={$boxData.settlementHeight}
							/>
						{/if}

						{#if $boxData.index !== undefined}
							<DetailRow 
								label="Index" 
								value={formatNumber($boxData.index)}
							/>
						{/if}

						{#if $boxData.globalIndex}
							<DetailRow 
								label="Global Index" 
								value={formatNumber($boxData.globalIndex)}
							/>
						{/if}

						{#if $boxData.transactionId}
							<DetailRow 
								label="Transaction" 
								value={formatAddress($boxData.transactionId, 9, 4)}
								href="/transactions/{$boxData.transactionId}"
								dataAttribute="data-transaction-id"
								dataValue={$boxData.transactionId}
								monospace={true}
							/>
						{/if}

						{#if $boxData.blockId}
							<DetailRow 
								label="Block" 
								value={formatAddress($boxData.blockId, 9, 4)}
								href="/blocks/{$boxData.blockId}"
								dataAttribute="data-block-id"
								dataValue={$boxData.blockId}
								monospace={true}
							/>
						{/if}

						{#if $boxData.spentTransactionId}
							<DetailRow 
								label="Spent In" 
								value={formatAddress($boxData.spentTransactionId, 9, 4)}
								href="/transactions/{$boxData.spentTransactionId}"
								dataAttribute="data-transaction-id"
								dataValue={$boxData.spentTransactionId}
								monospace={true}
							/>
						{/if}
					</div>
				</Card>

				<!-- Address Information -->
				{#if $boxData.address}
					<Card title="Address" icon="fa-wallet">
						<AddressLink 
							address={$boxData.address} 
							startChars={15} 
							endChars={6} 
							showCopy={true}
						/>
					</Card>
				{/if}

				<!-- Assets -->
				<Card title="Assets" count={$boxData.assets?.length || 0} icon="fa-coins">
					<AssetList assets={$boxData.assets || []} />
				</Card>

				<!-- ErgoTree -->
				<Card title="ErgoTree" icon="fa-code">
					<div class="ergo-tree-section">
						{#if $boxData.ergoTreeScript}
							<div class="mb-3">
								<h6 class="text-light mb-2">Script:</h6>
								<code class="script-display">{$boxData.ergoTreeScript}</code>
							</div>
						{/if}
						<div>
							<h6 class="text-light mb-2">Raw ErgoTree:</h6>
							<code class="ergotree-display">{$boxData.ergoTree}</code>
						</div>
					</div>
				</Card>

				<!-- Additional Registers -->
				{#if $boxData.additionalRegisters && Object.keys($boxData.additionalRegisters).length > 0}
					<Card title="Additional Registers" icon="fa-list" count={Object.keys($boxData.additionalRegisters).length}>
						<div class="registers-list">
							{#each Object.entries($boxData.additionalRegisters) as [key, value]}
								<div class="register-item">
									<span class="register-key">{key}:</span>
									<code class="register-value">{value}</code>
								</div>
							{/each}
						</div>
					</Card>
				{/if}

				<!-- Raw Data -->
				<RawDataToggle 
					data={$boxData} 
					bind:showRawData 
					title="Raw Box Data"
				/>
			{/if}
		</div>
	</div>
</div>

<div class="page-bottom-margin"></div>

<style>
	.box-id-display {
		word-break: break-all;
		font-size: 1.1rem;
		color: var(--text-strong);
		line-height: 1.4;
	}

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.ergo-tree-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.script-display,
	.ergotree-display {
		display: block;
		background: var(--glass-bg-subtle);
		padding: 1rem;
		border-radius: 6px;
		border: 1px solid var(--glass-border-light);
		word-break: break-all;
		font-size: 0.9rem;
		color: var(--text-strong);
		line-height: 1.4;
	}

	.registers-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.register-item {
		display: flex;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--glass-bg-light);
		border-radius: 6px;
		border: 1px solid var(--glass-border-light);
	}

	.register-key {
		font-weight: 600;
		color: var(--text-light);
		min-width: 60px;
		flex-shrink: 0;
	}

	.register-value {
		color: var(--text-strong);
		word-break: break-all;
		flex: 1;
	}

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.register-item {
			flex-direction: column;
			gap: 0.5rem;
		}

		.register-key {
			min-width: auto;
		}
	}
</style>