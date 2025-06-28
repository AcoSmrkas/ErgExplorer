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
			<button class="dismiss-btn" on:click={onDismissInfo} title="Dismiss">
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

	.info-card .dismiss-btn {
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: transparent;
		border: none;
		color: var(--text-light);
		cursor: pointer;
		border-radius: 4px;
	}

	.info-card .dismiss-btn:hover {
		background: var(--glass-bg-subtle);
		color: var(--main-color);
	}

	.control-section {
		display: flex;
		align-items: center;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.info-icon {
		color: #17a2b8;
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
			gap: 1rem;
			width: 100%;
		}
		
		.connection-status {
			order: -1;
			width: 100%;
			justify-content: center;
			padding: 0.5rem;
			background: var(--glass-bg-light);
			border-radius: 8px;
			border: 1px solid rgba(255, 255, 255, 0.1);
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