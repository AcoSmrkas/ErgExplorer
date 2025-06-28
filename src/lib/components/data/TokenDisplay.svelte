<script>
	export let tokenId = '';
	export let name = '';
	export let amount = '0';
	export let decimals = 0;
	export let format = 'full'; // 'full', 'compact', 'icon-only'
	export let showIcon = true;
	export let linkToToken = true;
	export let showAmount = true;
	
	$: formattedAmount = formatTokenAmount(amount, decimals);
	$: tokenIcon = getTokenIcon(tokenId, name);
	$: displayName = name || (tokenId ? `${tokenId.slice(0, 8)}...` : 'Unknown');
	$: isERG = tokenId === '' || tokenId === 'ERG';
	
	function formatTokenAmount(amt, dec) {
		if (!amt) return '0';
		
		const num = parseFloat(amt);
		const divisor = Math.pow(10, dec);
		const formatted = (num / divisor).toFixed(dec > 0 ? Math.min(dec, 8) : 0);
		
		// Remove trailing zeros
		return formatted.replace(/\.?0+$/, '');
	}
	
	function getTokenIcon(id, tokenName) {
		// ERG token
		if (isERG) return '/images/logo-new.png';
		
		// Check for known token icons
		const knownTokens = {
			// Add known token mappings here
		};
		
		if (knownTokens[id]) return knownTokens[id];
		
		// Default token icon based on first character
		return '/images/tokens/default.png';
	}
	
	function formatCompactAmount(amt) {
		const num = parseFloat(amt);
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return amt;
	}
</script>

<div class="token-display {format}">
	{#if showIcon && format !== 'compact'}
		<div class="token-icon">
			<img src={tokenIcon} alt={displayName} onerror={() => this.src='/images/tokens/default.png'}>
		</div>
	{/if}
	
	<div class="token-info">
		{#if linkToToken && tokenId && !isERG}
			<a href="/tokens/{tokenId}" class="token-name">
				{displayName}
			</a>
		{:else}
			<span class="token-name" class:erg={isERG}>
				{displayName}
			</span>
		{/if}
		
		{#if showAmount}
			<span class="token-amount">
				{#if format === 'compact'}
					{formatCompactAmount(formattedAmount)}
				{:else}
					{formattedAmount}
				{/if}
			</span>
		{/if}
	</div>
</div>

<style>
	.token-display {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.token-display.compact {
		gap: 0.25rem;
	}
	
	.token-display.icon-only {
		gap: 0;
	}
	
	.token-icon {
		width: 25px;
		height: 25px;
		border-radius: 50%;
		overflow: hidden;
		background-color: var(--bs-light);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.token-icon img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.token-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	
	.compact .token-info {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
	}
	
	.token-name {
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
		color: var(--bs-body-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.token-name.erg {
		color: var(--main-color);
		font-weight: 700;
	}
	
	a.token-name {
		color: var(--main-color);
		transition: color 0.2s ease;
	}
	
	a.token-name:hover {
		color: var(--main-color-hover);
		text-decoration: underline;
	}
	
	.token-amount {
		font-size: 0.85rem;
		color: var(--bs-secondary-color);
		font-weight: 500;
	}
	
	.compact .token-amount {
		font-size: 0.8rem;
	}
	
	.icon-only .token-info {
		display: none;
	}
</style>