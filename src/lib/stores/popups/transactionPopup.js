// Transaction popup using centralized popup system
import { createPopupManager } from "../popupManager.js";
import * as api from "../../utils/api.js";

// Create transaction popup manager
export const transactionPopupManager = createPopupManager({
  triggerSelector: "[data-transaction-hover]",
  popupClass: "transaction-popup",
  dataExtractor: (trigger) => {
    // Ignore mempool transaction hovers (they have their own popup)
    if (trigger.closest(".mempool-container")) {
      return null;
    }
    return trigger.getAttribute("data-transaction-hover");
  },
  dataLoader: api.getTransaction,
  hideDelay: 150,
  initialState: {
    transactionId: "",
    transaction: null,
  },
});

// Initialize the popup system
export function initializeTransactionPopup() {
  transactionPopupManager.initialize();
}

// Export the state for components to use
export const transactionPopupState = transactionPopupManager.state;
