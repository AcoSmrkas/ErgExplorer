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

  // Add global event listeners for transaction hover
  document.addEventListener("mouseover", async (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-transaction-hover]");
      if (link) {
        const transactionId = link.getAttribute("data-transaction-hover");
        if (transactionId) {
          showTransactionPopup(transactionId, event);
        }
      }
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-transaction-hover]");
      if (link) {
        // Only hide if we're really leaving the transaction element and not going to popup
        const relatedTarget = event.relatedTarget;
        if (
          !relatedTarget ||
          (!link.contains(relatedTarget) &&
            (!relatedTarget.closest ||
              !relatedTarget.closest(".transaction-popup")))
        ) {
          hideTransactionPopup();
        }
      }
    }
  });

  // Prevent popup from hiding when hovering over the popup itself
  document.addEventListener("mouseover", (event) => {
    if (
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".transaction-popup")
    ) {
      cancelHideTransactionPopup();
    }
  });

  // Hide popup when leaving the popup
  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const popup = event.target.closest(".transaction-popup");
      if (popup) {
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !popup.contains(relatedTarget)) {
          hideTransactionPopup();
        }
      }
    }
  });

  console.log("Global transaction hover initialized");
}
