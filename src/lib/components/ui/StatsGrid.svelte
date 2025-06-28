<script>
	export let stats = []; // [{ label, value, color, icon, link }]
	export let columns = 4; // Number of columns (1-6)
	
	// Calculate Bootstrap column class
	$: columnClass = `col-md-${12 / columns}`;
</script>

<div class="row mb-4">
	{#each stats as stat}
		<div class="{columnClass} mb-3">
			<div class="card h-100 stat-card hover-lift">
				<div class="card-body text-center">
					{#if stat.icon}
						<div class="stat-icon mb-2">
							<i class="fas {stat.icon} text-{stat.color || 'primary'}"></i>
						</div>
					{/if}
					<h6 class="card-title text-muted small">{stat.label}</h6>
					{#if stat.link}
						<a href={stat.link} class="stat-value text-{stat.color || 'primary'} text-decoration-none">
							<h4 class="mb-0">{stat.value}</h4>
						</a>
					{:else}
						<h4 class="stat-value text-{stat.color || 'primary'} mb-0">{stat.value}</h4>
					{/if}
					{#if stat.subtitle}
						<small class="text-muted">{stat.subtitle}</small>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.stat-card {
		cursor: default;
	}
	
	/* Hover effects handled by global .hover-lift class */
	
	.stat-icon {
		font-size: 2rem;
	}
	
	.stat-value {
		font-weight: 700;
		transition: color 0.3s ease;
	}
	
	.stat-card:hover .stat-value {
		color: var(--main-color) !important;
	}
	
	@media (max-width: 768px) {
		.row > div {
			margin-bottom: 1rem;
		}
	}
</style>