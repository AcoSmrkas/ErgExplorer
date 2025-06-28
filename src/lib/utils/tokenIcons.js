// Token icon utilities using Svelte store
import { API_ENDPOINTS } from "./constants.js";
import {
  hasTokenIcon,
  getTokenIcon,
  updateTokenIcons,
} from "$lib/stores/tokenIconsStore.js";
import { ERG_SPAN } from "./formatting.js";

// Fallback function to load token icons directly (deprecated)
export async function getTokenIcons() {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.ERGEXPLORER}tokens/getTokenIcons`,
    );
    const data = await response.json();
    if (data.items) {
      const icons = {};
      for (const item of data.items) {
        icons[item.id] = item.iconurl;
      }
      updateTokenIcons(icons);
    }
  } catch (error) {
    console.warn("Failed to load token icons:", error);
  }
}

export function hasIcon(tokenId) {
  return hasTokenIcon(tokenId);
}

export function getIcon(tokenId) {
  return getTokenIcon(tokenId);
}

export function getAssetTitleParams(
  token,
  tokenId,
  name,
  iconIsToTheLeft,
  scam = false,
) {
  if (tokenId === undefined && name === "ERG") {
    return ERG_SPAN;
  }

  let imgSrc = "";
  if (hasIcon(tokenId)) {
    imgSrc = getIcon(tokenId);
  }

  if (name == "Crooks Finance Stake Key") {
    imgSrc = "https://crooks-fi.com/images/logo.png";
  }

  if (name == "Mew Fun Lottery Ticket") {
    imgSrc = `${API_ENDPOINTS.ERGEXPLORER}nftcache/bafybeie6z4zm7ahjvlawjfq4idojdrahklksygpfmb4zvlrx3id3h5dyty.png`;
  }

  if (token && token.iconurl) {
    imgSrc = token.iconurl;
  }

  // Format name or use truncated tokenId
  const displayName =
    name == "" || name == null
      ? tokenId.substring(0, 15) + (tokenId.length > 15 ? "..." : "")
      : name;

  // Create icon HTML if we have an image source
  const iconHtml = imgSrc
    ? `<img class="token-icon me-2" src="${imgSrc}" alt="${displayName}" />`
    : "";

  // Return the complete link like the original
  const content = iconIsToTheLeft
    ? iconHtml + displayName
    : displayName + (imgSrc ? " " + iconHtml : "");

  return `<a title="${scam ? "Reported as suspicious by users." : ""}" class="token-link ${scam ? "text-danger" : ""}" href="${getTokenUrl(tokenId)}" data-token-id="${tokenId}" data-token-name="${displayName}">${content}</a>`;
}

export function getTokenUrl(tokenId) {
  return `/tokens/${tokenId}`;
}

export function getAddressUrl(address) {
  return `/addresses/${address}`;
}

// Format address links like the original (deprecated - use AddressLink component instead)
export function formatAddressLink(address, displayLength = 10) {
  if (!address || address === "N/A") {
    return "N/A";
  }

  const displayAddress =
    address.substring(0, displayLength) +
    (address.length > displayLength ? "..." : "");
  return `<a class="address-link" href="${getAddressUrl(address)}" data-address="${address}" title="${address}">${displayAddress}</a>`;
}

// Get props for AddressLink component
export function getAddressLinkProps(
  address,
  name = "",
  startChars = 9,
  endChars = 3,
  showCopy = true,
) {
  return {
    address,
    name,
    startChars,
    endChars,
    showCopy,
  };
}
