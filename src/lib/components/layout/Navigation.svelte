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

	function getThemeIcon() {
		if (theme === 'mew') {
			return '<img style="position:relative;top:-2px;height:18px;width:auto;" src="https://mewfinance.com/logo.png" alt="Mew Theme" />';
		}
		return '<i class="fas fa-moon"></i>';
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
		<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
			<i class="fa-solid fa-bars navbar-toggler-bars"></i>
		</button>
		
		<!-- Navigation Links -->
		<div class="collapse navbar-collapse flex-grow-1 text-right" id="navbarNav">
			<ul class="navbar-nav w-100 justify-content-center">
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
					<a class="nav-link" class:active={isActive('/addressbook')} href="/addressbook" target="_blank" rel="noopener">Address book</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="https://live.ergexplorer.com" target="_blank" rel="noopener">Live</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" class:active={isActive('/about')} href="/about">About</a>
				</li>
				
				<!-- Mobile Network & Theme Switchers -->
				<li class="nav-item d-block d-md-none">
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
				<li class="nav-item d-block d-md-none">
					<a class="nav-link theme-switcher d-flex align-items-center justify-content-center" href="#" onclick={handleThemeSwitch}>
						{@html getThemeIcon()}
					</a>
				</li>
			</ul>
			
			<!-- Desktop Right Navigation -->
			<div id="rightNav" class="d-none d-lg-block"><span></span></div>
			<ul class="navbar-nav ms-auto" style="position: absolute; right: 15px;">
				<!-- Desktop Network Switcher -->
				<li class="nav-item">
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
				<!-- Desktop Theme Switcher -->
				<li class="nav-item d-flex align-items-center">
					<!-- svelte-ignore a11y_invalid_attribute -->
					<a class="nav-link theme-switcher d-flex align-items-center justify-content-center" href="#" onclick={handleThemeSwitch}>
						{@html getThemeIcon()}
					</a>
				</li>
			</ul>
		</div>
	</div>
</nav>

<style>
	.navbar {
		/* Base navbar styling - glass effects handled by centralized system in app.css */
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
	
	.theme-switcher {
		height: 40px;
		width: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background-color 0.2s ease;
		color: var(--text-strong) !important;
	}
	
	.theme-switcher:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.dropdown-menu {
		border: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
	
	.dropdown-item:hover {
		background-color: var(--main-color);
		color: white !important;
	}
</style>