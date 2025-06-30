<script>
	import { formatDateString } from '$lib/utils/formatting.js';
	import StatusBadge from './StatusBadge.svelte';
	
	export let title = '';
	export let icon = '';
	export let info = '';
	export let showInfo = true;
	export let timestamp = null; // Unix timestamp or Date object
	export let statusBadge = null; // Status badge object: { text, type }
</script>

<div class="page-header glass-header mb-0">
	<div class="header-content">
		<div class="title-with-time">
			<h1 class="page-title">
				{#if icon}
					<i class="fas {icon} me-3 title-icon {statusBadge ? `status-${statusBadge.type}` : ''}"></i>
				{/if}
				{title}
			</h1>
			{#if timestamp}
				<span class="timestamp-inline">{formatDateString(timestamp)}</span>
			{:else if statusBadge}
				<StatusBadge text={statusBadge.text} type={statusBadge.type} size="small" />
			{/if}
		</div>
		{#if showInfo && info && !timestamp}
			<div class="header-info">
				<span class="info-text">{info}</span>
			</div>
		{/if}
		<slot name="info" />
	</div>
</div>

<style>
	.page-header {
		padding: 1.5rem 0;
		margin-bottom: 1rem;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: nowrap;
		gap: 1rem;
	}


	.title-with-time {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		min-width: 0;
	}

	.page-title {
		color: var(--text-strong);
		font-weight: 700;
		font-size: 2rem;
		margin: 0;
		display: flex;
		align-items: center;
	}

	.timestamp-inline {
		color: var(--text-light);
		font-size: 0.9rem;
		font-weight: 500;
		opacity: 0.8;
		white-space: nowrap;
	}

	.title-icon {
		color: var(--main-color);
		font-size: 1.8rem;
	}

	.title-icon.status-success {
		color: #28a745;
	}

	.title-icon.status-warning {
		color: #ffc107;
	}

	.header-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.info-text {
		color: var(--text-light);
		font-size: 0.95rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 1rem 1rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.title-icon {
			font-size: 1.4rem;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
		}


		.timestamp-inline {
			font-size: 0.8rem;
		}

		.header-info {
			align-items: flex-start;
		}
	}
</style>