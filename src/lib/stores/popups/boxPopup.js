// Box popup using centralized popup system
import { createPopupManager } from "../popupManager.js";
import { getCachedBoxData } from "../boxCache.js";

// Create box popup manager
export const boxPopupManager = createPopupManager({
  triggerSelector: "[data-box-id]",
  popupClass: "box-popup",
  dataExtractor: (trigger) => trigger.dataset.boxId,
  dataLoader: getCachedBoxData,
  hideDelay: 150,
  initialState: {
    boxId: "",
    boxData: null,
  },
});

// Initialize the popup system
export function initializeBoxPopup() {
  boxPopupManager.initialize();
}

// Export the state for components to use
export const boxPopupState = boxPopupManager.state;
