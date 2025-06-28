import { w as writable } from "./index3.js";
import { A as API_ENDPOINTS } from "./constants.js";
const addressBook = writable([]);
const pendingAddresses = /* @__PURE__ */ new Set();
let pendingPromise = null;
const addressesToFetch = [];
function getApiHost() {
  if (typeof window !== "undefined") {
    if (window.location.host === "dev.ergexplorer.com") {
      return "https://devapi.ergexplorer.com/";
    }
  }
  return API_ENDPOINTS.ERGEXPLORER;
}
function addAddress(address) {
  if (address == "N/A" || address == "Multiple") {
    return;
  }
  if (!address || pendingAddresses.has(address)) {
    return;
  }
  pendingAddresses.add(address);
  addressesToFetch.push(address);
  if (!pendingPromise) {
    pendingPromise = setTimeout(fetchAddressesInfo, 100);
  }
}
async function fetchAddressesInfo() {
  if (addressesToFetch.length === 0) {
    pendingPromise = null;
    return;
  }
  const addressesToQuery = [...addressesToFetch];
  addressesToFetch.length = 0;
  pendingPromise = null;
  try {
    const formData = new URLSearchParams();
    addressesToQuery.forEach((address) => {
      formData.append("addresses[]", address);
    });
    const response = await fetch(
      getApiHost() + "addressbook/getAddressesInfo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      }
    );
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      addressBook.update((currentBook) => {
        const newBook = [...currentBook];
        for (const item of data.items) {
          const existingIndex = newBook.findIndex(
            (entry) => entry.address === item.address
          );
          if (existingIndex >= 0) {
            newBook[existingIndex] = item;
          } else {
            newBook.push(item);
          }
        }
        return newBook;
      });
    }
    addressesToQuery.forEach((addr) => pendingAddresses.delete(addr));
  } catch (error) {
    console.warn("Failed to fetch address book info:", error);
    addressesToQuery.forEach((addr) => pendingAddresses.delete(addr));
  }
}
function getOwner(address, currentAddressBook) {
  if (!address || !currentAddressBook) {
    return void 0;
  }
  const entry = currentAddressBook.find((item) => item.address === address);
  if (!entry) {
    return void 0;
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
export {
  addAddress as a,
  addressBook as b,
  getOwner as g
};
