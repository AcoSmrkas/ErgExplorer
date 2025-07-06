// Shared asset sorting utilities
import { getAssetTitleParams } from './tokenIcons.js';

/**
 * Sort assets by priority: 1) USD value, 2) has token icon, 3) alphabetically by name
 * @param {Array} assets - Array of asset objects with tokenId, name, amount, decimals
 * @param {Object} currentPrices - Price store object with tokenId -> price mapping
 * @returns {Array} Sorted array of assets
 */
export function sortAssetsByPriority(assets, currentPrices) {
  if (!assets || assets.length === 0) return [];

  return [...assets].sort((a, b) => {
    const priceA = currentPrices[a.tokenId];
    const priceB = currentPrices[b.tokenId];
    const adjustedAmountA = a.amount / Math.pow(10, a.decimals || 0);
    const adjustedAmountB = b.amount / Math.pow(10, b.decimals || 0);
    const usdValueA = priceA ? adjustedAmountA * priceA : 0;
    const usdValueB = priceB ? adjustedAmountB * priceB : 0;

    // 1. Sort by USD value (descending)
    if (usdValueA > 0 && usdValueB > 0) {
      return usdValueB - usdValueA;
    } else if (usdValueA > 0 && usdValueB === 0) {
      return -1;
    } else if (usdValueA === 0 && usdValueB > 0) {
      return 1;
    }

    // 2. Sort by icon presence
    const titleA = getAssetTitleParams(null, a.tokenId, a.name, true);
    const titleB = getAssetTitleParams(null, b.tokenId, b.name, true);
    const hasIconA = titleA.includes('<img') || titleA.includes('token-icon');
    const hasIconB = titleB.includes('<img') || titleB.includes('token-icon');

    if (hasIconA && !hasIconB) {
      return -1;
    } else if (!hasIconA && hasIconB) {
      return 1;
    }

    // 3. Custom name-based priority
    const getNamePriority = (name) => {
      if (!name) return 2;        // undefined name => lowest priority
      if (name.endsWith('_LP')) return 1; // ends with _LP => medium priority
      return 0;                   // everything else => highest priority
    };

    const namePriorityA = getNamePriority(a.name);
    const namePriorityB = getNamePriority(b.name);

    if (namePriorityA !== namePriorityB) {
      return namePriorityA - namePriorityB;
    }

    // 4. Alphabetical sort as tiebreaker
    return (a.name || '').localeCompare(b.name || '');
  });
}


/**
 * Check if an asset has a token icon available
 * @param {string} tokenId - The token ID to check
 * @returns {boolean} True if the asset has an icon
 */
export function hasTokenIcon(tokenId) {
  if (!tokenId) return false;
  const title = getAssetTitleParams(null, tokenId, '', true);
  return title.includes('<img') || title.includes('token-icon');
}