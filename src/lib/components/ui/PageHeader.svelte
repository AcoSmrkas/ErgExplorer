<script>
	export let title = '';
	export let icon = '';
	export let info = '';
	export let showInfo = true;
</script>

<div class="page-header glass-header mb-0">
	<div class="header-content">
		<h1 class="page-title">
			{#if icon}
				<i class="fas {icon} me-3 title-icon"></i>
			{/if}
			{title}
		</h1>
		{#if showInfo && info}
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
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-title {
		color: var(--text-strong);
		font-weight: 700;
		font-size: 2rem;
		margin: 0;
		display: flex;
		align-items: center;
	}

	.title-icon {
		color: var(--main-color);
		font-size: 1.8rem;
	}

	.header-info {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.info-text {
		color: var(--text-light);
		font-size: 0.95rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.page-header {
			padding: 1rem 1.5rem;
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

		.header-info {
			align-items: flex-start;
		}
	}
</style>