<script>
	import { formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { FEE_ERGOTREE, ERG_DECIMALS } from '$lib/utils/constants.js';

	export let transaction;

	$: currentErgPrice = $ergPrice;

	function calculateFee(tx) {
		const feeOutput = tx.outputs?.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}

	function calculateTotalValue(tx) {
		return tx.outputs?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
	}

	$: fee = calculateFee(transaction);
	$: totalValue = calculateTotalValue(transaction);
</script>

<div class="glass-card">
	<div class="card-header">
		<div class="tx-header-content">
			<div class="tx-icon">
				<i class="fas fa-clock"></i>
			</div>
			<div class="tx-info">
				<div class="tx-id">
					<a href="/transactions/{transaction.id}" class="tx-link">
						{formatAddress(transaction.id, 12, 4)}
					</a>
					{#if transaction.conflictGroup}
						<span class="conflict-badge" title="Competing with {transaction.conflictCount - 1} other transaction(s) for the same UTXO. Only one will succeed.">
							Double-spend #{transaction.conflictGroup}
						</span>
					{/if}
				</div>
			</div>
			<div class="tx-stats">
				<div class="stat-item">
					<i class="fas fa-exchange-alt text-info"></i>
					<span>{formatNumber(transaction.inputs?.length || 0)} → {formatNumber(transaction.outputs?.length || 0)}</span>
				</div>
			</div>
		</div>
	</div>
	<div class="card-content">
		<div class="detail-row">
			<span class="detail-label">Fee:</span>
			<span class="detail-value">
				{#if fee > 0}
					{@html formatErgValue(fee, ERG_DECIMALS)}
					{#if currentErgPrice?.value}
						<small class="text-light">
							{formatPriceUSD(fee, 9, currentErgPrice.value)}
						</small>
					{/if}
				{:else}
					N/A
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">ERG Transferred:</span>
			<span class="detail-value">
				{@html formatErgValue(totalValue)}
				{#if currentErgPrice?.value}
					<small class="text-light">
						{formatPriceUSD(totalValue, 9, currentErgPrice.value)}
					</small>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Size:</span>
			<span class="detail-value">{formatFileSize(transaction.size)}</span>
		</div>
	</div>
</div>

<style>
	.tx-header-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		width: 100%;
	}

	.tx-icon {
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

	.tx-info {
		flex-grow: 1;
		min-width: 0;
	}

	.tx-id {
		font-weight: 600;
		font-size: 1rem;
		line-height: 1.3;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tx-link {
		color: var(--text-strong);
		text-decoration: none;
		transition: color 0.2s ease;
		word-break: break-all;
	}

	.tx-link:hover {
		color: var(--main-color);
	}

	.conflict-badge {
		background: #dc3545;
		color: white;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		display: inline-block;
		margin-top: 0.2rem;
		margin-left: 0;
		width: fit-content;
	}

	.tx-stats {
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
		min-width: 100px;
	}

	.detail-value {
		color: var(--text-strong);
		font-size: 0.9rem;
		text-align: right;
		word-break: break-word;
	}
</style>