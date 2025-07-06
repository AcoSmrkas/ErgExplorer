<script>
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { formatPriceUSD } from '$lib/utils/formatting.js';
	import { currentPrices } from '$lib/stores/priceStore.js';
	import { tokenIconsStore } from '$lib/stores/tokenIconsStore.js';
	import { getCachedTokens } from '$lib/stores/tokenCache.js';
	import { sortAssetsByPriority } from '$lib/utils/assetSorting.js';

	export let assets = [];

	let enhancedAssets = [];
	let loading = false;

	// Reactive dependency on token icons store to trigger re-render when icons are loaded
	$: $tokenIconsStore && sortedAssets;

	// Sort assets using shared utility
	$: sortedAssets = enhancedAssets?.length > 0 ? sortAssetsByPriority(enhancedAssets, $currentPrices) : [];

	// Enhance assets with token metadata when assets change
	$: if (assets && assets.length > 0) {
		enhanceAssets(assets);
	} else {
		enhancedAssets = [];
	}

	async function enhanceAssets(rawAssets) {
		if (!rawAssets || rawAssets.length === 0) {
			enhancedAssets = [];
			return;
		}

		loading = true;

		try {
			// Check which assets need token metadata
			const assetsNeedingMetadata = rawAssets.filter(asset => 
				!asset.name || !asset.decimals || asset.decimals === undefined
			);

			if (assetsNeedingMetadata.length > 0) {
				// Get token IDs that need metadata
				const tokenIds = assetsNeedingMetadata.map(asset => asset.tokenId).filter(Boolean);
				
				if (tokenIds.length > 0) {
					// Fetch token metadata from cache/API
					const tokenMetadata = await getCachedTokens(tokenIds);
					const metadataMap = new Map();
					
					tokenMetadata.forEach(token => {
						metadataMap.set(token.id || token.tokenId, token);
					});

					// Enhance assets with metadata
					enhancedAssets = rawAssets.map(asset => {
						const metadata = metadataMap.get(asset.tokenId);
						return {
							...asset,
							name: asset.name || metadata?.name || `${asset.tokenId?.slice(0, 8)}...`,
							decimals: asset.decimals !== undefined ? asset.decimals : (metadata?.decimals || 0),
							description: asset.description || metadata?.description,
						};
					});
				} else {
					// No valid token IDs, use raw assets with defaults
					enhancedAssets = rawAssets.map(asset => ({
						...asset,
						name: asset.name || `${asset.tokenId?.slice(0, 8)}...`,
						decimals: asset.decimals !== undefined ? asset.decimals : 0,
					}));
				}
			} else {
				// All assets already have metadata
				enhancedAssets = rawAssets;
			}
		} catch (error) {
			console.warn('Failed to enhance assets with metadata:', error);
			// Fall back to raw assets with defaults
			enhancedAssets = rawAssets.map(asset => ({
				...asset,
				name: asset.name || `${asset.tokenId?.slice(0, 8)}...`,
				decimals: asset.decimals !== undefined ? asset.decimals : 0,
			}));
		} finally {
			loading = false;
		}
	}

	function getAssetAmount(asset) {
		return formatValue(asset.amount / Math.pow(10, asset.decimals || 0), 0, false, false, true);
	}

	function getAssetUsdAmount(asset) {
		const usdAmount = formatPriceUSD(asset.amount, asset.decimals, $currentPrices[asset.tokenId]);
		return usdAmount === '' ? '' : usdAmount;
	}
</script>

{#if !assets || assets.length === 0}
	<span class="no-assets">—</span>
{:else if loading}
	<span class="loading-assets">Loading assets...</span>
{:else}
	<div class="assets-container">
		{#each sortedAssets as asset (asset.tokenId)}
			<div class="asset-item">
				<div class="asset-info">
					{@html getAssetTitleParams(null, asset.tokenId, asset.name, true)}
				</div>
				<div class="asset-amount">
					{@html getAssetAmount(asset)}
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

	.loading-assets {
		color: var(--text-light);
		font-style: italic;
		font-size: 0.85rem;
	}

	.assets-container {
		max-height: 120px; /* Height for approximately 3 items */
		max-width: 375px;
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
		min-height: 30px;
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

	@media (max-width: 991px) {
		.assets-container {
			max-width: 100%;
		}
	}

	@media (max-width: 768px) {
		.assets-container {
			max-height: 80px;
			font-size: 0.75rem;
		}
		
		.asset-item {
			padding: 0rem 0 !important;
			min-height: 30px !important;
			display: flex !important;
			align-items: center !important;
			justify-content: space-between !important;
		}
		
		.asset-amount {
			font-size: 0.75rem;
		}
	}
</style>