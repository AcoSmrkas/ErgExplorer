// Global token hover service
import { writable } from "svelte/store";
import { getCachedToken } from "./tokenCache.js";
import { currentPrices } from "./priceStore.js";

// Token popup state
export const tokenPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  token: null,
  tokenId: "",
  tokenName: "",
  tokenPrice: null,
  loading: false,
});

let hoverTimeout = null;

// Global token hover handler
export async function handleTokenHover(event, priceData = {}) {
  const link = event.target.closest("[data-token-id]");
  if (link) {
    const tokenId = link.dataset.tokenId;
    const tokenName = link.dataset.tokenName || "";

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set popup position
    const x = event.clientX + 15;
    const y = event.clientY - 10;

    // Show basic popup immediately with loading state
    tokenPopupState.set({
      visible: true,
      x,
      y,
      token: null, // Clear old token data
      tokenId,
      tokenName,
      tokenPrice: priceData[tokenId] || null,
      loading: true,
    });

    // Fetch detailed token data using global cache
    try {
      const token = await getCachedToken(tokenId);

      // Only update if we're still showing the same token
      tokenPopupState.update((state) => {
        if (state.tokenId === tokenId && state.visible) {
          return {
            ...state,
            token: token,
            loading: false,
          };
        }
        return state;
      });
    } catch (error) {
      console.warn("Failed to fetch token details:", error);
      // Clear loading state on error
      tokenPopupState.update((state) => ({
        ...state,
        loading: false,
      }));
    }
  }
}

// Global token hover hide handler
export function hideTokenPopup() {
  hoverTimeout = setTimeout(() => {
    tokenPopupState.update((state) => ({
      ...state,
      visible: false,
    }));
  }, 100); // Small delay to prevent flicker
}

// Cancel hide popup (for when mouse enters popup itself)
export function cancelHideTokenPopup() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
}

// Initialize global event listeners for token links
export function initializeGlobalTokenHover() {
  if (typeof window === "undefined") return;

  // Add global event listeners for token links
  document.addEventListener("mouseover", async (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-token-id]");
      if (link) {
        // Get current prices from store
        let prices = {};
        currentPrices.subscribe((value) => (prices = value))();

        await handleTokenHover(event, prices);
      }
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-token-id]");
      if (link) {
        // Only hide if we're really leaving the token element and not going to popup or another token
        const relatedTarget = event.relatedTarget;
        if (
          !relatedTarget ||
          (!link.contains(relatedTarget) &&
            (!relatedTarget.closest ||
              (!relatedTarget.closest(".token-popup") &&
                !relatedTarget.closest("[data-token-id]"))))
        ) {
          hideTokenPopup();
        }
      }
    }
  });

  // Prevent popup from hiding when hovering over the popup itself
  document.addEventListener("mouseover", (event) => {
    if (
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".token-popup")
    ) {
      cancelHideTokenPopup();
    }
  });

  // Hide popup when leaving the popup
  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const popup = event.target.closest(".token-popup");
      if (popup) {
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !popup.contains(relatedTarget)) {
          hideTokenPopup();
        }
      }
    }
  });
}
