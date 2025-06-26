<script>
	import { formatErgValue, formatAddress } from '$lib/utils/formatting.js';
	import { fade } from 'svelte/transition';
	import CopyButton from './CopyButton.svelte';
	
	export let address = '';
	export let balance = null;
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let loading = false;
	
	$: displayAddress = address ? 
		(address.length <= 12 ? 
			address : 
			formatAddress(address, 15, 4)
		) : 'Unknown Address';
	$: hasBalanceData = balance !== null && balance !== undefined;
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
				<div class="address-name">Address Balance</div>
			</div>
		</div>
		
		<!-- Full address with copy button -->
		<div class="address-id-section mb-2">
			<div class="address-full">{formatAddress(address, 15, 4)}</div>
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
						<strong>Unconfirmed:</strong> {formatErgValue(balance.unconfirmed.nanoErgs)} ERG
					</div>
				{/if}
				
				{#if balance?.confirmed?.nanoErgs !== undefined}
					<div class="address-total">
						<strong class="erg-span">Total Balance:</strong> {@html formatErgValue((balance.confirmed?.nanoErgs || 0) + (balance.unconfirmed?.nanoErgs || 0))}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}