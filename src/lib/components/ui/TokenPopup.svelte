<script>
	import { formatNumber, formatAddress } from '$lib/utils/formatting.js';
	import { formatValue } from '$lib/utils/numberFormatting.js';
	import { fade } from 'svelte/transition';
	import CopyButton from './CopyButton.svelte';
	
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

{#if visible && (token || tokenId)}
	<div 
		class="token-popup show" 
		style="left: {x}px; top: {y}px;"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<div class="token-header">
			{#if nftImage}
				<img 
					class="token-popup-image nft-image" 
					src="{nftImage}" 
					alt="{displayName}"
					onerror={(e) => e.target.style.display = 'none'}
				/>
			{:else if tokenIcon}
				<img 
					class="token-popup-image token-icon-large" 
					src="{tokenIcon}" 
					alt="{displayName}"
					onerror={(e) => e.target.style.display = 'none'}
				/>
			{/if}
			<div class="token-title">
				<div class="token-name">{displayName}</div>
			</div>
		</div>
		
		{#if loading && !hasDetailedData}
			<div class="loading-section" in:fade={{ duration: 200 }}>
				<div class="loading-spinner-small"></div>
				<span class="loading-text">Loading token data...</span>
			</div>
		{/if}
		
		{#if hasDetailedData}
			<div class="token-details" in:fade={{ duration: 300, delay: 100 }}>
				{#if token?.ticker && token.ticker !== displayName}
					<div class="token-ticker">Ticker: {token.ticker}</div>
				{/if}
				
				{#if tokenId}
					<div class="token-id-section">
						<div class="token-id">ID: {formatAddress(tokenId, 15, 4)}</div>
						<div class="mb-2">
							<CopyButton 
								text={tokenId} 
								label="Copy full token ID" 
								successMessage="Token ID copied to clipboard!"
							/>
						</div>
					</div>
				{/if}
				
				{#if price}
					<div class="token-price">Price: ${@html formatValue(price, 0, true)}</div>
				{/if}
				
				{#if token?.decimals !== undefined}
					<div class="token-decimals">Decimals: {token.decimals}</div>
				{/if}
				
				{#if token?.emissionAmount}
					<div class="token-supply">Supply: {formatNumber(token.emissionAmount / Math.pow(10, token.decimals || 0))}</div>
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
		{:else if !loading}
			<!-- Basic info when no detailed data and not loading -->
			<div class="token-basic-info">
				{#if tokenId}
					<div class="token-id-section">
						<div class="token-id">ID: {formatAddress(tokenId, 15, 4)}...</div>
						<div class="mb-2">
							<CopyButton 
								text={tokenId} 
								label="Copy full token ID" 
								successMessage="Token ID copied to clipboard!"
							/>
						</div>
					</div>
				{/if}
				
				{#if price}
					<div class="token-price">Price: ${formatNumber(price, 4)}</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}