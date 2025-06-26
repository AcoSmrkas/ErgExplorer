<script>
	import { themeConfig, styleUtils } from '$lib/styles/theme-config.js';
	import { css, patterns, compose } from '$lib/styles/global-styles.js';
	
	// Demo data for showcasing components
	const demoComponents = [
		{
			name: 'Buttons',
			items: [
				{ label: 'Primary Button', class: styleUtils.buttonClass('primary') },
				{ label: 'Secondary Button', class: styleUtils.buttonClass('secondary') },
				{ label: 'Info Button', class: styleUtils.buttonClass('info') },
				{ label: 'Small Button', class: styleUtils.buttonClass('primary', 'sm') },
				{ label: 'Large Button', class: styleUtils.buttonClass('primary', 'lg') }
			]
		},
		{
			name: 'Cards',
			items: [
				{ label: 'Default Card', class: styleUtils.cardClass('default') },
				{ label: 'Dark Card', class: styleUtils.cardClass('dark') },
				{ label: 'Summary Card', class: styleUtils.cardClass('summary') }
			]
		},
		{
			name: 'Typography',
			items: [
				{ label: 'Primary Text', class: styleUtils.textClass('primary') },
				{ label: 'Secondary Text', class: styleUtils.textClass('secondary') },
				{ label: 'Muted Text', class: styleUtils.textClass('muted') },
				{ label: 'Accent Text', class: styleUtils.textClass('accent') },
				{ label: 'Bold Text', class: styleUtils.textClass('primary', 'bold') }
			]
		}
	];
	
	const colors = themeConfig.colors;
	const spacing = themeConfig.spacing;
</script>

<div class="style-guide p-4">
	<h2 class={css.text.heading}>Style Guide</h2>
	<p class={css.text.muted}>
		This style guide demonstrates the centralized styling system for easy maintenance and updates.
	</p>
	
	<!-- Color Palette -->
	<section class="mb-5">
		<h3 class={css.text.subheading}>Color Palette</h3>
		<div class="row g-3">
			{#each Object.entries(colors) as [name, value]}
				<div class="col-md-3">
					<div class={compose(css.card.default, 'text-center')}>
						<div 
							class="color-swatch mb-2" 
							style="background-color: {value}; height: 60px; border-radius: 4px;"
						></div>
						<h6 class={css.text.body}>{name}</h6>
						<code class={css.text.muted}>{value}</code>
					</div>
				</div>
			{/each}
		</div>
	</section>
	
	<!-- Component Examples -->
	{#each demoComponents as section}
		<section class="mb-5">
			<h3 class={css.text.subheading}>{section.name}</h3>
			<div class="row g-3">
				{#each section.items as item}
					<div class="col-md-4">
						<div class={css.card.default}>
							<p class={css.text.muted}>
								{item.label}
							</p>
							{#if section.name === 'Buttons'}
								<button class={item.class}>
									{item.label}
								</button>
							{:else if section.name === 'Cards'}
								<div class={compose(item.class, 'p-2')}>
									<p class={css.text.body}>
										This is a {item.label.toLowerCase()} example.
									</p>
								</div>
							{:else if section.name === 'Typography'}
								<p class={item.class}>
									{item.label} - The quick brown fox jumps over the lazy dog.
								</p>
							{/if}
							<code class={compose(css.text.muted, 'small d-block mt-2')}>
								{item.class}
							</code>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}
	
	<!-- Spacing Scale -->
	<section class="mb-5">
		<h3 class={css.text.subheading}>Spacing Scale</h3>
		<div class="row g-3">
			{#each Object.entries(spacing) as [name, value]}
				<div class="col-md-2">
					<div class={css.card.default}>
						<div 
							class="spacing-demo bg-primary mb-2" 
							style="height: {value}; background-color: var(--main-color); opacity: 0.3;"
						></div>
						<h6 class={css.text.body}>{name}</h6>
						<code class={css.text.muted}>{value}</code>
					</div>
				</div>
			{/each}
		</div>
	</section>
	
	<!-- Usage Examples -->
	<section class="mb-5">
		<h3 class={css.text.subheading}>Usage Examples</h3>
		<div class={css.card.dark}>
			<h6 class={css.text.body}>JavaScript Usage:</h6>
			<pre class={css.text.muted}><code>{`import { styleUtils, css } from '$lib/styles/theme-config.js';

// Generate button classes
const buttonClass = styleUtils.buttonClass('primary', 'lg');

// Compose multiple utility classes
const cardClass = compose(css.card.default, css.text.center);

// Use predefined patterns
const loadingClass = patterns.loading;`}</code></pre>
		</div>
	</section>
</div>

<style>
	.style-guide {
		max-width: 1200px;
		margin: 0 auto;
	}
	
	.color-swatch {
		border: 1px solid var(--borders);
	}
	
	.spacing-demo {
		border-radius: 2px;
	}
	
	pre {
		background-color: var(--forms-bg);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--borders);
		overflow-x: auto;
	}
	
	code {
		font-family: var(--font-mono, 'DejaVu', monospace);
		font-size: 0.875rem;
	}
</style>