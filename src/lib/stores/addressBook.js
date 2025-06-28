// Global address book service
import { writable } from "svelte/store";
import { getApiHost } from "../utils/constants.js";
import axios from "axios";

// Store for address book data
export const addressBook = writable([]);

// Store for pending addresses to fetch
const pendingAddresses = new Set();
let pendingPromise = null;

// Array to collect addresses before batch fetching
const addressesToFetch = [];

// Add address to be fetched in next batch
export function addAddress(address) {
  if (address == "N/A" || address == "Multiple") {
    return;
  }

  if (!address || pendingAddresses.has(address)) {
    return;
  }

  pendingAddresses.add(address);
  addressesToFetch.push(address);

  // Debounce the fetch to collect multiple addresses
  if (!pendingPromise) {
    pendingPromise = setTimeout(fetchAddressesInfo, 100);
  }
}

// Fetch address book info for collected addresses
async function fetchAddressesInfo() {
  if (addressesToFetch.length === 0) {
    pendingPromise = null;
    return;
  }

  const addressesToQuery = [...addressesToFetch];
  addressesToFetch.length = 0; // Clear the array
  pendingPromise = null;

  try {
    // Create URL-encoded form data
    const formData = new URLSearchParams();
    addressesToQuery.forEach((address) => {
      formData.append("addresses[]", address);
    });

    const response = await fetch(
      getApiHost() + "addressbook/getAddressesInfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Update the address book store
      addressBook.update((currentBook) => {
        const newBook = [...currentBook];

        // Add new entries, avoiding duplicates
        for (const item of data.items) {
          const existingIndex = newBook.findIndex(
            (entry) => entry.address === item.address,
          );
          if (existingIndex >= 0) {
            newBook[existingIndex] = item; // Update existing
          } else {
            newBook.push(item); // Add new
          }
        }

        return newBook;
      });
    }

    // Clear pending addresses that were fetched
    addressesToQuery.forEach((addr) => pendingAddresses.delete(addr));
  } catch (error) {
    console.warn("Failed to fetch address book info:", error);
    // Clear pending addresses on error
    addressesToQuery.forEach((addr) => pendingAddresses.delete(addr));
  }
}

// Get owner name for an address
export function getOwner(address, currentAddressBook) {
  if (!address || !currentAddressBook) {
    return undefined;
  }

  const entry = currentAddressBook.find((item) => item.address === address);
  if (!entry) {
    return undefined;
  }

  let owner = entry.name;

  if (entry.urltype && entry.urltype !== "") {
    owner += " (" + entry.urltype + ")";
  } else {
    let shortAdd = entry.address.substr(0, 4);
    if (shortAdd === "88dh") {
      shortAdd = entry.address.substr(entry.address.length - 4);
    }
    owner += " (" + shortAdd + ")";
  }

  return owner;
}

// Clear address book (useful for testing or resetting)
export function clearAddressBook() {
  addressBook.set([]);
  pendingAddresses.clear();
  addressesToFetch.length = 0;
  if (pendingPromise) {
    clearTimeout(pendingPromise);
    pendingPromise = null;
  }
}
