import { E as store_get, F as attr_class, G as escape_html, I as unsubscribe_stores, D as pop, z as push, J as attr, K as maybe_selected, M as fallback, N as attr_style, O as bind_props, P as stringify, Q as head, R as slot } from "../../chunks/index.js";
import { p as page } from "../../chunks/stores.js";
import { h as html } from "../../chunks/html.js";
import "../../chunks/client.js";
import "clsx";
import { f as formatAddress, a as formatValue, b as formatNumber, c as formatErgValue, d as formatDateString, e as formatKbSize } from "../../chunks/formatting.js";
import { C as CopyButton } from "../../chunks/CopyButton.js";
import { a as addAddress, g as getOwner, b as addressBook } from "../../chunks/addressBook.js";
import { w as writable } from "../../chunks/index3.js";
import "../../chunks/priceStore.js";
function Navigation($$payload, $$props) {
  push();
  var $$store_subs;
  let currentPath = store_get($$store_subs ??= {}, "$page", page).url.pathname;
  function isActive(path) {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  }
  function getThemeIcon() {
    return '<i class="fas fa-moon"></i>';
  }
  $$payload.out += `<nav class="navbar navbar-expand-md navbar-dark p-1 svelte-40ylym"><div class="container-fluid"><ul class="navbar-nav ms-auto d-none d-md-block" style="position: absolute; left: 15px;"><a class="navbar-brand svelte-40ylym" href="/"><img id="erg-logo" src="/images/logo.png" alt="Erg" height="30" class="svelte-40ylym"/></a></ul> <a class="navbar-brand d-block d-md-none svelte-40ylym" href="/"><img src="/images/logo.png" alt="Logo" height="35" class="svelte-40ylym"/></a> <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation"><i class="fa-solid fa-bars navbar-toggler-bars"></i></button> <div class="collapse navbar-collapse flex-grow-1 text-right" id="navbarNav"><ul class="navbar-nav w-100 justify-content-center"><li class="nav-item"><a${attr_class("nav-link svelte-40ylym", void 0, { "active": isActive("/issued-tokens") })} href="/issued-tokens">Tokens</a></li> <li class="nav-item"><a${attr_class("nav-link svelte-40ylym", void 0, { "active": isActive("/latest-blocks") })} href="/latest-blocks">Blocks</a></li> <li class="nav-item"><a${attr_class("nav-link svelte-40ylym", void 0, { "active": isActive("/mempool") })} href="/mempool">Mempool</a></li> <li class="nav-item"><a${attr_class("nav-link svelte-40ylym", void 0, { "active": isActive("/addressbook") })} href="/addressbook" rel="noopener">Address book</a></li> <li class="nav-item"><a class="nav-link" href="https://live.ergexplorer.com" target="_blank" rel="noopener">Live</a></li> <li class="nav-item"><a${attr_class("nav-link svelte-40ylym", void 0, { "active": isActive("/about") })} href="/about">About</a></li> <li class="nav-item d-block d-md-none"><div class="dropdown nav-link"><a class="btn nav-link dropdown-toggle text-light p-0 p-md-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><span class="networkType">${escape_html("Mainnet")}</span></a> <ul class="dropdown-menu svelte-40ylym"><li><a class="dropdown-item svelte-40ylym" href="#">Mainnet</a></li> <li><a class="dropdown-item svelte-40ylym" href="#">Testnet</a></li></ul></div></li> <li class="nav-item d-block d-md-none"><a class="nav-link theme-switcher d-flex align-items-center justify-content-center svelte-40ylym" href="#">${html(getThemeIcon())}</a></li></ul> <div id="rightNav" class="d-none d-lg-block"><span></span></div> <ul class="navbar-nav ms-auto" style="position: absolute; right: 15px;"><li class="nav-item"><div class="dropdown nav-link"><a class="btn nav-link dropdown-toggle text-light p-0 p-md-1" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"><span class="networkType">${escape_html("Mainnet")}</span></a> <ul class="dropdown-menu svelte-40ylym"><li><a class="dropdown-item svelte-40ylym" href="#">Mainnet</a></li> <li><a class="dropdown-item svelte-40ylym" href="#">Testnet</a></li></ul></div></li> <li class="nav-item d-flex align-items-center"><a class="nav-link theme-switcher d-flex align-items-center justify-content-center svelte-40ylym" href="#">${html(getThemeIcon())}</a></li></ul></div></div></nav>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function SearchForm($$payload, $$props) {
  push();
  let searchInput = "";
  let searchType = "*";
  $$payload.out += `<div class="d-flex justify-content-center align-items-center h-100 mb-3 mb-md-4"><div class="row w-100"><div class="col-sm-12 col-md-12 mx-auto p-0"><div class="search-wrapper svelte-hlxb88"><div class="input-group mb-0 w-100 svelte-hlxb88"><input id="searchInput"${attr("value", searchInput)} type="text" class="form-control form-control-lg svelte-hlxb88" placeholder="Search for"/> <select id="searchType" class="form-select form-control form-control-lg svelte-hlxb88">`;
  $$payload.select_value = searchType;
  $$payload.out += `<option value="*"${maybe_selected($$payload, "*")} class="svelte-hlxb88">Auto</option><option value="0"${maybe_selected($$payload, "0")} class="svelte-hlxb88">Address</option><option value="1"${maybe_selected($$payload, "1")} class="svelte-hlxb88">Transaction</option><option value="2"${maybe_selected($$payload, "2")} class="svelte-hlxb88">Token</option><option value="3"${maybe_selected($$payload, "3")} class="svelte-hlxb88">Block</option><option value="4"${maybe_selected($$payload, "4")} class="svelte-hlxb88">Box</option>`;
  $$payload.select_value = void 0;
  $$payload.out += `</select> <button class="btn btn-lg btn-info svelte-hlxb88" type="button"><i class="fas fa-search"></i></button></div></div></div></div></div>`;
  pop();
}
function Footer($$payload, $$props) {
  push();
  let currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  $$payload.out += `<footer class="footer svelte-d5k62n"><div class="container text-center">© Erg Explorer ${escape_html(currentYear)} - <a href="/addresses/9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk" class="svelte-d5k62n">Donate <span style="color:pink;">♥</span></a></div></footer>`;
  pop();
}
function TokenPopup($$payload, $$props) {
  push();
  let displayName, tokenDescription, hasDetailedData, nftImage, tokenIcon;
  let token = fallback($$props["token"], null);
  let tokenId = fallback($$props["tokenId"], "");
  let name = fallback($$props["name"], "");
  let price = fallback($$props["price"], null);
  let visible = fallback($$props["visible"], false);
  let x = fallback($$props["x"], 0);
  let y = fallback($$props["y"], 0);
  let loading = fallback($$props["loading"], false);
  displayName = token?.name || name || (tokenId ? tokenId.substring(0, 15) + (tokenId.length > 15 ? "..." : "") : "Unknown Token");
  tokenDescription = token?.description ? token.description.length > 120 ? token.description.substring(0, 120) + "..." : token.description : null;
  hasDetailedData = token !== null && token !== void 0;
  nftImage = token?.cachedurl;
  tokenIcon = token?.iconurl;
  if (visible && (token || tokenId)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="token-popup show"${attr_style(`left: ${stringify(x)}px; top: ${stringify(y)}px;`)}><div class="token-header">`;
    if (nftImage) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<img class="token-popup-image nft-image"${attr("src", nftImage)}${attr("alt", displayName)} onerror="this.__e=event"/>`;
    } else if (tokenIcon) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<img class="token-popup-image token-icon-large"${attr("src", tokenIcon)}${attr("alt", displayName)} onerror="this.__e=event"/>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="token-title"><div class="token-name">${escape_html(displayName)}</div></div></div> `;
    if (loading && !hasDetailedData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading-section"><div class="loading-spinner-small"></div> <span class="loading-text">Loading token data...</span></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (hasDetailedData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="token-details">`;
      if (token?.ticker && token.ticker !== displayName) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-ticker">Ticker: ${escape_html(token.ticker)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (tokenId) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-id-section mb-0"><div class="token-id">ID: ${escape_html(formatAddress(tokenId, 15, 4))}</div> <div class="mb-2">`;
        CopyButton($$payload, {
          text: tokenId,
          label: "Copy full token ID",
          successMessage: "Token ID copied to clipboard!"
        });
        $$payload.out += `<!----></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (price) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-price">Price: $${html(formatValue(price, 0, true))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (token?.decimals !== void 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-decimals">Decimals: ${escape_html(token.decimals)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (token?.emissionAmount) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-supply">Supply: ${escape_html(formatNumber(token.emissionAmount / Math.pow(10, token.decimals || 0)))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (tokenDescription) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-description"><div class="description-label">Description:</div> <div class="description-text">${escape_html(tokenDescription)}</div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (token?.scam) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-warning"><i class="fas fa-exclamation-triangle"></i> Reported as suspicious by users</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else if (!loading) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<div class="token-basic-info">`;
      if (tokenId) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-id-section"><div class="token-id">ID: ${escape_html(formatAddress(tokenId, 15, 4))}...</div> <div class="mb-2">`;
        CopyButton($$payload, {
          text: tokenId,
          label: "Copy full token ID",
          successMessage: "Token ID copied to clipboard!"
        });
        $$payload.out += `<!----></div></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (price) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="token-price">Price: $${escape_html(formatNumber(price, 4))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    token,
    tokenId,
    name,
    price,
    visible,
    x,
    y,
    loading
  });
  pop();
}
function AddressPopup($$payload, $$props) {
  push();
  var $$store_subs;
  let hasBalanceData, friendlyName, displayAddress;
  let address = fallback($$props["address"], "");
  let balance = fallback($$props["balance"], null);
  let visible = fallback($$props["visible"], false);
  let x = fallback($$props["x"], 0);
  let y = fallback($$props["y"], 0);
  let loading = fallback($$props["loading"], false);
  hasBalanceData = balance !== null && balance !== void 0;
  if (visible && address) {
    addAddress(address);
  }
  friendlyName = address ? getOwner(address, store_get($$store_subs ??= {}, "$addressBook", addressBook)) : null;
  displayAddress = address ? formatAddress(address, 15, 4) : "Unknown Address";
  if (visible && address) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="address-popup show"${attr_style(`left: ${stringify(x)}px; top: ${stringify(y)}px;`)}><div class="address-header"><div class="address-icon"><i class="fas fa-wallet"></i></div> <div class="address-title"><div class="address-name">${escape_html(friendlyName ? friendlyName : "Address Balance")}</div></div></div> <div class="address-id-section mb-2"><div class="address-full">${escape_html(displayAddress)}</div> `;
    CopyButton($$payload, {
      text: address,
      label: "Copy full address",
      successMessage: "Address copied to clipboard!"
    });
    $$payload.out += `<!----></div> `;
    if (loading && !hasBalanceData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading-section"><div class="loading-spinner-small" style="display: inline-block"></div> <span class="loading-text">Loading balance...</span></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (hasBalanceData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="address-details">`;
      if (balance?.confirmed?.nanoErgs !== void 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="address-balance"><strong>Confirmed Balance:</strong> ${html(formatErgValue(balance.confirmed.nanoErgs))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (balance?.unconfirmed?.nanoErgs !== void 0 && balance.unconfirmed.nanoErgs > 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="address-unconfirmed"><strong>Unconfirmed:</strong> ${html(formatErgValue(balance.unconfirmed.nanoErgs))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (balance?.confirmed?.nanoErgs !== void 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="address-total"><strong class="erg-span">Total Balance:</strong> ${html(formatErgValue((balance.confirmed?.nanoErgs || 0) + (balance.unconfirmed?.nanoErgs || 0)))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  bind_props($$props, { address, balance, visible, x, y, loading });
  pop();
}
function BlockPopup($$payload, $$props) {
  push();
  let hasDetailedData, blockHeader, blockTransactions;
  let block = fallback($$props["block"], null);
  let blockId = fallback($$props["blockId"], "");
  let visible = fallback($$props["visible"], false);
  let x = fallback($$props["x"], 0);
  let y = fallback($$props["y"], 0);
  let loading = fallback($$props["loading"], false);
  hasDetailedData = block !== null && block !== void 0;
  blockHeader = block?.block?.header;
  blockTransactions = block?.block?.blockTransactions;
  if (visible && (block || blockId)) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="block-popup show"${attr_style(`left: ${stringify(x)}px; top: ${stringify(y)}px;`)}><div class="block-header"><div class="block-title"><div class="block-height">Block #${escape_html(blockHeader?.height ? formatNumber(blockHeader.height) : " --")}</div></div></div> `;
    if (loading && !hasDetailedData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading-section"><div class="loading-spinner-small"></div> <span class="loading-text">Loading block data...</span></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (hasDetailedData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="block-details">`;
      if (blockId) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="block-id-section mb-2"><div class="block-id">ID: ${escape_html(formatAddress(blockId, 15, 4))}</div> `;
        CopyButton($$payload, {
          text: blockId,
          label: "Copy full block ID",
          successMessage: "Block ID copied to clipboard!"
        });
        $$payload.out += `<!----></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (blockHeader?.timestamp) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="block-time">Time: ${escape_html(formatDateString(blockHeader.timestamp))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (blockTransactions?.length) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="block-transactions">Transactions: ${escape_html(formatNumber(blockTransactions.length))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (blockHeader?.size) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="block-size">Size: ${escape_html(formatKbSize(blockHeader.size))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else if (!loading) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<div class="block-basic-info">`;
      if (blockId) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="block-id-section"><div class="block-id">ID: ${escape_html(formatAddress(blockId, 15, 4))}</div> `;
        CopyButton($$payload, {
          text: blockId,
          label: "Copy full block ID",
          successMessage: "Block ID copied to clipboard!"
        });
        $$payload.out += `<!----></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, { block, blockId, visible, x, y, loading });
  pop();
}
function TransactionPopup($$payload, $$props) {
  push();
  let hasTransactionData;
  let transaction = fallback($$props["transaction"], null);
  let visible = fallback($$props["visible"], false);
  let x = fallback($$props["x"], 0);
  let y = fallback($$props["y"], 0);
  let loading = fallback($$props["loading"], false);
  let transactionId = fallback($$props["transactionId"], "");
  hasTransactionData = transaction !== null && transaction !== void 0;
  if (visible && transactionId) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="transaction-popup show"${attr_style(`left: ${stringify(x)}px; top: ${stringify(y)}px;`)}><div class="transaction-header"><div class="transaction-icon"><i class="fas fa-exchange-alt"></i></div> <div class="transaction-title"><div class="transaction-name">Transaction Details</div></div></div> <div class="transaction-id-section"><div class="transaction-id">ID: ${escape_html(formatAddress(transactionId, 15, 4))}</div> `;
    CopyButton($$payload, {
      text: transactionId,
      label: "Copy full transaction ID",
      successMessage: "Transaction ID copied to clipboard!"
    });
    $$payload.out += `<!----></div> `;
    if (loading && !hasTransactionData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="loading-section"><div class="loading-spinner-small" style="display: inline-block"></div> <span class="loading-text">Loading transaction...</span></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    if (hasTransactionData) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="transaction-details">`;
      if (transaction.timestamp) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-time"><strong>Time:</strong> ${escape_html(formatDateString(transaction.timestamp))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (transaction.blockId) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-block"><strong>Block:</strong> <a${attr("href", getBlockUrl(transaction.blockId))}>${escape_html(formatAddress(transaction.blockId, 15, 4))}</a></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (transaction.confirmationsCount !== void 0) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-confirmations"><strong>Confirmations:</strong> ${escape_html(transaction.confirmationsCount)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (transaction.inputs && transaction.inputs.length) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-inputs"><strong>Inputs:</strong> ${escape_html(transaction.inputs.length)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (transaction.outputs && transaction.outputs.length) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-outputs"><strong>Outputs:</strong> ${escape_html(transaction.outputs.length)}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> `;
      if (transaction.totalValue) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="transaction-value"><strong class="erg-span">Total Value:</strong> ${html(formatErgValue(transaction.totalValue))}</div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    transaction,
    visible,
    x,
    y,
    loading,
    transactionId
  });
  pop();
}
const tokenCache = writable(/* @__PURE__ */ new Map());
const CACHE_DURATION$1 = 5 * 60 * 1e3;
function clearExpiredCache() {
  const now = Date.now();
  tokenCache.update((cache) => {
    const newCache = /* @__PURE__ */ new Map();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp < CACHE_DURATION$1) {
        newCache.set(key, value);
      }
    }
    return newCache;
  });
}
if (typeof window !== "undefined") {
  setInterval(clearExpiredCache, CACHE_DURATION$1);
}
const tokenPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  token: null,
  tokenId: "",
  tokenName: "",
  tokenPrice: null,
  loading: false
});
const addressCache = writable(/* @__PURE__ */ new Map());
const CACHE_DURATION = 5 * 60 * 1e3;
function clearExpiredAddressCache() {
  const now = Date.now();
  addressCache.update((cache) => {
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
  setInterval(clearExpiredAddressCache, CACHE_DURATION);
}
const addressPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  address: "",
  balance: null,
  loading: false
});
const blockPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  block: null,
  blockId: "",
  loading: false
});
blockPopupState.subscribe((state) => {
});
const transactionPopupState = writable({
  visible: false,
  x: 0,
  y: 0,
  transaction: null,
  transactionId: "",
  loading: false
});
function _layout($$payload, $$props) {
  push();
  let data = $$props["data"];
  let tokenPopup = {
    visible: false,
    x: 0,
    y: 0,
    token: null,
    tokenId: "",
    tokenName: "",
    tokenPrice: null,
    loading: false
  };
  let addressPopup = {
    visible: false,
    x: 0,
    y: 0,
    address: "",
    balance: null,
    loading: false
  };
  let blockPopup = {
    visible: false,
    x: 0,
    y: 0,
    block: null,
    blockId: "",
    loading: false
  };
  let transactionPopup = {
    visible: false,
    x: 0,
    y: 0,
    transaction: null,
    transactionId: "",
    loading: false
  };
  tokenPopupState.subscribe((state) => {
    tokenPopup = state;
  });
  addressPopupState.subscribe((state) => {
    addressPopup = state;
  });
  blockPopupState.subscribe((state) => {
    blockPopup = state;
  });
  transactionPopupState.subscribe((state) => {
    transactionPopup = state;
  });
  page.subscribe(() => {
    tokenPopupState.set({
      visible: false,
      x: 0,
      y: 0,
      token: null,
      tokenId: "",
      tokenName: "",
      tokenPrice: null,
      loading: false
    });
    addressPopupState.set({
      visible: false,
      x: 0,
      y: 0,
      address: "",
      balance: null,
      loading: false
    });
    blockPopupState.set({
      visible: false,
      x: 0,
      y: 0,
      block: null,
      blockId: "",
      loading: false
    });
    transactionPopupState.set({
      visible: false,
      x: 0,
      y: 0,
      transaction: null,
      transactionId: "",
      loading: false
    });
  });
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Erg Explorer - Ergo blockchain explorer</title>`;
    $$payload2.out += `<meta name="description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo blockchain's blocks, addresses, transactions, tokens, and more."/> <meta name="keywords" content="ergo, erg, blockchain, explorer, tool, browser, transaction, block, token, nft, scan, wallet, search, address, explore"/> <meta property="og:title" content="Erg Explorer - Ergo blockchain explorer"/> <meta property="og:description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo Blockchain's blocks, addresses, transactions, tokens, and more."/> <meta property="og:type" content="website"/> <meta property="og:site_name" content="Erg Explorer - Ergo blockchain explorer"/> <meta property="og:url" content="https://ergexplorer.com"/> <meta property="og:image" content="https://ergexplorer.com/images/logo.png"/> <meta property="og:image:url" content="https://ergexplorer.com/images/logo.png"/> <meta property="og:image:alt" content="Visit Ergexplorer.com"/> <meta name="twitter:card" content="summary"/> <meta name="twitter:title" content="Erg Explorer - Ergo blockchain explorer"/> <meta property="twitter:description" content="Discover Erg Explorer: Your independent gateway to exploring Ergo Blockchain's blocks, addresses, transactions, tokens, and more."/> <meta name="twitter:site" content="@ergexplorer"/> <meta property="twitter:image" content="https://ergexplorer.com/images/logo.png"/> <script async src="https://www.googletagmanager.com/gtag/js?id=G-84SMBQLNNF"><\/script> <script>
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', 'G-84SMBQLNNF');
	<\/script>`;
  });
  Navigation($$payload);
  $$payload.out += `<!----> <div class="container p-0 mx-auto svelte-t738tx"><div class="w-100 baner text-center p-0 mt-2 mt-md-3 mb-2 mb-md-3 svelte-t738tx"><a class="p-0" href="https://ergominers.com" target="_blank" rel="noopener"><img src="/images/sigsmining.png" alt="Ad" style="max-height: 80px; width: auto; max-width:100%; margin: 0 auto; border: 1px solid var(--main-color); border-radius: 10px" class="svelte-t738tx"/></a></div> `;
  SearchForm($$payload);
  $$payload.out += `<!----> <main><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></main></div> `;
  Footer($$payload);
  $$payload.out += `<!----> `;
  TokenPopup($$payload, {
    visible: tokenPopup.visible,
    x: tokenPopup.x,
    y: tokenPopup.y,
    token: tokenPopup.token,
    tokenId: tokenPopup.tokenId,
    name: tokenPopup.tokenName,
    price: tokenPopup.tokenPrice,
    loading: tokenPopup.loading
  });
  $$payload.out += `<!----> `;
  AddressPopup($$payload, {
    visible: addressPopup.visible,
    x: addressPopup.x,
    y: addressPopup.y,
    address: addressPopup.address,
    balance: addressPopup.balance,
    loading: addressPopup.loading
  });
  $$payload.out += `<!----> `;
  BlockPopup($$payload, {
    visible: blockPopup.visible,
    x: blockPopup.x,
    y: blockPopup.y,
    block: blockPopup.block,
    blockId: blockPopup.blockId,
    loading: blockPopup.loading
  });
  $$payload.out += `<!----> `;
  TransactionPopup($$payload, {
    visible: transactionPopup.visible,
    x: transactionPopup.x,
    y: transactionPopup.y,
    transaction: transactionPopup.transaction,
    transactionId: transactionPopup.transactionId,
    loading: transactionPopup.loading
  });
  $$payload.out += `<!---->`;
  bind_props($$props, { data });
  pop();
}
export {
  _layout as default
};
