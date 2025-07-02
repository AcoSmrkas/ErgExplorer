// Global z-index management for popups
import { writable } from "svelte/store";

// Base z-index for the first popup
const BASE_Z_INDEX = 1070;

// Store to track active popups and their z-indexes
const activePopups = writable(new Map());

// Counter for the next available z-index
let nextZIndex = BASE_Z_INDEX;

/**
 * Register a popup and get its z-index
 * @param {string} popupId - Unique identifier for the popup
 * @returns {number} The z-index for this popup
 */
export function registerPopup(popupId) {
  let currentZIndex;

  activePopups.update((popups) => {
    // If this popup is already registered, return its existing z-index
    if (popups.has(popupId)) {
      currentZIndex = popups.get(popupId);
      return popups;
    }

    // Always increment z-index for new popups, regardless of what's active
    // This ensures newer popups always appear above older ones
    currentZIndex = nextZIndex;
    popups.set(popupId, currentZIndex);
    nextZIndex++;

    return popups;
  });

  return currentZIndex;
}

/**
 * Unregister a popup when it's hidden
 * @param {string} popupId - Unique identifier for the popup
 */
export function unregisterPopup(popupId) {
  activePopups.update((popups) => {
    popups.delete(popupId);

    // Only reset counter if no popups are active AND we haven't gotten too high
    // This prevents z-index inflation but ensures proper ordering
    if (popups.size === 0 && nextZIndex < BASE_Z_INDEX + 100) {
      // Allow some buffer before resetting to prevent rapid resets
      setTimeout(() => {
        // Double-check no new popups appeared in the meantime
        let shouldReset = false;
        activePopups.subscribe((currentPopups) => {
          shouldReset = currentPopups.size === 0;
        })();

        if (shouldReset) {
          nextZIndex = BASE_Z_INDEX;
        }
      }, 1000); // Reset after 1 second of no activity
    }

    return popups;
  });
}

/**
 * Get the current z-index for a popup
 * @param {string} popupId - Unique identifier for the popup
 * @returns {number|null} The z-index or null if not registered
 */
export function getPopupZIndex(popupId) {
  let zIndex = null;
  activePopups.subscribe((popups) => {
    zIndex = popups.get(popupId) || null;
  })();
  return zIndex;
}

/**
 * Get the count of active popups
 * @returns {number} Number of active popups
 */
export function getActivePopupCount() {
  let count = 0;
  activePopups.subscribe((popups) => {
    count = popups.size;
  })();
  return count;
}

// Export the store for debugging/monitoring
export const activePopupsStore = activePopups;
