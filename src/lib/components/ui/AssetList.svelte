<script>
	import { formatNumber, formatAddress } from '$lib/utils/formatting.js';
	
	export let assets = [];
</script>

{#if assets && assets.length > 0}
	<div class="assets-list">
		{#each assets as asset}
			<div class="asset-item">
				<div class="asset-info">
					<a href="/tokens/{asset.tokenId}" class="asset-link font-monospace" data-token-id="{asset.tokenId}">
						{formatAddress(asset.tokenId, 9, 4)}
					</a>
					<span class="asset-amount">{formatNumber(asset.amount)}</span>
				</div>
			</div>
		{/each}
	</div>
{:else}
	<p class="empty-state">No assets found</p>
{/if}

<style>
	.assets-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.asset-item {
		padding: 0.75rem;
		background: var(--glass-bg-light);
		border-radius: 8px;
		border: 1px solid var(--glass-border-light);
	}

	.asset-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	/* .asset-link styles are defined globally in common-components.css */

	.asset-amount {
		font-weight: 600;
		color: var(--text-strong);
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-light);
		font-style: italic;
		margin: 0;
	}

	/* Mobile optimizations handled by global .asset-info class */
</style>