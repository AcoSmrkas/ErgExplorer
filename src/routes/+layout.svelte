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
	import BoxPopup from '$lib/components/ui/BoxPopup.svelte';
	import { initializeTheme } from '$lib/stores/theme.svelte.js';
	import { updatePrices } from '$lib/stores/priceStore.js';
	import { initializeTokenIcons } from '$lib/stores/tokenIconsStore.js';
	
	// New centralized popup system
	import { initializeTokenPopup, tokenPopupState } from '$lib/stores/popups/tokenPopup.js';
	import { initializeAddressPopup, addressPopupState } from '$lib/stores/popups/addressPopup.js';
	import { initializeBlockPopup, blockPopupState } from '$lib/stores/popups/blockPopup.js';
	import { initializeTransactionPopup, transactionPopupState } from '$lib/stores/popups/transactionPopup.js';
	import { initializeBoxPopup, boxPopupState } from '$lib/stores/popups/boxPopup.js';
	import '../app.css';

	/** @type {import('./$types').LayoutData} */
	let { data } = $props();

	onMount(() => {
		initializeTheme();
		
		// Initialize centralized popup system
		initializeTokenPopup();
		initializeAddressPopup();
		initializeBlockPopup();
		initializeTransactionPopup();
		initializeBoxPopup();
		
		// Update global prices from server data
		if (data.currentPrices) {
			updatePrices(data.currentPrices);
		}
		
		// Initialize token icons from server cache
		if (data.tokenIcons) {
			initializeTokenIcons(data.tokenIcons);
		}
		
		// Track initial page view
		if (typeof gtag !== 'undefined') {
			gtag('event', 'page_view', {
				page_title: document.title,
				page_location: window.location.href
			});
		}
	});
	
	// Track page changes for SvelteKit navigation
	$effect(() => {
		if (typeof gtag !== 'undefined' && $page.url) {
			gtag('event', 'page_view', {
				page_title: document.title,
				page_location: $page.url.href
			});
		}
	});
	
	// Subscribe to centralized popup states
	let tokenPopup = $state({
		visible: false,
		x: 0,
		y: 0,
		data: null,
		id: '',
		loading: false
	});
	
	let addressPopup = $state({
		visible: false,
		x: 0,
		y: 0,
		data: null,
		id: '',
		loading: false
	});
	
	let blockPopup = $state({
		visible: false,
		x: 0,
		y: 0,
		data: null,
		id: '',
		loading: false
	});
	
	let transactionPopup = $state({
		visible: false,
		x: 0,
		y: 0,
		data: null,
		id: '',
		loading: false
	});
	
	let boxPopup = $state({
		visible: false,
		x: 0,
		y: 0,
		data: null,
		id: '',
		loading: false
	});
	
	// Subscribe to popup states
	$effect(() => {
		const unsubToken = tokenPopupState.subscribe(state => {
			tokenPopup = { 
				visible: state.visible,
				x: state.x,
				y: state.y,
				data: state.data,
				id: state.id,
				loading: state.loading,
				tokenName: state.tokenName || '',
				tokenPrice: state.tokenPrice || null
			};
		});
		const unsubAddress = addressPopupState.subscribe(state => {
			addressPopup = { 
				visible: state.visible,
				x: state.x,
				y: state.y,
				data: state.data,
				id: state.id,
				loading: state.loading
			};
		});
		const unsubBlock = blockPopupState.subscribe(state => {
			blockPopup = { 
				visible: state.visible,
				x: state.x,
				y: state.y,
				data: state.data,
				id: state.id,
				loading: state.loading
			};
		});
		const unsubTransaction = transactionPopupState.subscribe(state => {
			transactionPopup = { 
				visible: state.visible,
				x: state.x,
				y: state.y,
				data: state.data,
				id: state.id,
				loading: state.loading
			};
		});
		const unsubBox = boxPopupState.subscribe(state => {
			boxPopup = { 
				visible: state.visible,
				x: state.x,
				y: state.y,
				data: state.data,
				id: state.id,
				loading: state.loading
			};
		});
		
		return () => {
			unsubToken();
			unsubAddress();
			unsubBlock();
			unsubTransaction();
			unsubBox();
		};
	});
	
	// Hide all popups on page navigation
	$effect(() => {
		const unsubscribe = page.subscribe(() => {
			// Hide all popups when navigating
			tokenPopupState.set({
				visible: false,
				x: 0,
				y: 0,
				data: null,
				id: '',
				loading: false
			});
			
			addressPopupState.set({
				visible: false,
				x: 0,
				y: 0,
				data: null,
				id: '',
				loading: false
			});
			
			blockPopupState.set({
				visible: false,
				x: 0,
				y: 0,
				data: null,
				id: '',
				loading: false
			});
			
			transactionPopupState.set({
				visible: false,
				x: 0,
				y: 0,
				data: null,
				id: '',
				loading: false
			});
			
			boxPopupState.set({
				visible: false,
				x: 0,
				y: 0,
				data: null,
				id: '',
				loading: false
			});
		});
		
		return unsubscribe;
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
		gtag('config', 'G-84SMBQLNNF', {
			page_title: document.title,
			page_location: window.location.href,
			send_page_view: false
		});
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
	z={1080}
	token={tokenPopup.data}
	tokenId={tokenPopup.id}
	name={tokenPopup.tokenName || ''}
	price={tokenPopup.tokenPrice || null}
	loading={tokenPopup.loading}
/>

<AddressPopup 
	visible={addressPopup.visible}
	x={addressPopup.x}
	y={addressPopup.y}
	address={addressPopup.id}
	balance={addressPopup.data}
	loading={addressPopup.loading}
/>

<BlockPopup 
	visible={blockPopup.visible}
	x={blockPopup.x}
	y={blockPopup.y}
	block={blockPopup.data}
	blockId={blockPopup.id}
	loading={blockPopup.loading}
/>

<TransactionPopup 
	visible={transactionPopup.visible}
	x={transactionPopup.x}
	y={transactionPopup.y}
	transaction={transactionPopup.data}
	transactionId={transactionPopup.id}
	loading={transactionPopup.loading}
/>

<BoxPopup 
	visible={boxPopup.visible}
	x={boxPopup.x}
	y={boxPopup.y}
	boxData={boxPopup.data}
	boxId={boxPopup.id}
	loading={boxPopup.loading}
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