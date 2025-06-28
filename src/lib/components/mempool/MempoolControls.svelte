<script>
	export let isSocketConnected = false;
	export let showConflicts = false;
	export let showInfoCard = true;
	export let onDismissInfo = () => {};
</script>

<div class="mempool-info">
	{#if showInfoCard}
		<div class="info-card">
			<i class="fas fa-info-circle info-icon"></i>
			<div class="info-content">
				<strong>Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block.
			</div>
			<button class="btn-dismiss" on:click={onDismissInfo} title="Dismiss">
				<i class="fas fa-times"></i>
			</button>
		</div>
	{/if}
	
	<div class="info-card">
		<div class="control-section">
			<div class="connection-status">
				<div class="status-indicator" class:connected={isSocketConnected} class:disconnected={!isSocketConnected}>
					<i class="fas fa-circle"></i>
				</div>
				<span class="status-text">
					{isSocketConnected ? 'Real-time' : 'Fallback'}
				</span>
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
		color: #28a745;
	}

	.status-indicator.disconnected {
		color: #dc3545;
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