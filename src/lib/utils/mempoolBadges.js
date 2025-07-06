// Shared mempool badge utilities
import { FEE_ADDRESS, FEE_ERGOTREE } from "./constants.js";
import { addAddress } from "../stores/addressBook.js";

// Helper function to check if a box indicates storage rent collection
function hasStorageRentExtension(box) {
  return (
    box.spendingProof &&
    box.spendingProof.extension &&
    box.spendingProof.extension["127"] === "0300"
  );
}

// Helper function to extract addresses from transaction with direction info
export function extractAddresses(transaction) {
  const addressMap = new Map(); // address -> { isInput: boolean, isOutput: boolean, isLastOutput: boolean }
  let hasStorageRent = false;

  // Extract from inputs
  if (transaction.inputs) {
    transaction.inputs.forEach((input) => {
      if (input.address && input.address !== FEE_ADDRESS) {
        const existing = addressMap.get(input.address) || {
          isInput: false,
          isOutput: false,
          isLastOutput: false,
        };
        existing.isInput = true;
        addressMap.set(input.address, existing);
      }

      // Check for storage rent extension
      if (hasStorageRentExtension(input)) {
        hasStorageRent = true;
      }
    });
  }

  // Extract from outputs and track if it's the last output
  if (transaction.outputs) {
    const nonFeeOutputs = transaction.outputs.filter(output => 
      output.address && 
      output.address !== FEE_ADDRESS && 
      output.ergoTree !== FEE_ERGOTREE
    );
    
    nonFeeOutputs.forEach((output, index) => {
      const existing = addressMap.get(output.address) || {
        isInput: false,
        isOutput: false,
        isLastOutput: false,
      };
      existing.isOutput = true;
      // Mark if this is the last non-fee output (likely change)
      // BUT only if there are multiple non-fee outputs (if there's only 1, it's not change)
      existing.isLastOutput = nonFeeOutputs.length > 1 && index === nonFeeOutputs.length - 1;
      addressMap.set(output.address, existing);
    });
  }

  return { addressMap, hasStorageRent };
}

// Helper function to get known addresses from address book with direction info
export function getKnownAddresses(
  addressMap,
  currentAddressBook,
  maxBadges = 3,
) {
  const seenNames = new Set();

  // Request addresses for address book
  for (const address of addressMap.keys()) {
    addAddress(address);
  }

  return Array.from(addressMap.entries())
    .map(([address, direction]) => {
      const entry = currentAddressBook.find((item) => item.address === address);
      return entry ? { ...entry, direction } : null;
    })
    .filter((entry) => entry && !entry.urltype?.toLowerCase().includes("fee")); // Remove undefined entries and fee addresses
}

// Helper function to get badge CSS class based on name or type
export function getBadgeClass(type, name) {
  // Check for specific name-based colors first
  const nameLower = name?.toLowerCase() || "";
  if (nameLower.includes("mew")) return "badge-mew";
  if (nameLower.includes("spectrum")) return "badge-spectrum";
  if (nameLower.includes("crooks")) return "badge-crooks";
  if (nameLower.includes("gold")) return "badge-gold";
  if (nameLower.includes("usd")) return "badge-usd";
  if (nameLower.includes("duck")) return "badge-duck";
  if (nameLower.includes("rosen")) return "badge-rosen";
  if (
    nameLower.includes("kucoin") ||
    nameLower.includes("coinex") ||
    nameLower.includes("kraken") ||
    nameLower.includes("kryptex") ||
    nameLower.includes("huobi") ||
    nameLower.includes("gate.io") ||
    nameLower.includes("xeggex")
  )
    return "badge-teal";

  // Fall back to type-based colors
  switch (type?.toLowerCase()) {
    case "exchange":
      return "badge-info";
    case "service":
      return "badge-primary";
    case "mining pool":
      return "badge-warning";
    case "nft artist":
      return "badge-success";
    default:
      return "badge-secondary";
  }
}

