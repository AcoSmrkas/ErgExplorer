<script>
	import TopVolumeTokens from './TopVolumeTokens.svelte';
	import GainersLosers from './GainersLosers.svelte';

	export let topVolumeTokens = [];
	export let gainersLosersData = [];
	export let selectedPeriod = '24h';
	export let onPeriodChange = () => {};
</script>

<div class="row w-100 mt-3" role="region" aria-label="Token data tables">
	<TopVolumeTokens {topVolumeTokens} />
	<GainersLosers {gainersLosersData} {selectedPeriod} {onPeriodChange} />
</div>