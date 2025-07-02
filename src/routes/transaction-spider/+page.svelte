<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import TransactionSpiderMap from '$lib/components/spider-map/TransactionSpiderMap.svelte';
	import SpiderMapControls from '$lib/components/spider-map/SpiderMapControls.svelte';

	let txId = '';
	let showVisualization = false;
	let spiderMapComponent;
	let showControls = true;
	let showLegend = true;

	function handleTransactionSubmit() {
		if (txId.trim()) {
			showVisualization = true;
		}
	}

	function handleTxIdChange(event) {
		txId = event.target.value;
		if (!txId.trim()) {
			showVisualization = false;
		}
	}

	function handleControlsChanged(event) {
		// Pass controls to spider map component
		if (spiderMapComponent && spiderMapComponent.updateControls) {
			spiderMapComponent.updateControls(event.detail);
		}
	}

	function handleResetView() {
		if (spiderMapComponent && spiderMapComponent.resetView) {
			spiderMapComponent.resetView();
		}
	}

	function handleExportData() {
		if (spiderMapComponent && spiderMapComponent.exportData) {
			spiderMapComponent.exportData();
		}
	}
</script>

<svelte:head>
	<title>Transaction Spider Map - Erg Explorer</title>
	<meta name="description" content="Interactive visualization of transaction relationships and flows in the Ergo blockchain" />
</svelte:head>

<div class="container-fluid py-4 px-0">
	<div class="row p-0">
		<div class="col-12 p-0">
			<div class="glass-card p-4 mb-4">
				<h1 class="text-center mb-4">
					<i class="fas fa-project-diagram me-2"></i>
					Transaction Spider Map
				</h1>
				<p class="text-center text-muted mb-4">
					Explore transaction relationships by visualizing the flow of boxes and assets across the blockchain
				</p>
				
				<div class="search-container">
					<div class="input-group mb-3">
						<input 
							type="text" 
							class="form-control search-input" 
							placeholder="Enter transaction ID..."
							bind:value={txId}
							on:input={handleTxIdChange}
							on:keydown={(e) => e.key === 'Enter' && handleTransactionSubmit()}
						/>
						<button 
							class="btn btn-primary search-btn" 
							type="button"
							disabled={!txId.trim()}
							on:click={handleTransactionSubmit}
						>
							<i class="fas fa-search me-2"></i>
							Visualize
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	{#if showVisualization}
		<div class="row">
			<div class="col-lg-{showControls ? '9' : '12'} col-12">
				<div class="glass-card p-3 visualization-container">
					<!-- Toggle buttons -->
					<div class="toggle-buttons">
						<button 
							class="btn btn-sm btn-outline-light toggle-btn"
							on:click={() => showControls = !showControls}
							title="{showControls ? 'Hide' : 'Show'} Controls"
						>
							<i class="fas fa-{showControls ? 'chevron-right' : 'cog'}"></i>
						</button>
						<button 
							class="btn btn-sm btn-outline-light toggle-btn"
							on:click={() => showLegend = !showLegend}
							title="{showLegend ? 'Hide' : 'Show'} Legend"
						>
							<i class="fas fa-{showLegend ? 'eye-slash' : 'info-circle'}"></i>
						</button>
					</div>
					<TransactionSpiderMap {txId} {showLegend} bind:this={spiderMapComponent} />
				</div>
			</div>
			{#if showControls}
				<div class="col-lg-3 col-12">
					<div class="glass-card p-3">
						<SpiderMapControls 
							on:controlsChanged={handleControlsChanged}
							on:resetView={handleResetView}
							on:exportData={handleExportData}
						/>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.search-container {
		max-width: 600px;
		margin: 0 auto;
	}

	.search-input {
		background: var(--glass-bg-light);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--text-strong);
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}

	.search-input:focus {
		background: var(--glass-bg-medium);
		border-color: var(--main-color);
		box-shadow: 0 0 0 0.2rem rgba(var(--main-color-rgb), 0.25);
		color: var(--text-strong);
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.search-btn {
		background: linear-gradient(135deg, var(--main-color), rgba(var(--main-color-rgb), 0.8));
		border: none;
		min-width: 120px;
	}

	.search-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(var(--main-color-rgb), 0.9), var(--main-color));
		transform: translateY(-1px);
	}

	.search-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.visualization-container {
		min-height: 600px;
		height: 80vh;
		position: relative;
	}

	.toggle-buttons {
		position: absolute;
		top: 15px;
		right: 15px;
		z-index: 200;
		display: flex;
		gap: 8px;
	}

	.toggle-btn {
		background: var(--glass-bg-medium);
		backdrop-filter: var(--glass-blur-sm);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: var(--text-strong);
		border-radius: 8px;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.toggle-btn:hover {
		background: var(--glass-bg-light);
		border-color: var(--main-color);
		color: var(--main-color);
		transform: translateY(-1px);
	}

	.toggle-btn:focus {
		box-shadow: 0 0 0 0.2rem rgba(var(--main-color-rgb), 0.25);
	}

	.glass-card {
		background: var(--glass-bg-medium);
		backdrop-filter: var(--glass-blur-md);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	h1 {
		color: var(--text-strong);
		font-weight: 600;
	}

	.text-muted {
		color: var(--text-muted) !important;
	}

	@media (max-width: 991.98px) {
		.visualization-container {
			height: 60vh;
			min-height: 400px;
		}
	}
</style>