// Helper function to generate compact address badges HTML (for desktop table)
export function generateAddressBadges(extractResult, currentAddressBook) {
  const { addressMap, hasStorageRent } = extractResult;
  const badges = [];

  // Add storage rent badge if present
  if (hasStorageRent) {
    badges.push(
      `<span class="address-badge badge-storage-rent" title="Storage Rent Collection">📦 Storage</span>`,
    );
  }

  // Add address badges
  const allKnownAddresses = getKnownAddresses(addressMap, currentAddressBook);

  // Group by name to check if same entity appears in both input and output
  const nameDirections = new Map();
  const nameUrltypeDirections = new Map();
  
  allKnownAddresses.forEach((entry) => {
    // Track by name only
    const existing = nameDirections.get(entry.name) || {
      isInput: false,
      isOutput: false,
      hasLastOutput: false,
    };

    if (entry.direction.isInput) existing.isInput = true;
    if (entry.direction.isOutput) existing.isOutput = true;
    if (entry.direction.isLastOutput) existing.hasLastOutput = true;

    nameDirections.set(entry.name, existing);
    
    // Track by name + urltype combination
    const nameUrltype = `${entry.name}|${entry.urltype || ''}`;
    const existingUrltype = nameUrltypeDirections.get(nameUrltype) || {
      isInput: false,
      isOutput: false,
      hasLastOutput: false,
    };

    if (entry.direction.isInput) existingUrltype.isInput = true;
    if (entry.direction.isOutput) existingUrltype.isOutput = true;
    if (entry.direction.isLastOutput) existingUrltype.hasLastOutput = true;

    nameUrltypeDirections.set(nameUrltype, existingUrltype);
  });

  // Deduplicate by name and limit to maxBadges, preserving direction information
  const seenNames = new Set();
  const uniqueKnownAddresses = allKnownAddresses
    .filter((entry) => {
      if (seenNames.has(entry.name)) {
        return false;
      }
      seenNames.add(entry.name);
      return true;
    })
    .slice(0, 3);

  const addressBadges = uniqueKnownAddresses.map((entry) => {
    const badgeClass = getBadgeClass(entry.urltype, entry.name);
    const displayText = `${entry.name}${entry.urltype ? ` (${entry.urltype})` : ""}`;
    const baseContent =  entry.name;
    const nameDirection = nameDirections.get(entry.name) || {
      isInput: false,
      isOutput: false,
      hasLastOutput: false,
    };

    // Add arrows based on direction
    let badgeContent;
    if (nameDirection.isInput && nameDirection.isOutput && !nameDirection.hasLastOutput) {
      // Same entity name appears in both input and output, but NOT as the last output (change)
      // Check if the same name+urltype combination also appears in both directions
      const nameUrltype = `${entry.name}|${entry.urltype || ''}`;
      const nameUrltypeDirection = nameUrltypeDirections.get(nameUrltype) || {
        isInput: false,
        isOutput: false,
        hasLastOutput: false,
      };
      
      if (nameUrltypeDirection.isInput && nameUrltypeDirection.isOutput && !nameUrltypeDirection.hasLastOutput) {
        // Same name AND urltype in both directions - show urltype
        badgeContent = `↔${baseContent}${entry.urltype ? ` (${entry.urltype})` : ""}`;
      } else {
        // Same name but different urltypes - don't show urltype
        badgeContent = `↔${baseContent}`;
      }
    } else if (entry.direction.isInput) {
      // Input (sending from this address)
      badgeContent = `${baseContent + `${entry.urltype ? ` (${entry.urltype})` : ""}`}→`;
    } else {
      // Output (receiving to this address)
      badgeContent = `→${baseContent + `${entry.urltype ? ` (${entry.urltype})` : ""}`}`;
    }

    return `<span class="address-badge ${badgeClass}" title="${displayText}">${badgeContent}</span>`;
  });

  badges.push(...addressBadges);
  return badges.join(" ");
}
