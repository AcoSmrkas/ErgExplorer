// Block popup using centralized popup system
import { createPopupManager } from "../popupManager.js";
import { API_ENDPOINTS } from "../../utils/constants.js";

// Block data loader
async function loadBlockData(blockId) {
  const response = await fetch(
    `${API_ENDPOINTS.ERGOPLATFORM}blocks/${blockId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch block data: ${response.statusText}`);
  }
  return await response.json();
}

// Create block popup manager
export const blockPopupManager = createPopupManager({
  triggerSelector: "[data-block-id]",
  popupClass: "block-popup",
  dataExtractor: (trigger) => trigger.dataset.blockId,
  dataLoader: loadBlockData,
  hideDelay: 150,
  initialState: {
    blockId: "",
    block: null,
  },
});

// Initialize the popup system
export function initializeBlockPopup() {
  blockPopupManager.initialize();
}

// Export the state for components to use
export const blockPopupState = blockPopupManager.state;
