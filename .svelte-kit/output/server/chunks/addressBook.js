import { w as writable } from "./index3.js";
import { A as API_ENDPOINTS } from "./api.js";
const tokenCache = writable(/* @__PURE__ */ new Map());
const CACHE_DURATION = 5 * 60 * 1e3;
function clearExpiredCache() {
  const now = Date.now();
  tokenCache.update((cache) => {
    const newCache = /* @__PURE__ */ new Map();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp < CACHE_DURATION) {
        newCache.set(key, value);
      }
    }
    return newCache;
  });
}
if (typeof window !== "undefined") {
  setInterval(clearExpiredCache, CACHE_DURATION);
}
const priceStore = writable({});
const ergPrice = writable(null);
const currentPrices = writable({});
priceStore.subscribe((prices) => {
  if (prices.ERG) {
    ergPrice.set(prices.ERG);
  }
  const tokenPrices = { ...prices };
  delete tokenPrices.ERG;
  currentPrices.set(tokenPrices);
});
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
    const response = await fetch(getApiHost() + "addressbook/getAddressesInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        addresses: addressesToQuery
      })
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.total > 0 && data.items) {
      addressBook.update((currentBook) => {
        const newBook = [...currentBook];
        for (const item of data.items) {
          const existingIndex = newBook.findIndex((entry) => entry.address === item.address);
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
function clearAddressBook() {
  addressBook.set([]);
  pendingAddresses.clear();
  addressesToFetch.length = 0;
  if (pendingPromise) {
    clearTimeout(pendingPromise);
    pendingPromise = null;
  }
}
export {
  addressBook as a,
  addAddress as b,
  clearAddressBook as c,
  currentPrices as d,
  ergPrice as e,
  getOwner as g
};
