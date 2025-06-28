<script>
	import DataTable from '$lib/components/data/DataTable.svelte';
	import TokenCard from './TokenCard.svelte';
	import Loading from '$lib/components/ui/Loading.svelte';
	import { formatTokenAmount, formatAddress } from '$lib/utils/formatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { getTokenTypeIcon, getTokenTypeLabel, formatDescription } from '$lib/utils/tokenHelpers.js';

	export let tokens = [];
	export let loading = false;
	export let emptyMessage = 'No tokens found matching your criteria';

	function renderTokenCell(token) {
		const imageHtml = token.cachedurl 
			? `<img src="${token.cachedurl}" alt="${token.name || 'NFT'}" class="token-nft-image me-2" style="width: 32px; height: 32px; border-radius: 6px; object-fit: cover;" onerror="this.style.display='none'"/>` 
			: (token.iconurl && !token.cachedurl)
				? `<img src="${token.iconurl}" alt="${token.name || 'Token'}" class="token-icon-image me-2" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'"/>` 
				: '';
		
		const assetTitle = getAssetTitleParams(token.detail, token.id, token.name, true);
		const tokenId = `<div class="token-id" style="font-family: monospace; font-size: 0.75rem; color: var(--text-light); margin-top: 0.25rem;">${formatAddress(token.id, 15, 4)}</div>`;
		const ticker = token.ticker && token.ticker !== token.name 
			? `<div class="token-ticker" style="font-family: monospace; font-size: 0.75rem; color: var(--main-color); font-weight: 600; margin-top: 0.1rem;">(${token.ticker})</div>` 
			: '';
		
		return `<div class="d-flex align-items-center"><div class="me-2">${imageHtml}</div><div>${assetTitle}${tokenId}${ticker}</div></div>`;
	}

	function renderTypeCell(token) {
		const icon = getTokenTypeIcon(token);
		const label = getTokenTypeLabel(token);
		const scamWarning = token.scam ? '<i class="fas fa-exclamation-triangle text-danger ms-1" title="Reported as suspicious"></i>' : '';
		
		return `<span class="d-flex align-items-center gap-2"><i class="${icon}"></i>${label}${scamWarning}</span>`;
	}

	// DataTable headers
	const headers = [
		{ 
			label: 'Token', 
			field: 'name',
			render: (value, token) => renderTokenCell(token)
		},
		{ 
			label: 'Type', 
			field: 'type',
			render: (value, token) => renderTypeCell(token)
		},
		{ 
			label: 'Supply', 
			field: 'emissionAmount',
			render: (value, token) => formatTokenAmount(token.emissionAmount, token.decimals)
		},
		{ 
			label: 'Description', 
			field: 'description',
			render: (value, token) => formatDescription(token.detailedDescription || token.description)
		},
		{ 
			label: 'Date', 
			field: 'mintDate',
			render: (value, token) => token.mintDate || ''
		}
	];
</script>

<!-- Desktop Table View -->
<div class="d-none d-lg-block custom-table-wrapper">
	<DataTable 
		{headers} 
		data={tokens} 
		{loading}
		{emptyMessage}
	/>
</div>

<!-- Mobile Card View -->
<div class="d-lg-none mobile-view">
	{#if loading}
		<Loading text="Loading issued tokens..." />
	{:else if tokens.length === 0}
		<div class="mobile-empty-state">
			<i class="fas fa-coins fa-3x text-muted mb-3"></i>
			<p class="text-muted">{emptyMessage}</p>
		</div>
	{:else}
		<div class="mobile-tokens-grid">
			{#each tokens as token}
				<TokenCard {token} />
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Enhanced table responsive styling */
	.custom-table-wrapper :global(.table-responsive) {
		overflow-x: auto !important;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: var(--main-color) transparent;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar {
		height: 8px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-thumb {
		background: var(--main-color);
		border-radius: 4px;
	}

	.custom-table-wrapper :global(.table-responsive)::-webkit-scrollbar-thumb:hover {
		background: var(--main-color-hover);
	}

	/* Ensure table has minimum width to trigger scroll */
	.custom-table-wrapper :global(.glass-table) {
		min-width: 800px;
	}

	/* Mobile Card View Styling */
	.mobile-view {
		min-height: 200px;
	}
	
	.mobile-empty-state {
		text-align: center;
		padding: 3rem 1rem;
		background: var(--glass-bg-subtle);
		border-radius: 12px;
		backdrop-filter: var(--glass-blur-sm);
	}

	.mobile-tokens-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0;
	}

	/* Responsive adjustments */
	@media (max-width: 576px) {
		.mobile-tokens-grid :global(.glass-card) {
			margin: 0 -0.5rem;
		}
	}
</style>