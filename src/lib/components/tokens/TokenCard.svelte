<script>
	import { formatTokenAmount, formatAddress } from '$lib/utils/formatting.js';
	import { getAssetTitleParams } from '$lib/utils/tokenIcons.js';
	import { getTokenTypeIcon, formatDescription } from '$lib/utils/tokenHelpers.js';

	export let token;
</script>

<div class="glass-card">
	<div class="card-header">
		<div class="token-header-content">
			<div class="token-image-container">
				{#if token.cachedurl}
					<img src={token.cachedurl} alt={token.name || 'NFT'} class="token-image nft-image" on:error={(e) => e.target.style.display = 'none'}/>
				{:else if token.iconurl && !token.cachedurl}
					<img src={token.iconurl} alt={token.name || 'Token'} class="token-image token-icon" on:error={(e) => e.target.style.display = 'none'}/>
				{:else}
					<div class="token-placeholder">
						<i class="fas fa-coins"></i>
					</div>
				{/if}
			</div>
			<div class="token-info">
				<div class="token-name">
					{@html getAssetTitleParams(token.detail, token.id, token.name, true)}
					<span class="type-badge-inline">
						<i class="{getTokenTypeIcon(token)}"></i>
						{#if token.scam}
							<i class="fas fa-exclamation-triangle text-danger ms-1" title="Reported as suspicious"></i>
						{/if}
					</span>
				</div>
				<div class="token-id">{formatAddress(token.id, 12, 4)}</div>
				{#if token.ticker && token.ticker !== token.name}
					<div class="token-ticker">({token.ticker})</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="card-content">
		<div class="detail-row">
			<span class="detail-label">Supply:</span>
			<span class="detail-value">{formatTokenAmount(token.emissionAmount, token.decimals)}</span>
		</div>
		{#if token.detailedDescription || token.description}
			<div class="detail-row">
				<span class="detail-label">Description:</span>
				<span class="detail-value description-text">{formatDescription(token.detailedDescription || token.description)}</span>
			</div>
		{/if}
		{#if token.mintDate}
			<div class="detail-row">
				<span class="detail-label">Date:</span>
				<span class="detail-value">{token.mintDate}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.token-header-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		width: 100%;
	}

	.token-image-container {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 8px;
		overflow: hidden;
		background: var(--glass-bg-light);
		border: 2px solid var(--borders);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.token-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.token-image.nft-image {
		border-radius: 6px;
	}

	.token-image.token-icon {
		border-radius: 50%;
		width: 32px;
		height: 32px;
	}

	.token-placeholder {
		color: var(--text-light);
		font-size: 1.5rem;
	}

	.token-info {
		flex-grow: 1;
		min-width: 0;
	}

	.token-name {
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--text-strong);
		margin-bottom: 0.25rem;
		word-break: break-word;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.token-id {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--text-light);
		margin-bottom: 0.25rem;
	}

	.token-ticker {
		font-family: monospace;
		font-size: 0.8rem;
		color: var(--main-color);
		font-weight: 600;
	}

	.type-badge-inline {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.9rem;
		color: var(--text-light);
		flex-shrink: 0;
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

	.description-text {
		text-align: left;
		line-height: 1.4;
		max-width: 100%;
	}
</style>