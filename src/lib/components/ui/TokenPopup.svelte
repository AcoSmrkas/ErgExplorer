<script>
	import { formatNumber, formatAddress } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import BasePopup from './BasePopup.svelte';
	
	export let token = null;
	export let tokenId = '';
	export let name = '';
	export let price = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	
	$: displayName = token?.name || name || (tokenId ? tokenId.substring(0, 15) + (tokenId.length > 15 ? '...' : '') : 'Unknown Token');
	$: tokenDescription = token?.description ? (token.description.length > 120 ? token.description.substring(0, 120) + '...' : token.description) : null;
	$: hasDetailedData = token !== null && token !== undefined;
	$: nftImage = token?.cachedurl;
	$: tokenIcon = token?.iconurl;
</script>

<BasePopup
	{visible}
	{x}
	{y}
	{loading}
	popupClass="token-popup"
	icon={tokenIcon ? '' : 'fa-coins'}
	iconColor="text-warning"
	title={displayName}
	copyText={tokenId}
	copyLabel="Copy token ID"
	copyMessage="Token ID copied to clipboard!"
	viewDetailsUrl="/tokens/{tokenId}"
	viewDetailsText="View Details"
>
	<!-- Token icon in header if available -->
	<div slot="header-icon">
		{#if tokenIcon}
			<img 
				class="token-popup-icon me-2" 
				src="{tokenIcon}" 
				alt="{displayName}"
				onerror={(e) => e.target.style.display = 'none'}
			/>
		{/if}
	</div>
	
	{#if nftImage}
		<div class="token-image-section">
			<img 
				class="token-popup-image nft-image" 
				src="{nftImage}" 
				alt="{displayName}"
				onerror={(e) => e.target.style.display = 'none'}
			/>
		</div>
	{/if}
	
	{#if hasDetailedData || !loading}
		<div class="token-details">
			{#if token?.ticker && token.ticker !== displayName}
				<div class="token-detail-row">Ticker: {token.ticker}</div>
			{/if}
			
			{#if tokenId}
				<div class="token-detail-row">
					<strong>ID:</strong> {formatAddress(tokenId, 15, 4)}
				</div>
			{/if}
			
			{#if price}
				<div class="token-detail-row">Price: ${@html formatValue(price, 0, true)}</div>
			{/if}
			
			{#if token?.decimals !== undefined}
				<div class="token-detail-row">Decimals: {token.decimals}</div>
			{/if}
			
			{#if token?.emissionAmount}
				<div class="token-detail-row">Supply: {formatNumber(token.emissionAmount / Math.pow(10, token.decimals || 0))}</div>
			{/if}
			
			{#if tokenDescription}
				<div class="token-description">
					<div class="description-label">Description:</div>
					<div class="description-text">{tokenDescription}</div>
				</div>
			{/if}
			
			{#if token?.scam}
				<div class="token-warning">
					<i class="fas fa-exclamation-triangle"></i>
					Reported as suspicious by users
				</div>
			{/if}
		</div>
	{/if}
</BasePopup>

<style>
	.token-popup-icon {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.token-image-section {
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--glass-border-light);
		text-align: center;
	}

	.token-details > .token-detail-row {
		margin-bottom: 0.5rem;
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.token-details > .token-detail-row:last-child {
		margin-bottom: 0;
	}

	.token-description {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--glass-border-light);
	}

	.description-label {
		font-weight: 600;
		margin-bottom: 0.25rem;
		color: var(--text-strong);
	}

	.description-text {
		color: var(--text-light);
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.token-warning {
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: rgba(220, 53, 69, 0.1);
		border: 1px solid rgba(220, 53, 69, 0.2);
		border-radius: 6px;
		color: #dc3545;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.token-popup-image {
		max-width: 100%;
		max-height: 120px;
		border-radius: 8px;
		object-fit: contain;
	}
</style>