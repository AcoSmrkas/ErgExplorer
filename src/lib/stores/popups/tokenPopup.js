// Token popup using centralized popup system
import { createPopupManager } from '../popupManager.js';
import { getCachedToken } from '../tokenCache.js';
import { currentPrices } from '../priceStore.js';

// Create token popup manager
export const tokenPopupManager = createPopupManager({
  triggerSelector: '[data-token-id]',
  popupClass: 'token-popup',
  dataExtractor: (trigger) => trigger.dataset.tokenId,
  dataLoader: getCachedToken,
  hideDelay: 150,
  initialState: {
    tokenId: '',
    tokenName: '',
    tokenPrice: null,
    token: null
  },
  extractAdditionalData: (trigger) => ({
    tokenName: trigger.dataset.tokenName || '',
    tokenPrice: null // Will be populated from price store
  })
});

// Initialize the popup system
export function initializeTokenPopup() {
  console.log('Initializing token popup...');
  tokenPopupManager.initialize();
  console.log('Token popup initialized');
}

// Export the state for components to use
export const tokenPopupState = tokenPopupManager.state;