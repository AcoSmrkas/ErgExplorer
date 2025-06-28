<script>
	export let data = {};
	export let title = 'Raw Data';
	export let icon = 'fa-code';
	
	let showRawData = false;
	
	function toggleRawData() {
		showRawData = !showRawData;
	}
</script>

<div class="card">
	<div class="card-header flex-between">
		<h5 class="card-title mb-0">
			<i class="fas {icon} me-2"></i>
			{title}
		</h5>
		<button 
			class="btn btn-outline-light btn-sm"
			onclick={toggleRawData}
			type="button"
		>
			<i class="fas {showRawData ? 'fa-eye-slash' : 'fa-eye'} me-1"></i>
			{showRawData ? 'Hide' : 'Show'} Raw Data
		</button>
	</div>
	{#if showRawData}
		<div class="card-body">
			<pre class="raw-data-display">{JSON.stringify(data, null, 2)}</pre>
		</div>
	{/if}
</div>