<script>
	import { addressBook, addAddress, getOwner } from '$lib/stores/addressBook.js';
	import CopyButton from './CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	import { createEventDispatcher } from 'svelte';
	
	const dispatch = createEventDispatcher();
	
	// Address and display props
	export let address = '';
	export let name = ''; // Optional display name override
	export let displayLength = 12; // For both start and end when using simple truncation
	export let startChars = null; // Explicit start chars (overrides displayLength)
	export let endChars = null; // Explicit end chars (overrides displayLength)
	
	// Feature toggles
	export let linkToAddress = true;
	export let showCopy = true;
	export let showOwner = true; // Show owner badge from known addresses
	export let disablePopup = false;
	
	// Styling
	export let linkClass = 'address-link';
	export let displayClass = '';
	
	let currentAddressBook = [];
	
	// Subscribe to address book updates
	addressBook.subscribe(value => {
		currentAddressBook = value;
	});
	
	// Get owner name from address book or hardcoded known addresses
	function getOwnerName(addr, currentAddressBook) {
		if (!showOwner) return null;

		// First check the address book
		const bookOwner = getOwner(addr, currentAddressBook);
		if (bookOwner) return bookOwner;
		
		// Fallback to hardcoded known addresses for backwards compatibility
		const knownAddresses = {
			'9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk': 'ErgExplorer',
			// Add more known addresses here
		};
		return knownAddresses[addr] || null;
	}
	
	// Calculate display parameters
	$: actualStartChars = startChars !== null ? startChars : displayLength;
	$: actualEndChars = endChars !== null ? endChars : displayLength;
	
	// Format the display text - priority: name prop, then owner name, then formatted address
	$: displayText = getOwnerName(address, currentAddressBook) || name || (address ? 
		formatAddress(address, actualStartChars, actualEndChars) : 'Unknown Address');
	
	$: addressUrl = `/addresses/${address}`;
	
	// Add address to fetch queue when component mounts or address changes
	$: if (address && !name) {
		addAddress(address);
	}
	
	async function copyToClipboard() {
		if (!showCopy || !address) return;
		
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
		if (showCopy && !linkToAddress) {
			event.preventDefault();
			copyToClipboard();
		}
	}
</script>

{#if address}
	<div class="address-display {displayClass}">
		{#if displayText == 'N/A' || displayText == 'Multiple'}
			<span class="text-muted">N/A</span>
		{:else}
			{#if linkToAddress}
				<a 
					class={linkClass} 
					href={addressUrl}
					data-address={disablePopup ? null : address}
					on:click={handleClick}
				>
					{displayText}
				</a>
			{:else}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span 
					class="address-text" 
					title={address} 
					on:click={handleClick}
					class:clickable={showCopy}
				>
					{displayText}
				</span>
			{/if}
			
			{#if showCopy}
				<CopyButton 
					text={address} 
					label="Copy address to clipboard"
					successMessage="Address copied to clipboard!"
					errorMessage="Failed to copy address."
					inline={true}
					size="small"
				/>
			{/if}
		{/if}
	</div>
{:else}
	<span class="text-muted">N/A</span>
{/if}

<style>
	.address-link-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	
	.address-link-wrapper:hover :global(.copy-btn-inline) {
		opacity: 1;
	}
</style>