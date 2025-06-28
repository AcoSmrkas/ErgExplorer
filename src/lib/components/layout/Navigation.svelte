<script>
	import { page } from '$app/stores';
	import { switchTheme, getTheme } from '$lib/stores/theme.svelte.js';
	import { switchToMainnet, switchToTestnet, getNetwork } from '$lib/stores/network.svelte.js';

	let theme = $derived(getTheme());
	let network = $derived(getNetwork());
	let currentPath = $derived($page.url.pathname);

	function isActive(path) {
		if (path === '/' && currentPath === '/') return true;
		if (path !== '/' && currentPath.startsWith(path)) return true;
		return false;
	}

	function handleThemeSwitch(event) {
		event.preventDefault();
		switchTheme();
	}

	function handleMainnetSwitch(event) {
		event.preventDefault();
		switchToMainnet();
	}

	function handleTestnetSwitch(event) {
		event.preventDefault();
		switchToTestnet();
	}
</script>

<nav class="navbar navbar-expand-md navbar-dark p-1">
	<div class="container-fluid">
		<!-- Desktop Logo -->
		<ul class="navbar-nav ms-auto d-none d-md-block" style="position: absolute; left: 15px;">
			<a class="navbar-brand" href="/">
				<img id="erg-logo" src="/images/logo.png" alt="Erg" height="30">
			</a>
		</ul>
		
		<!-- Mobile Logo -->
		<a class="navbar-brand d-block d-md-none" href="/">
			<img src="/images/logo.png" alt="Logo" height="35">
		</a>
		
		<!-- Mobile Menu Toggle -->
		<button class="navbar-toggler mobile-menu-toggle" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
			<span class="navbar-toggler-icon">
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</span>
		</button>
		
		<!-- Navigation Links -->
		<div class="collapse navbar-collapse flex-grow-1 text-right mobile-nav-menu" id="navbarNav">
			<ul class="navbar-nav w-100 justify-content-center mobile-nav-list">
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/issued-tokens')} href="/issued-tokens">Tokens</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/latest-blocks')} href="/latest-blocks">Blocks</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/mempool')} href="/mempool">Mempool</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/addressbook')} href="/addressbook"rel="noopener">Address book</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="https://live.ergexplorer.com" target="_blank" rel="noopener">Live</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/about')} href="/about">About</a>
				</li>
				
				<!-- Mobile Network Switcher (left side) -->
				<li class="nav-item d-block d-md-none mobile-network-toggle">
					<div class="dropdown nav-link">
						<a class="btn nav-link dropdown-toggle text-light p-0 p-md-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
							<span class="networkType">{network === 'mainnet' ? 'Mainnet' : 'Testnet'}</span>
						</a>
						<ul class="dropdown-menu">
							<li><a class="dropdown-item" href="#" onclick={handleMainnetSwitch}>Mainnet</a></li>
							<li><a class="dropdown-item" href="#" onclick={handleTestnetSwitch}>Testnet</a></li>
						</ul>
					</div>
				</li>
				
				<!-- Mobile Theme Switcher (right side, at bottom) -->
				<li class="nav-item d-block d-md-none mobile-theme-toggle ms-auto">
					<a class="nav-link theme-switcher d-flex align-items-center justify-content-center" href="#" onclick={handleThemeSwitch}>
						{#if theme === 'mew'}
							<img style="position:relative;top:-2px;height:18px;width:auto;" src="https://mewfinance.com/logo.png" alt="Mew Theme" />
						{:else}
							<i class="fas fa-moon theme-switcher-icon"></i>
						{/if}
					</a>
				</li>
			</ul>
			
			<!-- Desktop Right Navigation -->
			<div id="rightNav" class="d-none d-lg-block"><span></span></div>
			<ul class="navbar-nav ms-auto" style="position: absolute; right: 15px;">
				<!-- Desktop Network Switcher -->
				<li class="nav-item">
					<div class="dropdown nav-link">
						<!-- svelte-ignore a11y_invalid_attribute -->
						<a class="btn nav-link dropdown-toggle text-light p-0 p-md-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
							<span class="networkType">{network === 'mainnet' ? 'Mainnet' : 'Testnet'}</span>
						</a>
						<ul class="dropdown-menu">
							<!-- svelte-ignore a11y_invalid_attribute -->
							<li><a class="dropdown-item" href="#" onclick={handleMainnetSwitch}>Mainnet</a></li>
							<!-- svelte-ignore a11y_invalid_attribute -->
							<li><a class="dropdown-item" href="#" onclick={handleTestnetSwitch}>Testnet</a></li>
						</ul>
					</div>
				</li>
				<!-- Desktop Theme Switcher -->
				<li class="nav-item d-flex align-items-center">
					<!-- svelte-ignore a11y_invalid_attribute -->
					<a class="nav-link theme-switcher d-flex align-items-center justify-content-center" href="#" onclick={handleThemeSwitch}>
						{#if theme === 'mew'}
							<img style="position:relative;top:-2px;height:18px;width:auto;" src="https://mewfinance.com/logo.png" alt="Mew Theme" />
						{:else}
							<i class="fas fa-moon theme-switcher-icon"></i>
						{/if}
					</a>
				</li>
			</ul>
		</div>
	</div>
</nav>

<style>
	.navbar {
		min-height: 55px;
	}
	
	.nav-link.active {
		color: var(--main-color) !important;
		font-weight: 600;
	}
	
	.navbar-brand img {
		transition: transform 0.2s ease;
	}
	
	.navbar-brand:hover img {
		transform: scale(1.05);
	}
	
	/* Enhanced Mobile Menu Toggle */
	.mobile-menu-toggle {
		border: none;
		background: transparent;
		padding: 8px 12px;
		border-radius: 8px;
		transition: all 0.3s ease;
		position: relative;
	}
	
	.mobile-menu-toggle:focus {
		box-shadow: none;
		outline: none;
	}
	
	.mobile-menu-toggle:hover {
		background: var(--main-color);
		backdrop-filter: blur(10px);
		transform: scale(1.05);
	}
	
	.mobile-menu-toggle:hover .bar {
		background: white;
	}
	
	/* Custom Hamburger Icon */
	.navbar-toggler-icon {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 20px;
		height: 16px;
	}
	
	.bar {
		width: 100%;
		height: 2px;
		background: var(--text-strong);
		border-radius: 2px;
		transition: all 0.3s ease;
		transform-origin: center;
	}
	
	/* Mobile Menu Animation */
	.mobile-nav-menu {
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	/* Mobile Navigation List Styling */
	@media (max-width: 767.98px) {
		.mobile-nav-list {
			padding: 0.5rem 0;
		}
		
		.mobile-nav-list .nav-item {
			margin: 0.125rem 0;
			transition: all 0.2s ease;
		}
		
		.mobile-nav-list .nav-link {
			padding: 0.875rem 1.5rem;
			font-size: 1rem;
			font-weight: 500;
			color: var(--text-strong) !important;
			text-align: center;
			display: block;
			border-radius: 8px;
			transition: all 0.2s ease;
			position: relative;
			background: transparent;
			border: none;
		}
		
		.mobile-nav-list .nav-link:hover {
			color: var(--main-color) !important;
			background: rgba(var(--main-color-rgb), 0.08);
		}
		
		.mobile-nav-list .nav-link.active {
			color: var(--main-color) !important;
			background: rgba(var(--main-color-rgb), 0.12);
			font-weight: 600;
		}
		
		/* Mobile Network Toggle Styling */
		.mobile-network-toggle {
			background: transparent !important;
			border: none;
		}
		
		.mobile-network-toggle:hover {
			background: transparent !important;
		}
		
		.mobile-network-toggle .dropdown .nav-link {
			background: transparent !important;
			border-radius: 8px;
		}
		
		.mobile-network-toggle .dropdown .nav-link:hover {
			background: transparent !important;
		}
		
		.mobile-network-toggle .dropdown-toggle {
			background: transparent !important;
		}
		
		.mobile-network-toggle .dropdown-toggle:hover {
			background: transparent !important;
		}
		
		/* Mobile Theme Toggle Styling */
		.mobile-theme-toggle {
			background: transparent !important;
			border: none;
			margin: 0;
		}
		
		.mobile-theme-toggle:hover {
			background: transparent !important;
		}
		
		.mobile-theme-toggle .nav-link {
			background: transparent !important;
		}
		
		.mobile-theme-toggle .nav-link:hover {
			background: transparent !important;
		}
	}
	
	.theme-switcher {
		height: 40px;
		width: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		transition: all 0.3s ease;
		color: var(--text-strong) !important;
	}

	.theme-switcher:hover {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		transform: scale(1.1);
	}

	.theme-switcher:hover > i {
		color: var(--main-color) !important;
	}

	.dropdown-menu {
		border: none;
		background: var(--glass-bg-medium);
		backdrop-filter: var(--glass-blur-md);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.dropdown-toggle:hover > span {
		color: var(--main-color) !important;
	}
	
	.dropdown-item {
		padding: 0.75rem 1.25rem;
		transition: all 0.3s ease;
		color: var(--text-strong) !important;
		font-weight: 500;
	}
	
	.dropdown-item:hover {
		background: linear-gradient(135deg, var(--main-color), rgba(var(--main-color-rgb), 0.8));
		color: white !important;
		transform: translateX(4px);
	}
</style>