<script>
	import { createEventDispatcher } from 'svelte';
	
	export let address = '';
	export let displayLength = 12;
	export let showOwner = true;
	export let enableCopy = true;
	export let linkToAddress = true;
	
	const dispatch = createEventDispatcher();
	
	$: shortAddress = address ? `${address.slice(0, displayLength)}...${address.slice(-displayLength)}` : '';
	$: ownerName = getOwnerName(address);
	
	function getOwnerName(addr) {
		const knownAddresses = {
			'9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk': 'ErgExplorer',
			// Add more known addresses here
		};
		return knownAddresses[addr] || null;
	}
	
	async function copyToClipboard() {
		if (!enableCopy || !address) return;
		
		try {
			await navigator.clipboard.writeText(address);
			
			// Show toast notification
			const toast = document.getElementById('liveToast');
			if (toast) {
				const bsToast = new bootstrap.Toast(toast);
				bsToast.show();
			}
			
			dispatch('copied', { address });
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}
	
	function handleClick(event) {
		if (enableCopy && !linkToAddress) {
			event.preventDefault();
			copyToClipboard();
		}
	}
</script>

<div class="address-formatter">
	{#if linkToAddress}
		<a href="/addresses/{address}" class="address-link" onclick={handleClick}>
			<span class="address-text" title={address}>
				{shortAddress}
			</span>
		</a>
	{:else}
		<span class="address-text" title={address} onclick={handleClick}>
			{shortAddress}
		</span>
	{/if}
	
	{#if showOwner && ownerName}
		<span class="owner-badge">
			{ownerName}
		</span>
	{/if}
	
	{#if enableCopy}
		<button 
			class="copy-btn" 
			onclick={copyToClipboard}
			title="Copy address to clipboard"
			aria-label="Copy address"
		>
			<i class="fas fa-copy"></i>
		</button>
	{/if}
</div>

<style>
	.address-formatter {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Courier New', monospace;
	}
	
	.address-text {
		font-size: 0.9rem;
		color: var(--bs-body-color);
		text-decoration: none;
	}
	
	.address-link {
		text-decoration: none;
		color: var(--main-color);
		transition: color 0.2s ease;
	}
	
	.address-link:hover {
		color: var(--main-color-hover);
		text-decoration: underline;
	}
	
	.address-text:not(.address-link) {
		cursor: pointer;
	}
	
	.owner-badge {
		background-color: var(--main-color);
		color: white;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}
	
	.copy-btn {
		background: none;
		border: none;
		color: var(--bs-secondary-color);
		cursor: pointer;
		padding: 0.2rem;
		border-radius: 4px;
		transition: all 0.2s ease;
		font-size: 0.8rem;
	}
	
	.copy-btn:hover {
		color: var(--main-color);
		background-color: rgba(var(--bs-primary-rgb), 0.1);
	}
	
	.copy-btn:active {
		transform: scale(0.95);
	}
</style>