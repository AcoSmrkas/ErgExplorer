import { writable } from 'svelte/store';

// Block popup state
export const blockPopupState = writable({
	visible: false,
	x: 0,
	y: 0,
	block: null,
	blockId: '',
	loading: false
});

let hoverTimeout = null;
let blockCache = new Map(); // Cache for block data
let currentState = {
	visible: false,
	x: 0,
	y: 0,
	block: null,
	blockId: '',
	loading: false
};

// Subscribe to state changes
blockPopupState.subscribe(state => {
	currentState = state;
});

export function initializeGlobalBlockHover() {
	if (typeof window === 'undefined') return;
	
	// Add global event listeners for block links
	document.addEventListener('mouseover', async (event) => {
		if (event.target && typeof event.target.closest === 'function') {
			const link = event.target.closest('[data-block-id]');
			if (link) {
				await handleGlobalBlockHover(event);
			}
		}
	});
	
	document.addEventListener('mouseout', (event) => {
		if (event.target && typeof event.target.closest === 'function') {
			const link = event.target.closest('[data-block-id]');
			if (link) {
				// Only hide if we're really leaving the block element and not going to popup
				const relatedTarget = event.relatedTarget;
				if (!relatedTarget || 
					(!link.contains(relatedTarget) && 
					 (!relatedTarget.closest || !relatedTarget.closest('.block-popup')))) {
					hideBlockPopup();
				}
			}
		}
	});
	
	// Prevent popup from hiding when hovering over the popup itself
	document.addEventListener('mouseover', (event) => {
		if (event.target && typeof event.target.closest === 'function' && event.target.closest('.block-popup')) {
			cancelHideBlockPopup();
		}
	});
	
	// Hide popup when leaving the popup
	document.addEventListener('mouseout', (event) => {
		if (event.target && typeof event.target.closest === 'function') {
			const popup = event.target.closest('.block-popup');
			if (popup) {
				const relatedTarget = event.relatedTarget;
				if (!relatedTarget || !popup.contains(relatedTarget)) {
					hideBlockPopup();
				}
			}
		}
	});
}

async function handleGlobalBlockHover(event) {
	const link = event.target.closest('[data-block-id]');
	if (link) {
		const blockId = link.dataset.blockId;
		
		// Clear any existing timeout
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
		}
		
		// Set popup position
		const x = event.clientX + 15;
		const y = event.clientY - 10;
		
		// Show basic popup immediately
		blockPopupState.set({
			visible: true,
			x,
			y,
			block: null,
			blockId,
			loading: true
		});
		
		// Check cache first
		if (blockCache.has(blockId)) {
			blockPopupState.update(state => ({
				...state,
				block: blockCache.get(blockId),
				loading: false
			}));
			return;
		}
		
		// Fetch detailed block data if not in cache
		try {
			const response = await fetch(`https://api.ergoplatform.com/api/v1/blocks/${blockId}`);
			if (response.ok) {
				const blockData = await response.json();
				// Cache the data
				blockCache.set(blockId, blockData);
				// Only update if still showing the same block
				if (currentState.visible && currentState.blockId === blockId) {
					blockPopupState.update(state => ({
						...state,
						block: blockData,
						loading: false
					}));
				}
			}
		} catch (error) {
			console.warn('Failed to fetch block details:', error);
			if (currentState.visible && currentState.blockId === blockId) {
				blockPopupState.update(state => ({
					...state,
					loading: false
				}));
			}
		}
	}
}


export function cancelHideBlockPopup() {
	if (hoverTimeout) {
		clearTimeout(hoverTimeout);
		hoverTimeout = null;
	}
}

export function hideBlockPopup() {
	hoverTimeout = setTimeout(() => {
		blockPopupState.set({
			visible: false,
			x: 0,
			y: 0,
			block: null,
			blockId: '',
			loading: false
		});
	}, 100);
}