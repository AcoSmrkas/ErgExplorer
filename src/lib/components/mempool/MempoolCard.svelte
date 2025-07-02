<script>
	import { formatErgValue, formatFileSize, formatNumber, formatPriceUSD, formatAddress } from '$lib/utils/formatting.js';
	import { ergPrice } from '$lib/stores/priceStore.js';
	import { FEE_ERGOTREE, ERG_DECIMALS } from '$lib/utils/constants.js';
	import { boxResolutionService } from '$lib/services/boxResolutionService.js';
	import { addressBook } from '$lib/stores/addressBook.js';
	import { extractAddresses, getKnownAddresses, getBadgeClass } from '$lib/utils/mempoolBadges.js';

	export let transaction;

	$: currentErgPrice = $ergPrice;
	
	let currentAddressBook = [];

	// Subscribe to address book updates
	addressBook.subscribe(value => {
		currentAddressBook = value;
	});

	function calculateFee(tx) {
		const feeOutput = tx.outputs?.find(output => output.ergoTree === FEE_ERGOTREE);
		return feeOutput ? parseInt(feeOutput.value) : 0;
	}

	function calculateTransferredErg(tx) {
		if (!tx.inputs || !tx.outputs) return 0;

		// Sum ERG by address for inputs
		const inputsByAddress = new Map();
		tx.inputs.forEach(input => {
			if (input.address && input.value) {
				const current = inputsByAddress.get(input.address) || 0;
				inputsByAddress.set(input.address, current + parseInt(input.value));
			}
		});

		// Sum ERG by address for outputs (excluding fee)
		const outputsByAddress = new Map();
		tx.outputs.forEach(output => {
			if (output.address && output.value && output.ergoTree !== FEE_ERGOTREE) {
				const current = outputsByAddress.get(output.address) || 0;
				outputsByAddress.set(output.address, current + parseInt(output.value));
			}
		});

		// Calculate net transfers
		let totalTransferred = 0;
		const allAddresses = new Set([...inputsByAddress.keys(), ...outputsByAddress.keys()]);

		allAddresses.forEach(address => {
			const inputAmount = inputsByAddress.get(address) || 0;
			const outputAmount = outputsByAddress.get(address) || 0;
			const netChange = outputAmount - inputAmount;

			// Only count positive net changes (addresses that received more than they sent)
			if (netChange > 0) {
				totalTransferred += netChange;
			}
		});

		return totalTransferred;
	}

	$: fee = calculateFee(transaction);
	$: totalValue = calculateTransferredErg(transaction);
	$: allAssets = (() => {
		const movedAssets = boxResolutionService.extractMovedAssets(transaction);
		return movedAssets.map(asset => 
			asset.name || (asset.tokenId ? asset.tokenId.slice(0, 6) + '...' : 'Unknown')
		);
	})();
	$: hasAssets = allAssets.length > 0;
</script>

<div class="glass-card">
	<div class="card-header">
		<div class="tx-header-content">
			<div class="tx-icon">
				<i class="fas fa-clock"></i>
			</div>
			<div class="tx-info">
				<div class="tx-id">
					<a href="/transactions/{transaction.id}" class="tx-link" data-transaction-hover="{transaction.id}">
						{formatAddress(transaction.id, 12, 4)}
					</a>
					{#if transaction.conflictGroup}
						<span class="conflict-badge" title="Competing with {transaction.conflictCount - 1} other transaction(s) for the same UTXO. Only one will succeed.">
							#{transaction.conflictGroup}
						</span>
					{/if}
					{#if true}
						{@const extractResult = extractAddresses(transaction)}
						{@const allKnownAddresses = getKnownAddresses(extractResult.addressMap, currentAddressBook)}
						{@const nameDirections = new Map()}
						{@const _ = allKnownAddresses.forEach(entry => {
							const existing = nameDirections.get(entry.name) || { isInput: false, isOutput: false };
							if (entry.direction.isInput) existing.isInput = true;
							if (entry.direction.isOutput) existing.isOutput = true;
							nameDirections.set(entry.name, existing);
						})}
						{@const seenNames = new Set()}
						{@const uniqueKnownAddresses = allKnownAddresses.filter(entry => {
							if (seenNames.has(entry.name)) return false;
							seenNames.add(entry.name);
							return true;
						}).slice(0, 2)}
						{#if extractResult.hasStorageRent}
							<span class="address-badge badge-storage-rent" title="Storage Rent Collection">📦 Storage</span>
						{/if}
						{#each uniqueKnownAddresses as entry}
							{@const baseContent = entry.type || entry.name}
							{@const nameDirection = nameDirections.get(entry.name) || { isInput: false, isOutput: false }}
							{@const badgeContent = nameDirection.isInput && nameDirection.isOutput ? `↔${baseContent}` : entry.direction.isInput ? `${baseContent}→` : `→${baseContent}`}
							<span class="address-badge {getBadgeClass(entry.type, entry.name)}" title="{entry.name}{entry.urltype ? ` (${entry.urltype})` : ''}">
								{badgeContent}
							</span>
						{/each}
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
		{#if hasAssets}
			<div class="detail-row">
				<span class="detail-label">Assets:</span>
				<span class="detail-value">
					<span class="asset-summary-mobile">
						{#if allAssets.length === 1}
							{allAssets[0]}
						{:else if allAssets.length <= 3}
							{allAssets.join(', ')}
						{:else}
							{allAssets.slice(0, 2).join(', ')} +{allAssets.length - 2} more
						{/if}
					</span>
				</span>
			</div>
		{/if}
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
		word-break: break-all;
	}
	
	/* Base .tx-link styles are defined globally in common-components.css */

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

	.asset-summary-mobile {
		font-size: 0.8rem;
		color: var(--text-strong);
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

</style>