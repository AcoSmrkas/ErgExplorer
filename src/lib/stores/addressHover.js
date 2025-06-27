// Global address hover service
import { writable } from "svelte/store";
import { getCachedAddressBalance } from "./addressCache.js";

// Address popup state
export const addressPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  address: "",
  balance: null,
  loading: false,
});

let hoverTimeout = null;

// Global address hover handler
export async function handleAddressHover(event) {
  const link = event.target.closest("[data-address]");
  if (link) {
    const address = link.dataset.address;

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set popup position
    const x = event.clientX + 15;
    const y = event.clientY - 10;

    // Show basic popup immediately with loading state
    addressPopupState.set({
      visible: true,
      x,
      y,
      address,
      balance: null, // Clear old balance data
      loading: true,
    });

    // Fetch detailed balance data using global cache
    try {
      const balance = await getCachedAddressBalance(address);

      // Only update if we're still showing the same address
      addressPopupState.update((state) => {
        if (state.address === address && state.visible) {
          return {
            ...state,
            balance: balance,
            loading: false,
          };
        }
        return state;
      });
    } catch (error) {
      console.warn("Failed to fetch address balance:", error);
      // Clear loading state on error
      addressPopupState.update((state) => ({
        ...state,
        loading: false,
      }));
    }
  }
}

// Global address hover hide handler
export function hideAddressPopup() {
  hoverTimeout = setTimeout(() => {
    addressPopupState.update((state) => ({
      ...state,
      visible: false,
    }));
  }, 100); // Small delay to prevent flicker
}

// Cancel hide popup (for when mouse enters popup itself)
export function cancelHideAddressPopup() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
}

// Initialize global event listeners for address links
export function initializeGlobalAddressHover() {
  if (typeof window === "undefined") return;

  // Add global event listeners for address links
  document.addEventListener("mouseover", async (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-address]");
      if (link) {
        await handleAddressHover(event);
      }
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const link = event.target.closest("[data-address]");
      if (link) {
        // Only hide if we're really leaving the address element and not going to popup
        const relatedTarget = event.relatedTarget;
        if (
          !relatedTarget ||
          (!link.contains(relatedTarget) &&
            (!relatedTarget.closest ||
              !relatedTarget.closest(".address-popup")))
        ) {
          hideAddressPopup();
        }
      }
    }
  });

  // Prevent popup from hiding when hovering over the popup itself
  document.addEventListener("mouseover", (event) => {
    if (
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".address-popup")
    ) {
      cancelHideAddressPopup();
    }
  });

  // Hide popup when leaving the popup
  document.addEventListener("mouseout", (event) => {
    if (event.target && typeof event.target.closest === "function") {
      const popup = event.target.closest(".address-popup");
      if (popup) {
        const relatedTarget = event.relatedTarget;
        if (
          !relatedTarget ||
          (!popup.contains(relatedTarget) &&
            (!relatedTarget.closest ||
              !relatedTarget.closest("[data-address]")))
        ) {
          hideAddressPopup();
        }
      }
    }
  });
}
