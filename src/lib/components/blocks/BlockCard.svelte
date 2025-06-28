<script>
	import { formatDateString, formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { get } from 'svelte/store';

	export let block;

	$: currentErgPrice = get(ergPrice);
</script>

<div class="glass-card">
	<div class="card-header">
		<div class="block-header-content">
			<div class="block-icon">
				<i class="fas fa-cube"></i>
			</div>
			<div class="block-info">
				<div class="block-height">
					<a href="/blocks/{block.id}" class="height-link">
						Block #{formatNumber(block.height, 0, true)}
					</a>
				</div>
				<div class="block-time">{formatDateString(block.timestamp)}</div>
			</div>

		<div class="block-stats">
			<div class="stat-item">
				<i class="fas fa-exchange-alt text-info"></i>
				<span>{formatNumber(block.transactionsCount)} tx</span>
			</div>
		</div>
		</div>
	</div>
	<div class="card-content">
		{#if block.miner?.address}
			<div class="detail-row">
				<span class="detail-label">Mined by:</span>
				<span class="detail-value">
					<a href="/addresses/{block.miner.address}" class="address-link">
						{formatAddress(block.miner.address, 9, 4)}
					</a>
				</span>
			</div>
		{/if}
		<div class="detail-row">
			<span class="detail-label">Reward:</span>
			<span class="detail-value">
				{@html formatErgValue(block.minerReward)}
				{#if currentErgPrice?.value}
					<small class="text-light">
						{formatPriceUSD(block.minerReward, 9, currentErgPrice.value)}
					</small>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Size:</span>
			<span class="detail-value">{formatFileSize(block.size)}</span>
		</div>
	</div>
</div>

<style>
	.block-header-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		width: 100%;
	}

	.block-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 8px;
		background: var(--glass-bg-light);
		border: 2px solid var(--borders);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: var(--main-color);
	}

	.block-info {
		flex-grow: 1;
		min-width: 0;
	}

	.block-height {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.height-link {
		color: var(--text-strong);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.height-link:hover {
		color: var(--main-color);
	}

	.block-time {
		font-size: 0.9rem;
		color: var(--text-light);
	}

	.block-stats {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--text-light);
		background: var(--glass-bg-light);
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.glass-card .card-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.detail-label {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
		flex-shrink: 0;
		min-width: 70px;
	}

	.detail-value {
		color: var(--text-strong);
		font-size: 0.9rem;
		text-align: right;
		word-break: break-word;
	}
</style>