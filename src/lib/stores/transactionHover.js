import { writable } from "svelte/store";
import { browser } from "$app/environment";
import * as api from "$lib/utils/api.js";

// Transaction popup state
export const transactionPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  transaction: null,
  transactionId: "",
  loading: false,
});

let hideTimeout = null;
let currentTransactionId = null;

// Show transaction popup
export function showTransactionPopup(transactionId, event) {
  if (!browser || !transactionId) return;

  clearTimeout(hideTimeout);
  currentTransactionId = transactionId;

  // Set popup position
  const x = event.clientX + 15;
  const y = event.clientY - 10;

  transactionPopupState.set({
    visible: true,
    x,
    y,
    transaction: null,
    transactionId,
    loading: true,
  });

  // Load transaction data
  loadTransactionData(transactionId);
}

// Hide transaction popup
export function hideTransactionPopup() {
  if (!browser) return;

  hideTimeout = setTimeout(() => {
    transactionPopupState.set({
      visible: false,
      x: 0,
      y: 0,
      transaction: null,
      transactionId: "",
      loading: false,
    });
    currentTransactionId = null;
  }, 150);
}

// Cancel hide popup (for when mouse enters popup itself)
export function cancelHideTransactionPopup() {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }
}

// Load transaction data
async function loadTransactionData(transactionId) {
  if (!transactionId || transactionId !== currentTransactionId) return;

  try {
    const transaction = await api.getTransaction(transactionId);

    // Only update if this is still the current transaction
    if (currentTransactionId === transactionId) {
      transactionPopupState.update((state) => ({
        ...state,
        transaction,
        loading: false,
      }));
    }
  } catch (error) {
    console.warn("Failed to load transaction data:", error);

    // Only update if this is still the current transaction
    if (currentTransactionId === transactionId) {
      transactionPopupState.update((state) => ({
        ...state,
        transaction: null,
        loading: false,
      }));
    }
  }
}

// Initialize global transaction hover functionality
export function initializeGlobalTransactionHover() {
  if (typeof window === "undefined") return;

  // Mouse over handler for transaction links and popup
  document.addEventListener("mouseover", async (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-transaction-hover]");
      if (link) {
        const transactionId = link.getAttribute("data-transaction-hover");
        if (transactionId) {
          // Clear any existing timeout when hovering over transaction link
          clearTimeout(hideTimeout);
          showTransactionPopup(transactionId, event);
        }
      }

      // Also handle hovering over the popup itself
      const popup = event.target.closest(".transaction-popup");
      if (popup) {
        // Clear timeout when entering popup area
        clearTimeout(hideTimeout);
      }
    }
  });

  // Mouse out handler
  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-transaction-hover]");
      const popup = event.target.closest(".transaction-popup");

      if (link || popup) {
        const relatedTarget = event.relatedTarget;

        // Don't hide if moving to popup, staying within link, or moving to another transaction link
        if (relatedTarget) {
          const movingToPopup = relatedTarget.closest(".transaction-popup");
          const movingToTransactionLink = relatedTarget.closest(
            "[data-transaction-hover]",
          );
          const stayingInLink = link && link.contains(relatedTarget);
          const stayingInPopup = popup && popup.contains(relatedTarget);

          if (
            movingToPopup ||
            movingToTransactionLink ||
            stayingInLink ||
            stayingInPopup
          ) {
            return; // Don't hide popup
          }
        }

        // Hide popup with delay
        hideTransactionPopup();
      }
    }
  });

  console.log("Global transaction hover initialized");
}
