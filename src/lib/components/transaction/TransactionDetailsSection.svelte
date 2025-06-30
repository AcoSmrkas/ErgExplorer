<script>
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	import BlockLink from '$lib/components/ui/BlockLink.svelte';
	import { formatErgValue, formatDateString, formatNumber, formatFileSize, formatPriceUSD } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore';
    import { ERG_DECIMALS } from '$lib/utils/constants';

	export let transaction;
	export let txId;
	export let isConfirmed;
	export let feeAmount;
	export let totalOutputValue;
	export let mobile = false;
</script>

<div class="detail-section" class:mobile>
	{#if mobile}
		<div class="detail-row">
			<span class="detail-label">Transaction ID:</span>
			<span class="detail-value">
				<div class="tx-id-row">
					<span class="font-monospace tx-id-text">{txId.slice(0, 8)}...{txId.slice(-4)}</span>
					<CopyButton 
						text={txId}
						label="Copy"
						successMessage="Transaction ID copied to clipboard!"
						size="small"
						inline={true}
					/>
				</div>
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Status:</span>
			<span class="detail-value">
				{#if isConfirmed}
					<span class="status-badge confirmed">Confirmed</span>
				{:else}
					<span class="status-badge pending">Pending</span>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Size:</span>
			<span class="detail-value">{formatFileSize(transaction.size)}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Received time:</span>
			<span class="detail-value">{formatDateString(transaction.timestamp)}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Included in blocks:</span>
			<span class="detail-value">
				{#if transaction.inclusionHeight}
					<BlockLink 
						blockId={transaction.blockId}
						blockHeight={transaction.inclusionHeight}
						onlyHeight={true}
						preferHeight={true}
						showCopy={false}
						linkClass="text-link"
					/>
				{:else}
					<span class="text-muted">Pending</span>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Confirmations:</span>
			<span class="detail-value">
				{#if transaction.numConfirmations}
					{formatNumber(transaction.numConfirmations)}
				{:else}
					<span class="text-warning">Pending</span>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Total coins transferred:</span>
			<span class="detail-value">
				{@html formatErgValue(totalOutputValue)}
				{#if $ergPrice}
					<small class="text-light">{formatPriceUSD(totalOutputValue, ERG_DECIMALS, $ergPrice.value)}</small>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Fees:</span>
			<span class="detail-value">
				{@html formatErgValue(feeAmount)}
				{#if $ergPrice}
					<small class="text-light">{formatPriceUSD(feeAmount, ERG_DECIMALS, $ergPrice.value)}</small>
				{/if}
			</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">Fees per byte:</span>
			<span class="detail-value">{@html formatErgValue(feeAmount / (transaction.size || 1), 9)}</span>
		</div>
	{:else}
		<div class="row">
			<div class="col-md-6">
				<div class="detail-column">
					<div class="detail-row">
						<span class="detail-label">Transaction ID:</span>
						<span class="detail-value">
							<div class="tx-id-row">
								<span class="font-monospace tx-id-text">{txId.slice(0, 8)}...{txId.slice(-4)}</span>
								<CopyButton 
									text={txId}
									label="Copy"
									successMessage="Transaction ID copied to clipboard!"
									size="small"
									inline={true}
								/>
							</div>
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Status:</span>
						<span class="detail-value">
							{#if isConfirmed}
								<span class="status-badge confirmed">Confirmed</span>
							{:else}
								<span class="status-badge pending">Pending</span>
							{/if}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Size:</span>
						<span class="detail-value">{formatFileSize(transaction.size)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Received time:</span>
						<span class="detail-value">{formatDateString(transaction.timestamp)}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Included in blocks:</span>
						<span class="detail-value">
							{#if transaction.inclusionHeight}
								<BlockLink 
									blockId={transaction.blockId}
									blockHeight={transaction.inclusionHeight}
									onlyHeight={true}
									preferHeight={true}
									showCopy={false}
									linkClass="text-link"
								/>
							{:else}
								<span class="text-muted">Pending</span>
							{/if}
						</span>
					</div>
				</div>
			</div>
			<div class="col-md-6">
				<div class="detail-column">
					<div class="detail-row">
						<span class="detail-label">Confirmations:</span>
						<span class="detail-value">
							{#if transaction.numConfirmations}
								{formatNumber(transaction.numConfirmations)}
							{:else}
								<span class="text-warning">Pending</span>
							{/if}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Total coins transferred:</span>
						<span class="detail-value">
							{@html formatErgValue(totalOutputValue)}
							{#if $ergPrice}
								<small class="text-light">{formatPriceUSD(totalOutputValue, ERG_DECIMALS, $ergPrice.value)}</small>
							{/if}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Fees:</span>
						<span class="detail-value">
							{@html formatErgValue(feeAmount)}
							{#if $ergPrice}
								<small class="text-light">{formatPriceUSD(feeAmount, ERG_DECIMALS, $ergPrice.value)}</small>
							{/if}
						</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Fees per byte:</span>
						<span class="detail-value">{@html formatErgValue(feeAmount / (transaction.size || 1), 9)}</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.detail-section {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.detail-section:not(.mobile) {
		display: block;
	}

	.detail-column {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.detail-row:last-child {
		border-bottom: none;
	}

	.detail-label {
		font-weight: 500;
		color: var(--text-light);
		font-size: 0.9rem;
		flex-shrink: 0;
		min-width: 120px;
	}

	.detail-value {
		color: var(--text-strong);
		font-size: 0.9rem;
		text-align: right;
		word-break: break-word;
		flex: 1;
	}

	.status-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 8px;
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		line-height: 1.2;
	}

	.status-badge.confirmed {
		background: rgba(40, 167, 69, 0.2);
		color: #28a745;
		border: 1px solid rgba(40, 167, 69, 0.3);
	}

	.status-badge.pending {
		background: rgba(255, 193, 7, 0.2);
		color: #ffc107;
		border: 1px solid rgba(255, 193, 7, 0.3);
	}

	.tx-id-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.tx-id-text {
		color: var(--text-strong);
		font-size: 0.9rem;
	}

	:global(.text-link) {
		color: var(--text-strong);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.3s ease;
	}

	:global(.text-link:hover) {
		color: var(--main-color);
	}
</style>