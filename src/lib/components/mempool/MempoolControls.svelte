<script>
	import { formatNumber } from '$lib/utils/formatting.js';

	export let isSocketConnected = false;
	export let loadingStatus = 'loaded';
	export let isActualFallback = false;
	export let showConflicts = false;
	export let showInfoCard = true;
	export let blockHeight = null;
	export let onDismissInfo = () => {};

	// Determine connection status display
	$: connectionStatus = (() => {
		// If we're still in initial loading phases, show "Initializing"
		if (loadingStatus === 'connecting' || loadingStatus === 'waiting_data') {
			return { text: 'Initializing', class: 'initializing' };
		}
		
		// If we're actually using fallback (after socket failed), show "Fallback"
		if (isActualFallback) {
			return { text: 'Fallback', class: 'disconnected' };
		}
		
		// If socket is connected and we're using real-time data, show "Real-time"
		if (isSocketConnected) {
			return { text: 'Real-time', class: 'connected' };
		}
		
		// Default case (shouldn't normally happen)
		return { text: 'Loading', class: 'initializing' };
	})();
</script>

<div class="mempool-info">
	{#if showInfoCard}
		<div class="info-card">
			<i class="fas fa-info-circle info-icon"></i>
			<div class="info-content">
				<strong>Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block.
			</div>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="btn-dismiss" on:click={onDismissInfo} title="Dismiss">
				<i class="fas fa-times"></i>
			</button>
		</div>
	{/if}
	
	<div class="info-card">
		<div class="control-section">
			<div class="connection-status">
				<div class="status-indicator" class:connected={connectionStatus.class === 'connected'} class:disconnected={connectionStatus.class === 'disconnected'} class:initializing={connectionStatus.class === 'initializing'}>
					<i class="fas fa-circle"></i>
				</div>
				<span class="status-text">
					{connectionStatus.text}
				</span>
			</div>

			<div>
				{#if blockHeight}
					<span class="block-height">
						Block #{formatNumber(blockHeight)}
					</span>
				{/if}
			</div>
			
			<div class="form-check form-switch">
				<input 
					class="form-check-input" 
					type="checkbox" 
					id="conflictsToggle"
					bind:checked={showConflicts}
				>
				<label class="form-check-label" for="conflictsToggle">
					Double-spends only
				</label>
			</div>
		</div>
	</div>
</div>

<style>
	.mempool-info {
		margin-bottom: 1.5rem;
	}

	/* Dismiss button styles handled by global .btn-dismiss class */

	.control-section {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.info-icon {
		color: var(--main-color);
		font-size: 1.2rem;
		flex-shrink: 0;
	}

	.info-content {
		color: var(--text-strong);
		font-size: 0.95rem;
	}

	.connection-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.status-indicator {
		font-size: 0.7rem;
	}

	.status-indicator.connected {
		color: #28a745; /* Green */
	}

	.status-indicator.disconnected {
		color: #dc3545; /* Red */
	}

	.status-indicator.initializing {
		color: #fd7e14; /* Orange */
		animation: pulse-orange 1.5s ease-in-out infinite;
	}

	@keyframes pulse-orange {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.status-text {
		color: var(--text-light);
		font-weight: 500;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 768px) {
		.control-section {
			/* Apply global mobile control section class */
		}
		
		.connection-status {
			/* Apply global mobile connection status class */
		}
		
		.form-check {
			flex: 1;
			text-align: center;
		}
		
		.form-check-label {
			font-size: 0.9rem;
			float: left;
			position: relative;
			top: 1px;
			left: 5px;
		}
	}
</style>