<script>
	import { formatNumber, formatCurrency, formatNumberLarge } from '$lib/utils/formatting.js';
	import { getTheme } from '$lib/stores/theme.svelte.js';

	let { ergPrice = null, protocolInfo = null, latestBlocks = [], networkStats = null } = $props();
	
	let theme = $derived(getTheme());
	
	function getLogoSrc() {
		return theme === 'mew' ? '/images/logo-new-mew.png' : '/images/logo-new.png';
	}
</script>

<div class="row w-100 div-cell-dark">
	<div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3">
		<div class="d-flex">
			<div class="me-3 text-center mx-auto index-card-symbol-holder">
				<img id="erg-logo" src={getLogoSrc()} alt="Ergo coin" style="width:50px; height:50px;">
			</div>
			<div class="flex-grow-1">
				<p><span class="erg-span"><b>ERG</b></span> price</p>
				<h2 class="text-strong index-card-values">
					{#if ergPrice}
						{formatCurrency(parseFloat(ergPrice.value), 2)}
					{:else}
						--
					{/if}
				</h2>
			</div>
		</div>
		<hr class="my-3">
		<div class="d-flex">
			<div class="me-3 text-center mx-auto index-card-symbol-holder">
				<i class="fas fa-globe erg-span index-card-symbol"></i>
			</div>
			<div class="flex-grow-1">
				<p><strong class="erg-span"></strong>Market cap</p>
				<h2 class="text-strong index-card-values">
					{ergPrice && protocolInfo ? formatCurrency((protocolInfo.supply / 1e9) * parseFloat(ergPrice.value), 0) : '--'}
				</h2>
			</div>
		</div>
	</div>
	<hr class="my-3 d-block d-md-none">
	<div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3">
		<div class="d-flex">
			<div class="me-3 text-center mx-auto index-card-symbol-holder">
				<i class="fas fa-bars erg-span index-card-symbol"></i>
			</div>
			<div class="flex-grow-1">
				<p>Block height</p>
				<h2 class="text-strong index-card-values">
					{latestBlocks.length > 0 ? formatNumber(latestBlocks[0].height, 0) : '--'}
				</h2>
			</div>
		</div>
		<hr class="my-3">
		<div class="d-flex">
			<div class="me-3 text-center mx-auto index-card-symbol-holder">
				<i class="fas fa-list erg-span index-card-symbol"></i>
			</div>
			<div class="flex-grow-1">
				<p><strong class="erg-span"></strong>Total transactions</p>
				<h2 class="text-strong index-card-values">
					{networkStats?.maxTxGix ? formatNumber(networkStats.maxTxGix, 0) : '--'}
				</h2>
			</div>
		</div>
	</div>		
	<hr class="my-3 d-block d-lg-none">
	<div class="col p-1 ps-lg-3 border-lg-start">
		<h2 class="erg-span" style="font-size:1.7em; margin-bottom: 0;">Protocol information</h2>
		<br>
		<h5 style="font-size:1em" class="text-light">Version: <span class="text-strong">{protocolInfo?.version || 'Unknown'}</span></h5>
		<h5 style="font-size:1em" class="text-light">Circulating Supply: <span class="text-strong">
			{protocolInfo?.supply ? formatNumber(protocolInfo.supply / 1e9, 1) + ' ERG' : '--'}
		</span></h5>
		<h5 style="font-size:1em" class="text-light">Max Supply: <span class="text-strong">97,739,924 ERG</span></h5>
	</div>
</div>