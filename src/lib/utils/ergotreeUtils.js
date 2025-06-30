import { ErgoAddress } from "@fleet-sdk/core";

/**
 * Convert ergotree to readable address using fleet-sdk
 * @param {string} ergoTree - The ergotree hex string
 * @returns {string} - The converted address or original ergotree if conversion fails
 */
export function ergoTreeToAddress(ergoTree) {
  try {
    if (!ergoTree || typeof ergoTree !== "string") {
      return ergoTree || "";
    }

    // Create an Address object from the ergotree
    const address = ErgoAddress.fromErgoTree(ergoTree);
    return address.toString();
  } catch (error) {
    console.warn("Failed to convert ergotree to address:", error);
    // Return original ergotree if conversion fails
    return ergoTree;
  }
}

/**
 * Check if a string looks like an ergotree (hex string starting with specific patterns)
 * @param {string} str - String to check
 * @returns {boolean} - True if it looks like an ergotree
 */
export function isErgoTree(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  // Basic check: ergotrees are long hex strings
  const hexPattern = /^[0-9a-fA-F]+$/;
  return str.length > 60 && hexPattern.test(str);
}

/**
 * Smart address formatter - converts ergotree to address if needed
 * @param {string} addressOrErgoTree - Either an address or ergotree
 * @returns {string} - Always returns a readable address
 */
export function formatAddress(addressOrErgoTree) {
  if (!addressOrErgoTree) {
    return "";
  }

  // If it looks like an ergotree, convert it
  if (isErgoTree(addressOrErgoTree)) {
    return ergoTreeToAddress(addressOrErgoTree);
  }

  // Otherwise assume it's already an address
  return addressOrErgoTree;
}

/**
 * Get address type/network from ergotree or address
 * @param {string} addressOrErgoTree - Either an address or ergotree
 * @returns {string} - 'mainnet', 'testnet', or 'unknown'
 */
export function getAddressNetwork(addressOrErgoTree) {
  try {
    const address = formatAddress(addressOrErgoTree);

    if (address.startsWith("9")) {
      return "mainnet";
    } else if (address.startsWith("3")) {
      return "testnet";
    }

    return "unknown";
  } catch (error) {
    return "unknown";
  }
}
