import { browser } from '$app/environment';

let theme = $state('dark');

if (browser) {
	const storedTheme = localStorage.getItem('theme');
	theme = storedTheme || 'dark';
	updateThemeDOM();
}

function updateThemeDOM() {
	if (!browser) return;
	
	const bsTheme = theme === 'light' ? 'light' : 'dark';
	const indexEl = document.getElementById('index');
	
	if (indexEl) {
		indexEl.setAttribute('data-bs-theme', bsTheme);
		indexEl.setAttribute('data-theme', theme);
	}
	
	const additionalThemeEl = document.getElementById('additionalTheme');
	if (additionalThemeEl) {
		if (theme !== 'light') {
			additionalThemeEl.setAttribute('href', 'https://cdn.jsdelivr.net/npm/bootstrap-dark-5@1.1.3/dist/css/bootstrap-nightfall.min.css');
		} else {
			additionalThemeEl.setAttribute('href', '');
		}
	}
}

function loadCustomColor() {
	if (!browser) return;
	
	const params = new URLSearchParams(window.location.search);
	
	if (params.get('mainColor') !== null) {
		const mainColor = params.get('mainColor');
		if (mainColor === '') {
			localStorage.removeItem('main-color');
		} else {
			localStorage.setItem('main-color', mainColor);
		}
	}
	
	if (params.get('mainColorHover') !== null) {
		const mainColorHover = params.get('mainColorHover');
		if (mainColorHover === '') {
			localStorage.removeItem('main-color-hover');
		} else {
			localStorage.setItem('main-color-hover', mainColorHover);
		}
	}
	
	const mainColor = localStorage.getItem('main-color');
	const mainColorHover = localStorage.getItem('main-color-hover');
	
	if (mainColor) {
		document.documentElement.style.setProperty('--main-color', mainColor);
	}
	
	if (mainColorHover) {
		document.documentElement.style.setProperty('--main-color-hover', mainColorHover);
	}
}

export function switchTheme() {
	const themes = ['light', 'dark', 'mew'];
	const currentIndex = themes.indexOf(theme);
	const nextIndex = (currentIndex + 1) % themes.length;
	theme = themes[nextIndex];
	
	if (browser) {
		localStorage.setItem('theme', theme);
		updateThemeDOM();
	}
}

export function getTheme() {
	return theme;
}

export function initializeTheme() {
	if (browser) {
		updateThemeDOM();
		loadCustomColor();
	}
}