<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function resetView() {
		dispatch('resetView');
	}

	function exportData() {
		dispatch('exportData');
	}
</script>

<div class="controls-container">
	<h5 class="controls-title">
		<i class="fas fa-cog me-2"></i>
		Controls
	</h5>

	<div class="control-section">
		<h6 class="section-title">Actions</h6>
		
		<button 
			class="btn btn-outline-primary btn-sm w-100 mb-2"
			on:click={resetView}
		>
			<i class="fas fa-sync-alt me-2"></i>
			Reset View
		</button>

		<button 
			class="btn btn-outline-success btn-sm w-100"
			on:click={exportData}
		>
			<i class="fas fa-download me-2"></i>
			Export Data
		</button>
	</div>

	<div class="help-section">
		<h6 class="section-title">
			<i class="fas fa-question-circle me-1"></i>
			Help
		</h6>
		<div class="help-content">
			<p><strong>Click nodes</strong> to expand transaction relationships</p>
			<p><strong>Drag nodes</strong> to rearrange the layout</p>
			<p><strong>Scroll</strong> to zoom in/out</p>
			<p><strong>Different colors</strong> represent different node types</p>
		</div>
	</div>
</div>

<style>
	.controls-container {
		height: 100%;
		overflow-y: auto;
	}

	.controls-title {
		color: var(--text-strong);
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-weight: 600;
	}

	.control-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.control-section:last-child {
		margin-bottom: 0;
		border-bottom: none;
	}

	.section-title {
		color: var(--text-strong);
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
		font-weight: 600;
	}


	.btn {
		font-size: 0.85rem;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.btn-outline-primary {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	.btn-outline-primary:hover {
		background-color: var(--main-color);
		border-color: var(--main-color);
		color: white;
	}

	.btn-outline-success {
		border-color: #28a745;
		color: #28a745;
	}

	.btn-outline-success:hover {
		background-color: #28a745;
		border-color: #28a745;
		color: white;
	}

	.help-section {
		background: var(--glass-bg-light);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 0.75rem;
		margin-top: 1rem;
	}

	.help-content p {
		color: var(--text-muted);
		font-size: 0.75rem;
		margin-bottom: 0.5rem;
		line-height: 1.4;
	}

	.help-content p:last-child {
		margin-bottom: 0;
	}

	/* Custom scrollbar */
	.controls-container::-webkit-scrollbar {
		width: 4px;
	}

	.controls-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.controls-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 2px;
	}

	.controls-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
	}
</style>