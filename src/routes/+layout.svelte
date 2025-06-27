<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navigation from '$lib/components/layout/Navigation.svelte';
	import SearchForm from '$lib/components/ui/SearchForm.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import TokenPopup from '$lib/components/ui/TokenPopup.svelte';
	import AddressPopup from '$lib/components/ui/AddressPopup.svelte';
	import BlockPopup from '$lib/components/ui/BlockPopup.svelte';
	import TransactionPopup from '$lib/components/ui/TransactionPopup.svelte';
	import { initializeTheme } from '$lib/stores/theme.svelte.js';
	import { initializeGlobalTokenHover, tokenPopupState } from '$lib/stores/tokenHover.js';
	import { updatePrices } from '$lib/stores/priceStore.js';
	import { initializeGlobalAddressHover, addressPopupState } from '$lib/stores/addressHover.js';
	import { initializeGlobalBlockHover, blockPopupState } from '$lib/stores/blockHover.js';
	import { initializeGlobalTransactionHover, transactionPopupState } from '$lib/stores/transactionHover.js';
	import { initializeTokenIcons } from '$lib/stores/tokenIconsStore.js';
	import '../app.css';

	/** @type {import('./$types').LayoutData} */
	export let data;

	onMount(() => {
		initializeTheme();
		initializeGlobalTokenHover();
		initializeGlobalAddressHover();
		initializeGlobalBlockHover();
		initializeGlobalTransactionHover();
		
		// Update global prices from server data
		if (data.currentPrices) {
			updatePrices(data.currentPrices);
		}
		
		// Initialize token icons from server cache
		if (data.tokenIcons) {
			initializeTokenIcons(data.tokenIcons);
		}
	});
	
	// Subscribe to global popup states
	let tokenPopup = {
		visible: false,
		x: 0,
		y: 0,
		token: null,
		tokenId: '',
		tokenName: '',
		tokenPrice: null,
		loading: false
	};
	
	let addressPopup = {
		visible: false,
		x: 0,
		y: 0,
		address: '',
		balance: null,
		loading: false
	};
	
	let blockPopup = {
		visible: false,
		x: 0,
		y: 0,
		block: null,
		blockId: '',
		loading: false
	};
	
	let transactionPopup = {
		visible: false,
		x: 0,
		y: 0,
		transaction: null,
		transactionId: '',
		loading: false
	};
	
	tokenPopupState.subscribe(state => {
		tokenPopup = state;
	});
	
	addressPopupState.subscribe(state => {
		addressPopup = state;
	});
	
	blockPopupState.subscribe(state => {
		blockPopup = state;
	});
	
	transactionPopupState.subscribe(state => {
		transactionPopup = state;
	});
	
	// Hide all popups on page navigation
	page.subscribe(() => {
		tokenPopupState.set({
			visible: false,
			x: 0,
			y: 0,
			token: null,
			tokenId: '',
			tokenName: '',
			tokenPrice: null,
			loading: false
		});
		
		addressPopupState.set({
			visible: false,
			x: 0,
			y: 0,
			address: '',
			balance: null,
			loading: false
		});
		
		blockPopupState.set({
			visible: false,
			x: 0,
			y: 0,
			block: null,
			blockId: '',
			loading: false
		});
		
		transactionPopupState.set({
			visible: false,
			x: 0,
			y: 0,
			transaction: null,
			transactionId: '',
			loading: false
		});
	});
</script>

<svelte:head>
	<title>Erg Explorer - Ergo blockchain explorer</title>
	<meta name="description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo blockchain's blocks, addresses, transactions, tokens, and more.">
	<meta name="keywords" content="ergo, erg, blockchain, explorer, tool, browser, transaction, block, token, nft, scan, wallet, search, address, explore">
	
	<!-- OpenGraph -->
	<meta property="og:title" content="Erg Explorer - Ergo blockchain explorer" />
	<meta property="og:description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo Blockchain's blocks, addresses, transactions, tokens, and more." />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Erg Explorer - Ergo blockchain explorer" />
	<meta property="og:url" content="https://ergexplorer.com" />
	<meta property="og:image" content="https://ergexplorer.com/images/logo.png" />
	<meta property="og:image:url" content="https://ergexplorer.com/images/logo.png" />
	<meta property="og:image:alt" content="Visit Ergexplorer.com" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Erg Explorer - Ergo blockchain explorer" />
	<meta property="twitter:description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo Blockchain's blocks, addresses, transactions, tokens, and more." />
	<meta name="twitter:site" content="@ergexplorer" />
	<meta property="twitter:image" content="https://ergexplorer.com/images/logo.png" />
	
	<!-- Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=G-84SMBQLNNF"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', 'G-84SMBQLNNF');
	</script>
</svelte:head>

<Navigation />

<div class="container p-0 mx-auto">
	<div class="w-100 baner text-center p-0 mt-2 mt-md-3 mb-2 mb-md-3">
		<a class="p-0" href="https://ergominers.com" target="_blank" rel="noopener">
			<img src="/images/sigsmining.png" alt="Ad" style="max-height: 80px; width: auto; max-width:100%; margin: 0 auto; border: 1px solid var(--main-color); border-radius: 10px">
		</a>
	</div>
	
	<SearchForm />
	
	<main>
		<slot />
	</main>
</div>

<Footer />

<!-- Global Popups -->
<TokenPopup 
	visible={tokenPopup.visible}
	x={tokenPopup.x}
	y={tokenPopup.y}
	token={tokenPopup.token}
	tokenId={tokenPopup.tokenId}
	name={tokenPopup.tokenName}
	price={tokenPopup.tokenPrice}
	loading={tokenPopup.loading}
/>

<AddressPopup 
	visible={addressPopup.visible}
	x={addressPopup.x}
	y={addressPopup.y}
	address={addressPopup.address}
	balance={addressPopup.balance}
	loading={addressPopup.loading}
/>

<BlockPopup 
	visible={blockPopup.visible}
	x={blockPopup.x}
	y={blockPopup.y}
	block={blockPopup.block}
	blockId={blockPopup.blockId}
	loading={blockPopup.loading}
/>

<TransactionPopup 
	visible={transactionPopup.visible}
	x={transactionPopup.x}
	y={transactionPopup.y}
	transaction={transactionPopup.transaction}
	transactionId={transactionPopup.transactionId}
	loading={transactionPopup.loading}
/>

<style>
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}
	
	.baner {
		display: block;
	}
	
	.baner img {
		transition: opacity 0.2s ease;
	}
	
	.baner img:hover {
		opacity: 0.8;
	}
	
	/* Ensure container has no padding to match original */
	.container {
		padding-left: 0 !important;
		padding-right: 0 !important;
		margin-left: auto !important;
		margin-right: auto !important;
	}
	
	/* Reset any default margins that might cause left shift */
	:global(body) {
		margin: 0;
		padding: 0;
	}
	
	:global(html) {
		margin: 0;
		padding: 0;
	}
</style>