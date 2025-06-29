// Global box hover service
import { writable } from "svelte/store";
import { getCachedBoxData } from "./boxCache.js";

// Box popup state
export const boxPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  boxId: "",
  boxData: null,
  loading: false,
});

let hoverTimeout = null;

// Global box hover handler
export async function handleBoxHover(event) {
  const link = event.target.closest("[data-box-id]");
  if (link) {
    const boxId = link.dataset.boxId;

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Set popup position
    const x = event.clientX + 20;
    const y = event.clientY - 10;

    // Show basic popup immediately with loading state
    boxPopupState.set({
      visible: true,
      x,
      y,
      boxId,
      boxData: null, // Clear old box data
      loading: true,
    });

    // Fetch detailed box data using global cache
    try {
      const boxData = await getCachedBoxData(boxId);

      // Only update if we're still showing the same box
      boxPopupState.update((state) => {
        if (state.boxId === boxId && state.visible) {
          return {
            ...state,
            boxData,
            loading: false,
          };
        }
        return state;
      });
    } catch (error) {
      console.warn("Failed to load box data:", error);
      
      // Update loading state even on error
      boxPopupState.update((state) => {
        if (state.boxId === boxId && state.visible) {
          return {
            ...state,
            loading: false,
          };
        }
        return state;
      });
    }
  }
}

// Global box hover out handler
export function handleBoxHoverOut(event) {
  const link = event.target.closest("[data-box-id]");
  if (link) {
    // Set timeout to hide popup after delay
    hoverTimeout = setTimeout(() => {
      boxPopupState.update((state) => ({
        ...state,
        visible: false,
      }));
    }, 100); // Short delay to allow moving to popup
  }
}

// Note: Auto-initialization removed - now using centralized popup system
// This file is kept for compatibility but the initialization is handled by 
// the centralized popup manager in /lib/stores/popups/boxPopup.js