<script>
	import { addressBook, addAddress, getOwner } from '$lib/stores/addressBook.js';
	import CopyButton from './CopyButton.svelte';
	import { formatAddress } from '$lib/utils/formatting.js';
	
	export let address = '';
	export let name = ''; // Optional display name instead of address
	export let startChars = 9; // Characters to show at start
	export let endChars = 3; // Characters to show at end
	export let showCopy = true; // Whether to show copy button
	export let linkClass = 'address-link'; // CSS class for the link
	
	let currentAddressBook = [];
	
	// Subscribe to address book updates
	addressBook.subscribe(value => {
		currentAddressBook = value;
	});
	
	// Get owner name from address book
	$: ownerName = getOwner(address, currentAddressBook);
	
	// Format the display text - priority: name prop, then address book name, then formatted address
	$: displayText = name || ownerName || (address ? 
		formatAddress(address, startChars, endChars) : 'Unknown Address');
	
	$: addressUrl = `/addresses/${address}`;
	
	// Add address to fetch queue when component mounts or address changes
	$: if (address && !name) {
		addAddress(address);
	}
	
</script>

{#if address}
	<span class="address-link-wrapper">
		{#if displayText == 'N/A' || displayText == 'Multiple'}
			N/A
		{:else}
			<a 
				class={linkClass} 
				href={addressUrl} 
				data-address={address}
			>
				{displayText}
			</a>
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
	</span>
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