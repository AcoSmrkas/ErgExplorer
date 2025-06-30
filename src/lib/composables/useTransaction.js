import { onDestroy, onMount } from "svelte";
import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { transactionService } from "$lib/services/transactionService.js";

/**
 * Composable for monitoring transaction state changes
 * @param {string} txId - Transaction ID to monitor
 * @returns {Object} Reactive store with transaction data and helper functions
 */
export function useTransaction(txId) {
  console.log("useTransaction called with txId:", txId, "browser:", browser);

  // Create a default store for SSR compatibility
  const defaultStore = writable({
    txId: txId || "",
    data: null,
    status: "loading",
    source: null,
    lastUpdate: null,
    retryCount: 0,
    error: null,
  });

  let transactionStore = defaultStore;
  let isMonitoring = false;

  // Only start monitoring on the client side if we have a valid txId
  if (browser && txId && txId.trim() !== "") {
    console.log("Starting monitoring immediately for txId:", txId);
    transactionStore = transactionService.monitorTransaction(txId);
    isMonitoring = true;
  }

  // Start monitoring when component mounts (client-side only)
  onMount(() => {
    if (!isMonitoring && txId && txId.trim() !== "" && browser) {
      console.log("onMount: Starting monitoring for txId:", txId);
      try {
        transactionStore = transactionService.monitorTransaction(txId);
        isMonitoring = true;
      } catch (error) {
        console.error("Failed to start monitoring:", error);
      }
    } else {
      console.log(
        "onMount: Not starting monitoring - isMonitoring:",
        isMonitoring,
        "txId:",
        txId,
        "browser:",
        browser,
      );
    }
  });

  // Helper functions
  const helpers = {
    /**
     * Stop monitoring this transaction
     */
    stopMonitoring() {
      if (txId && isMonitoring) {
        transactionService.stopMonitoring(txId);
      }
    },

    /**
     * Manually resolve missing input box data
     */
    async resolveInputBoxes() {
      if (txId && isMonitoring) {
        await transactionService.resolveInputBoxes(txId);
      }
    },

    /**
     * Check if transaction is confirmed
     */
    isConfirmed: (txData) => txData?.status === "confirmed",

    /**
     * Check if transaction is unconfirmed/pending
     */
    isUnconfirmed: (txData) => txData?.status === "unconfirmed",

    /**
     * Check if transaction was dropped
     */
    isDropped: (txData) => txData?.status === "dropped",

    /**
     * Check if there's an error
     */
    hasError: (txData) => txData?.status === "error",

    /**
     * Check if still loading
     */
    isLoading: (txData) => txData?.status === "loading",

    /**
     * Get display status text
     */
    getStatusText: (txData) => {
      switch (txData?.status) {
        case "confirmed":
          return "Confirmed";
        case "unconfirmed":
          return "Pending";
        case "dropped":
          return "Dropped";
        case "error":
          return "Error";
        case "loading":
          return "Loading...";
        default:
          return "Unknown";
      }
    },

    /**
     * Get status badge type for UI
     */
    getStatusType: (txData) => {
      switch (txData?.status) {
        case "confirmed":
          return "success";
        case "unconfirmed":
          return "warning";
        case "dropped":
          return "danger";
        case "error":
          return "danger";
        case "loading":
          return "info";
        default:
          return "secondary";
      }
    },
  };

  // Cleanup when component is destroyed
  onDestroy(() => {
    if (txId && isMonitoring) {
      transactionService.stopMonitoring(txId);
    }
  });

  return {
    transaction: transactionStore,
    ...helpers,
  };
}
