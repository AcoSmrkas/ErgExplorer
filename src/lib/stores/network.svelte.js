import { browser } from '$app/environment';

let network = $state('mainnet');

if (browser) {
	const storedNetwork = localStorage.getItem('network');
	network = storedNetwork || 'mainnet';
}

export function switchToMainnet() {
	network = 'mainnet';
	if (browser) {
		localStorage.setItem('network', network);
		window.location.href = 'https://ergexplorer.com';
	}
}

export function switchToTestnet() {
	network = 'testnet';
	if (browser) {
		localStorage.setItem('network', network);
		window.location.href = 'https://testnet.ergexplorer.com';
	}
}

export function getNetwork() {
	return network;
}

export function isMainnet() {
	return network === 'mainnet';
}

export function isTestnet() {
	return network === 'testnet';
}