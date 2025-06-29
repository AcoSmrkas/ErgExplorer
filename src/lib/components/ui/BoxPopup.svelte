<script>
	import { formatErgValue, formatAddress, formatNumber } from '$lib/utils/formatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { currentPrices } from '$lib/stores/priceStore.js';
	import BasePopup from './BasePopup.svelte';
	
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	export let boxId = '';
	export let boxData = null;
	
	$: hasBoxData = boxData !== null && boxData !== undefined;
	$: displayBoxId = boxId ? formatAddress(boxId, 12, 4) : 'Unknown Box';
	$: topAssets = processAssets(boxData?.assets || []);
	
	function processAssets(assets) {
		if (!assets || assets.length === 0) return [];
		
		// Calculate USD values and sort (limit to top 3)
		const assetsWithValue = assets.map(asset => {
			const price = $currentPrices[asset.tokenId];
			const adjustedAmount = asset.amount / Math.pow(10, asset.decimals || 0);
			const usdValue = price ? adjustedAmount * price : 0;
			
			return {
				...asset,
				adjustedAmount,
				usdValue,
				hasPrice: !!price
			};
		});
		
		// Sort by USD value (descending), then by amount for assets without price
		assetsWithValue.sort((a, b) => {
			if (a.hasPrice && b.hasPrice) {
				return b.usdValue - a.usdValue;
			} else if (a.hasPrice && !b.hasPrice) {
				return -1;
			} else if (!a.hasPrice && b.hasPrice) {
				return 1;
			} else {
				return parseFloat(b.amount) - parseFloat(a.amount);
			}
		});
		
		return assetsWithValue.slice(0, 3); // Top 3 assets
	}
	
	function formatAssetAmount(amount, decimals = 0) {
		const adjustedAmount = amount / Math.pow(10, decimals);
		return formatNumber(adjustedAmount, decimals > 0 ? 4 : 0);
	}
	
	function formatAssetUSD(amount, decimals, tokenId) {
		const price = $currentPrices[tokenId];
		if (!price) return '';
		const adjustedAmount = amount / Math.pow(10, decimals || 0);
		const usdValue = adjustedAmount * price;
		return `($${formatNumber(usdValue, 2)})`;
	}
</script>

<BasePopup
	{visible}
	{x}
	{y}
	{loading}
	popupClass="box-popup"
	icon="fa-cube"
	iconColor="text-info"
	title={displayBoxId}
	copyText={boxId}
	copyLabel="Copy box ID"
	copyMessage="Box ID copied to clipboard!"
	viewDetailsUrl="/boxes/{boxId}"
	viewDetailsText="View Details"
>
	{#if hasBoxData}
		<div class="box-details">
			{#if boxData?.value !== undefined}
				<div class="box-detail-row">
					<strong>Value:</strong> {@html formatErgValue(boxData.value)} ERG
				</div>
			{/if}
			
			{#if boxData?.address}
				<div class="box-detail-row">
					<strong>Address:</strong> 
					<a href="/addresses/{boxData.address}" class="address-link">
						{formatAddress(boxData.address, 8, 4)}
					</a>
				</div>
			{/if}
			
			{#if boxData?.creationHeight}
				<div class="box-detail-row">
					<strong>Creation Height:</strong> 
					<a href="/blocks/{boxData.creationHeight}" class="text-link">
						{formatNumber(boxData.creationHeight)}
					</a>
				</div>
			{/if}
			
			<!-- Asset Holdings -->
			{#if topAssets.length > 0}
				<div class="asset-balances">
					<div class="asset-section-header">
						<i class="fas fa-coins me-2"></i>
						<strong>Assets {topAssets.length < boxData.assets.length ? `(${topAssets.length} of ${boxData.assets.length})` : `(${topAssets.length})`}</strong>
					</div>
					<div class="asset-list">
						{#each topAssets as asset}
							<div class="asset-row">
								<div class="asset-name-section">
									{@html getAssetTitleParams(null, asset.tokenId, asset.name, true)}
								</div>
								<div class="asset-amount-section">
									{#if asset.hasPrice}
										{formatAssetAmount(asset.amount, asset.decimals)} <span class="text-light">{formatAssetUSD(asset.amount, asset.decimals, asset.tokenId)}</span>
									{:else}
										{formatAssetAmount(asset.amount, asset.decimals)}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</BasePopup>

<style>
	.box-details > .box-detail-row {
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.box-details > .box-detail-row:last-child {
		margin-bottom: 0;
	}

	.asset-balances {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--glass-border-light);
	}

	.asset-section-header {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
		color: var(--text-strong);
		font-size: 0.8rem;
	}

	.asset-section-header i {
		color: var(--main-color);
	}

	.asset-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.asset-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0;
		font-size: 0.8rem;
	}

	.asset-name-section {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.asset-name-section :global(.token-title) {
		font-size: 0.8rem !important;
	}

	.asset-amount-section {
		flex-shrink: 0;
		text-align: right;
		font-weight: 500;
		color: var(--text-strong);
	}

	.asset-amount-section .text-light {
		color: var(--text-light) !important;
		font-size: 0.75rem;
		margin-left: 0.25rem;
	}

	.address-link {
		color: var(--text-strong);
		text-decoration: none;
		font-family: monospace;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.address-link:hover {
		color: var(--main-color);
		text-decoration: none;
	}

	.text-link {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.text-link:hover {
		color: var(--main-color);
		text-decoration: none;
	}
</style>