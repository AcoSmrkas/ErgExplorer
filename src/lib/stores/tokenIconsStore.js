// Token icons store with 24h caching
import { writable } from "svelte/store";

// Create writable store for token icons
export const tokenIconsStore = writable({});

// Static token icons (fallback)
const staticTokenIcons = {
  ERG: "/images/logo-new.png",
  // Common tokens that might have local icons
  e8b20745ee9d18817305f32eb21015831a48f02d40980de6e849f886dca7f807:
    "/images/tokens/flux.png",
  "4f792b75a0f1a46083824cfd6b4766d094698d71c37f7f5083bf09dec3d0fbcd":
    "/images/tokens/dude.png",
};

// Initialize token icons from server data
export function initializeTokenIcons(serverIcons) {
  if (serverIcons && typeof serverIcons === "object") {
    tokenIconsStore.update((current) => ({
      ...current,
      ...serverIcons,
    }));
  }
}

// Get icon URL for a token ID
export function getTokenIcon(tokenId) {
  let icons = {};
  tokenIconsStore.subscribe((value) => (icons = value))();

  // Check server-loaded icons first
  if (icons[tokenId]) {
    return icons[tokenId];
  }

  // Fallback to static icons
  return staticTokenIcons[tokenId] || null;
}

// Check if token has an icon
export function hasTokenIcon(tokenId) {
  return getTokenIcon(tokenId) !== null;
}

// Add or update token icons
export function updateTokenIcons(newIcons) {
  if (newIcons && typeof newIcons === "object") {
    tokenIconsStore.update((current) => ({
      ...current,
      ...newIcons,
    }));
  }
}
