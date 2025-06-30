// Centralized popup management system
import { writable } from "svelte/store";

/**
 * Creates a popup management system with hover behavior
 * @param {Object} config - Configuration object
 * @param {string} config.triggerSelector - CSS selector for trigger elements (e.g., '[data-token-id]')
 * @param {string} config.popupClass - CSS class for the popup (e.g., 'token-popup')
 * @param {Function} config.dataExtractor - Function to extract data from trigger element
 * @param {Function} config.dataLoader - Function to load additional data
 * @param {number} config.hideDelay - Delay before hiding popup (default: 150ms)
 * @returns {Object} - Popup management object with state and functions
 */
export function createPopupManager(config) {
  const {
    triggerSelector,
    popupClass,
    dataExtractor,
    dataLoader,
    hideDelay = 150,
  } = config;

  // Create popup state store
  const initialState = {
    visible: false,
    x: 0,
    y: 0,
    loading: false,
    data: null,
    id: "",
    ...config.initialState,
  };

  const popupState = writable(initialState);
  let hoverTimeout = null;
  let currentId = null;

  // Show popup function
  async function showPopup(event, id, extractedData = {}) {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }

    currentId = id;

    // Set popup position
    const x = event.clientX + 20;
    const y = event.clientY - 10;

    // Show basic popup immediately with loading state
    popupState.set({
      ...initialState,
      visible: true,
      x,
      y,
      id,
      loading: true,
      ...extractedData,
    });

    // Load additional data if provided
    if (dataLoader && id) {
      try {
        const additionalData = await dataLoader(id);

        // Only update if we're still showing the same popup
        popupState.update((state) => {
          if (state.id === id && state.visible) {
            return {
              ...state,
              data: additionalData,
              loading: false,
            };
          }
          return state;
        });
      } catch (error) {
        // Silently handle data loading errors

        // Update loading state even on error
        popupState.update((state) => {
          if (state.id === id && state.visible) {
            return {
              ...state,
              loading: false,
            };
          }
          return state;
        });
      }
    } else {
      // No data loader, just remove loading state
      popupState.update((state) => ({
        ...state,
        loading: false,
      }));
    }
  }

  // Hide popup function
  function hidePopup() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    hoverTimeout = setTimeout(() => {
      popupState.set(initialState);
      currentId = null;
    }, hideDelay);
  }

  // Cancel hide popup function
  function cancelHide() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  // Initialize global event listeners
  function initialize() {
    if (typeof window === "undefined") return;

    // Mouse over handler for trigger elements and popup
    document.addEventListener("mouseover", async (event) => {
      if (event.target && typeof event.target.closest === "function") {
        const trigger = event.target.closest(triggerSelector);
        if (trigger) {
          // Clear any existing timeout when hovering over trigger
          cancelHide();

          const id = dataExtractor
            ? dataExtractor(trigger)
            : trigger.dataset.id;
          const extractedData = config.extractAdditionalData
            ? config.extractAdditionalData(trigger)
            : {};

          if (id) {
            await showPopup(event, id, extractedData);
          }
        }

        // Also handle hovering over the popup itself
        const popup = event.target.closest(`.${popupClass}`);
        if (popup) {
          cancelHide();
        }
      }
    });

    // Mouse out handler
    document.addEventListener("mouseout", (event) => {
      if (event.target && typeof event.target.closest === "function") {
        const trigger = event.target.closest(triggerSelector);
        const popup = event.target.closest(`.${popupClass}`);

        if (trigger || popup) {
          const relatedTarget = event.relatedTarget;

          // Don't hide if moving to popup, staying within trigger, or moving to another trigger
          if (relatedTarget) {
            const movingToPopup = relatedTarget.closest(`.${popupClass}`);
            const movingToTrigger = relatedTarget.closest(triggerSelector);
            const stayingInTrigger = trigger && trigger.contains(relatedTarget);
            const stayingInPopup = popup && popup.contains(relatedTarget);

            if (
              movingToPopup ||
              movingToTrigger ||
              stayingInTrigger ||
              stayingInPopup
            ) {
              return; // Don't hide popup
            }
          }

          // Hide popup with delay
          hidePopup();
        }
      }
    });
  }

  return {
    state: popupState,
    showPopup,
    hidePopup,
    cancelHide,
    initialize,
  };
}

// Common popup styles CSS (to be imported in global styles)
export const POPUP_BASE_STYLES = `
  .popup-base {
    position: fixed;
    z-index: 1070;
    max-width: 320px;
    min-width: 280px;
    padding: 1rem;
    pointer-events: auto;
    border: 1px solid var(--glass-border-medium);
    backdrop-filter: var(--glass-blur-xl);
    -webkit-backdrop-filter: var(--glass-blur-xl);
    box-shadow: var(--glass-shadow-lg);
    background: var(--glass-bg);
    border-radius: 12px;
  }

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--glass-border-light);
  }

  .popup-title {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .popup-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--glass-border-light);
    text-align: center;
  }

  .popup-link {
    color: var(--main-color);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .popup-link:hover {
    color: var(--main-color-hover);
    text-decoration: none;
  }

  .popup-loading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    color: var(--text-light);
    font-size: 0.85rem;
  }

  .popup-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid var(--glass-border-light);
    border-top: 2px solid var(--main-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
