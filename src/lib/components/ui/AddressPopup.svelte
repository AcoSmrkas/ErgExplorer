<script>
	import { formatErgValue, formatAddress, formatNumber, formatPriceUSD } from '$lib/utils/formatting.js';
	import { fade } from 'svelte/transition';
	import CopyButton from './CopyButton.svelte';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { addAddress, getOwner, addressBook } from '$lib/stores/addressBook.js';
	import { currentPrices } from '$lib/stores/priceStore.js';
	import { onMount } from 'svelte';
	
	export let address = '';
	export let balance = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	
	$: hasBalanceData = balance !== null && balance !== undefined;
	
	// Add address to addressbook when popup is shown
	$: if (visible && address) {
		addAddress(address);
	}
	
	// Get friendly name from addressbook or fallback to formatted address
	$: friendlyName = address ? getOwner(address, $addressBook) : null;
	$: displayAddress = address ? formatAddress(address, 15, 4) : 'Unknown Address';
	
	// Process and sort tokens by USD value
	$: topTokens = processTokens(balance?.confirmed?.tokens || []);
	
	function processTokens(tokens) {
		if (!tokens || tokens.length === 0) return [];
		
		// Calculate USD values and sort
		const tokensWithValue = tokens.map(token => {
			const price = $currentPrices[token.tokenId];
			const adjustedAmount = token.amount / Math.pow(10, token.decimals || 0);
			const usdValue = price ? adjustedAmount * price : 0;
			
			return {
				...token,
				adjustedAmount,
				usdValue,
				hasPrice: !!price
			};
		});
		
		// Sort by USD value (descending), then by amount for tokens without price
		tokensWithValue.sort((a, b) => {
			if (a.hasPrice && b.hasPrice) {
				return b.usdValue - a.usdValue;
			} else if (a.hasPrice && !b.hasPrice) {
				return -1;
			} else if (!a.hasPrice && b.hasPrice) {
				return 1;
			} else {
				return b.adjustedAmount - a.adjustedAmount;
			}
		});
		
		// Return top 5 tokens to avoid clutter
		return tokensWithValue.slice(0, 5);
	}
	
	function formatTokenAmount(amount, decimals) {
		const adjusted = amount / Math.pow(10, decimals || 0);
		if (adjusted >= 1000000) {
			return formatNumber(adjusted / 1000000, 2) + 'M';
		} else if (adjusted >= 1000) {
			return formatNumber(adjusted / 1000, 2) + 'K';
		} else if (adjusted >= 1) {
			return formatNumber(adjusted, 2);
		} else {
			return formatNumber(adjusted, 4);
		}
	}
</script>

{#if visible && address}
	<div 
		class="address-popup show" 
		style="left: {x}px; top: {y}px;"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div class="address-header">
			<div class="address-icon">
				<i class="fas fa-wallet"></i>
			</div>
			<div class="address-title">
				<div class="address-name">{friendlyName ? friendlyName : 'Address Balance'}</div>
			</div>
		</div>
		
		<!-- Full address with copy button (always shown) -->
		<div class="address-id-section mb-2">
			<div class="address-full">{displayAddress}</div>
			<CopyButton text={address}
				label="Copy full address"
				successMessage="Address copied to clipboard!"
			/>
		</div>
		
		{#if loading && !hasBalanceData}
			<div class="loading-section" in:fade={{ duration: 200 }}>
				<div class="loading-spinner-small" style="display: inline-block"></div>
				<span class="loading-text">Loading balance...</span>
			</div>
		{/if}
		
		{#if hasBalanceData}
			<div class="address-details" in:fade={{ duration: 300, delay: 100 }}>
				{#if balance?.confirmed?.nanoErgs !== undefined}
					<div class="address-balance">
						<strong>Confirmed Balance:</strong> {@html formatErgValue(balance.confirmed.nanoErgs)}
					</div>
				{/if}
				
				{#if balance?.unconfirmed?.nanoErgs !== undefined && balance.unconfirmed.nanoErgs > 0}
					<div class="address-unconfirmed">
						<strong>Unconfirmed:</strong> {@html formatErgValue(balance.unconfirmed.nanoErgs)}
					</div>
				{/if}
				
				{#if balance?.confirmed?.nanoErgs !== undefined}
					<div class="address-total">
						<strong class="erg-span">Total Balance:</strong> {@html formatErgValue((balance.confirmed?.nanoErgs || 0) + (balance.unconfirmed?.nanoErgs || 0))}
					</div>
				{/if}
				
				<!-- Token Balances -->
				{#if topTokens.length > 0}
					<div class="token-balances">
						<div class="token-section-header">
							<i class="fas fa-coins me-2"></i>
							<strong>Top Token Holdings</strong>
						</div>
						<div class="token-list">
							{#each topTokens as token}
								<div class="token-row">
									<div class="token-name-section">
										{@html getAssetTitleParams(null, token.tokenId, token.name, true)}
									</div>
									<div class="token-amount-section">
										{#if token.hasPrice}
											{@html formatTokenAmount(token.amount, token.decimals)} <span class="text-light">{@html formatPriceUSD(token.amount, token.decimals, $currentPrices[token.tokenId])}</span>
										{:else}
											{formatTokenAmount(token.amount, token.decimals)}
										{/if}
									</div>
								</div>
							{/each}
							{#if balance?.confirmed?.tokens?.length > 5}
								<div class="more-tokens">
									<i class="fas fa-plus me-1"></i>
									{balance.confirmed.tokens.length - 5} more tokens
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.token-balances {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.token-section-header {
		margin-bottom: 0.75rem;
		color: var(--text-strong);
		font-size: 0.9rem;
		display: flex;
		align-items: center;
	}

	.token-section-header i {
		color: var(--main-color);
	}

	.token-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.token-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.3rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.token-row:last-child {
		border-bottom: none;
	}

	.token-name-section {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.token-amount-section {
		text-align: right;
		font-size: 0.8rem;
		color: var(--text-white);
		font-weight: 500;
	}

	.more-tokens {
		margin-top: 0.25rem;
		text-align: center;
		color: var(--text-light);
		font-size: 0.75rem;
		padding: 0.5rem;
		padding-bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.more-tokens i {
		font-size: 0.7rem;
		opacity: 0.7;
	}

	/* Style token links within the popup */
	:global(.token-row .token-link) {
		text-decoration: none;
		color: var(--text-strong);
		font-size: 0.85rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		transition: color 0.2s ease;
	}

	:global(.token-row .token-link:hover) {
		color: var(--main-color);
	}

	:global(.token-row .token-icon) {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
</style>