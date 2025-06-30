<script>
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { formatPriceUSD } from '$lib/utils/formatting.js';
	import { currentPrices } from '$lib/stores/priceStore.js';
	import { tokenIconsStore } from '$lib/stores/tokenIconsStore.js';

	export let assets = [];

	// Reactive dependency on token icons store to trigger re-render when icons are loaded
	$: $tokenIconsStore && sortedAssets;

	// Sort assets by priority: 1) USD value (if exists), 2) has token icon, 3) alphabetically
	$: sortedAssets = assets?.length > 0 ? [...assets].sort((a, b) => {
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
	}) : [];

	function getAssetAmount(asset) {
		return formatValue(asset.amount / Math.pow(10, asset.decimals || 0), 0, false, false, true);
	}

	function getAssetUsdAmount(asset) {
		const usdAmount = formatPriceUSD(asset.amount, asset.decimals, $currentPrices[asset.tokenId]);
		return usdAmount === '($0.00)' ? '' : usdAmount;
	}
</script>

{#if !assets || assets.length === 0}
	<span class="no-assets">—</span>
{:else}
	<div class="assets-container">
		{#each sortedAssets as asset (asset.tokenId)}
			<div class="asset-item">
				<div class="asset-info">
					{@html getAssetTitleParams(null, asset.tokenId, asset.name, true)}
				</div>
				<div class="asset-amount">
					{getAssetAmount(asset)}
					{#if getAssetUsdAmount(asset)}
						<span class="text-light">{getAssetUsdAmount(asset)}</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.no-assets {
		color: var(--text-light);
		font-style: italic;
	}

	.assets-container {
		max-height: 120px; /* Height for approximately 3 items */
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: 0;
	}

	.asset-item {
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

	.asset-item:last-child {
		border-bottom: none;
	}

	.asset-info {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}

	.asset-amount {
		flex-shrink: 0;
		font-weight: 500;
		color: var(--text-strong);
		font-size: 0.85rem;
		margin-left: 0.5rem;
	}

	/* Scrollbar styles */
	.assets-container::-webkit-scrollbar {
		width: 4px;
	}

	.assets-container::-webkit-scrollbar-track {
		background: var(--glass-bg-subtle);
		border-radius: 2px;
	}

	.assets-container::-webkit-scrollbar-thumb {
		background: var(--glass-border-medium);
		border-radius: 2px;
	}

	.assets-container::-webkit-scrollbar-thumb:hover {
		background: var(--main-color);
	}

	@media (max-width: 768px) {
		.assets-container {
			max-height: 80px;
			font-size: 0.75rem;
		}
		
		.asset-item {
			padding: 0rem 0 !important;
			min-height: 40px !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
		}
		
		.asset-amount {
			font-size: 0.75rem;
		}
	}
</style>