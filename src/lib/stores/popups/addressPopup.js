// Address popup using centralized popup system
import { createPopupManager } from "../popupManager.js";
import { getCachedAddressBalance } from "../addressCache.js";

// Create address popup manager
export const addressPopupManager = createPopupManager({
  triggerSelector: "[data-address]",
  popupClass: "address-popup",
  dataExtractor: (trigger) => trigger.dataset.address,
  dataLoader: getCachedAddressBalance,
  hideDelay: 150,
  initialState: {
    address: "",
    balance: null,
  },
});

// Initialize the popup system
export function initializeAddressPopup() {
  addressPopupManager.initialize();
}

// Export the state for components to use
export const addressPopupState = addressPopupManager.state;
