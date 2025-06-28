import { E as store_get, T as ensure_array_like, Q as head, J as attr, K as maybe_selected, G as escape_html, I as unsubscribe_stores, D as pop, z as push, F as attr_class, N as attr_style, P as stringify } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
import { C as CopyButton } from "../../../chunks/CopyButton.js";
import { E as ErrorMessage } from "../../../chunks/ErrorMessage.js";
import { P as PageHeader, a as Pagination } from "../../../chunks/PageHeader.js";
import { L as Loading } from "../../../chunks/Loading.js";
import { f as formatAddress, b as formatNumber } from "../../../chunks/formatting.js";
import { getApiHost } from "../../../chunks/api.js";
import "clsx";
let network = "mainnet";
function isTestnet() {
  return network === "testnet";
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let limit, offset, currentPage, groupedAddresses;
  let addresses = [];
  let tokens = [];
  let loading = true;
  let error = null;
  let addressType = "all";
  let orderBy = "nameAsc";
  let totalPages = 1;
  let totalItems = 0;
  const ITEMS_PER_PAGE = 20;
  const addressTypes = [
    { value: "all", label: "All" },
    { value: "exchange", label: "Exchange" },
    { value: "service", label: "Service" },
    { value: "mining-pool", label: "Mining Pool" },
    { value: "nft-artist", label: "NFT Artist" }
  ];
  const orderOptions = [
    {
      value: "nameAsc",
      label: "Alphabetical: A to Z"
    },
    {
      value: "nameDesc",
      label: "Alphabetical: Z to A"
    }
  ];
  async function loadAddresses() {
    try {
      loading = true;
      error = null;
      const apiUrl = `${getApiHost()}addressbook/getAddresses?offset=${offset}&limit=${limit}&type=${addressType}&order=${orderBy}&testnet=${isTestnet() ? "1" : "0"}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch addresses: ${response.statusText}`);
      }
      const data = await response.json();
      addresses = data.items || [];
      tokens = data.tokens || [];
      totalItems = data.total || 0;
      totalPages = Math.ceil(totalItems / limit);
      console.log("API Response:", data);
      console.log("First few addresses:", addresses.slice(0, 3));
      if (addresses.length > 0) {
        console.log("Available types:", [
          ...new Set(addresses.map((addr) => addr.type))
        ]);
      }
    } catch (err) {
      error = err.message;
      console.error("Failed to load addressbook:", err);
    } finally {
      loading = false;
    }
  }
  function groupAddressesByName(addressList) {
    const groups = {};
    addressList.forEach((item) => {
      if (!groups[item.name]) {
        groups[item.name] = {
          name: item.name,
          type: item.type,
          url: item.url,
          addresses: []
        };
      }
      groups[item.name].addresses.push(item);
    });
    return Object.values(groups);
  }
  function getTokenForName(name) {
    return tokens.find((token) => token.addressname === name);
  }
  function getTypeClass(type) {
    switch (type) {
      case "exchange":
        return "badge-info";
      case "service":
        return "badge-primary";
      case "mining-pool":
        return "badge-warning";
      case "nft-artist":
        return "badge-success";
      default:
        return "badge-secondary";
    }
  }
  function getAddressTypeClass(urltype) {
    if (!urltype) return "";
    const type = urltype.toLowerCase();
    if (type.includes("hot")) return "hot";
    if (type.includes("cold")) return "cold";
    if (type.includes("wallet")) return "wallet";
    if (type.includes("exchange")) return "exchange";
    return "";
  }
  function getBadgeColor(type) {
    console.log("Badge type:", type);
    if (!type) return "#6c757d";
    const normalizedType = type.toLowerCase().trim().replace(/\s+/g, "-");
    console.log("Normalized type:", normalizedType);
    let color = "#6c757d";
    if (normalizedType.includes("exchange")) color = "#17a2b8";
    else if (normalizedType.includes("service")) color = "#ff851b";
    else if (normalizedType.includes("mining")) color = "#ffc107";
    else if (normalizedType.includes("nft") || normalizedType.includes("artist")) color = "#28a745";
    console.log("Returning color:", color, "for type:", type);
    return color;
  }
  function getBadgeTextColor(type) {
    if (!type) return "white";
    const normalizedType = type.toLowerCase().trim();
    if (normalizedType.includes("mining")) return "#000";
    return "white";
  }
  function getInfoText() {
    if (loading || !groupedAddresses.length) return "";
    const start = offset + 1;
    const end = Math.min(offset + limit, totalItems);
    return `Showing ${start}-${end} of ${formatNumber(totalItems)} entries`;
  }
  limit = parseInt(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("limit") || ITEMS_PER_PAGE.toString(), 10);
  offset = parseInt(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("offset") || "0", 10);
  currentPage = Math.floor(offset / limit) + 1;
  {
    const urlType = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("type");
    const urlOrder = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("order");
    if (urlType) addressType = urlType;
    if (urlOrder) orderBy = urlOrder;
  }
  if (store_get($$store_subs ??= {}, "$page", page).url.pathname === "/addressbook") {
    loadAddresses();
  }
  groupedAddresses = groupAddressesByName(addresses);
  const each_array = ensure_array_like(orderOptions);
  const each_array_1 = ensure_array_like(addressTypes);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Address Book - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="Directory of known addresses on the Ergo blockchain"/>`;
  });
  $$payload.out += `<div class="container-fluid p-0"><div class="row p-0"><div class="col-12 p-0">`;
  PageHeader($$payload, {
    title: "Address Book",
    icon: "fa-address-book",
    info: getInfoText()
  });
  $$payload.out += `<!----> <div class="container-fluid p-0"><div class="row mb-4 p-0"><div class="col-md-6 ps-0"><label class="form-label" for="orderBy">Order:</label> <select class="form-select" id="orderBy">`;
  $$payload.select_value = orderBy;
  $$payload.out += `<!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let option = each_array[$$index];
    $$payload.out += `<option${attr("value", option.value)}${maybe_selected($$payload, option.value)}>${escape_html(option.label)}</option>`;
  }
  $$payload.out += `<!--]-->`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div> <div class="col-md-6 pe-0"><label class="form-label" for="addressType">Filter:</label> <select class="form-select" id="addressType">`;
  $$payload.select_value = addressType;
  $$payload.out += `<!--[-->`;
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let type = each_array_1[$$index_1];
    $$payload.out += `<option${attr("value", type.value)}${maybe_selected($$payload, type.value)}>${escape_html(type.label)}</option>`;
  }
  $$payload.out += `<!--]-->`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div></div> `;
  if (loading) {
    $$payload.out += "<!--[-->";
    Loading($$payload, { text: "Loading address book..." });
  } else if (error) {
    $$payload.out += "<!--[1-->";
    ErrorMessage($$payload, {
      message: error,
      type: "danger",
      dismissible: true
    });
  } else if (groupedAddresses.length === 0) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="div-cell-dark">There are no entries in the address book.</div>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_2 = ensure_array_like(groupedAddresses);
    if (totalPages > 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="mb-4">`;
      Pagination($$payload, { currentPage, totalPages });
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="row w-100"><!--[-->`;
    for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
      let group = each_array_2[$$index_3];
      const each_array_3 = ensure_array_like(group.addresses);
      $$payload.out += `<div class="col-12 mb-4 p-0"><div class="glass-card"><div class="card-header"><h2 class="section-title">${escape_html(group.name)}</h2> <span${attr_class(`badge ${stringify(getTypeClass(group.type))}`, "svelte-1kcptvj")}${attr_style(`background-color: ${stringify(getBadgeColor(group.type))} !important; color: ${stringify(getBadgeTextColor(group.type))} !important;`)}>${escape_html(group.type)}</span></div> <div class="card-content">`;
      if (group.url) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<div class="contact-item"><span class="contact-label">Website:</span> <a${attr("href", group.url)} target="_blank" rel="noopener" class="contact-link">${escape_html(group.url)} <i class="fas fa-external-link-alt ms-1"></i></a></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> <div class="addresses-section svelte-1kcptvj"><h6 class="addresses-label svelte-1kcptvj"><i class="fas fa-wallet me-2 svelte-1kcptvj"></i> Address${escape_html(group.addresses.length > 1 ? "es" : "")}</h6> <div class="addresses-list svelte-1kcptvj"><!--[-->`;
      for (let index = 0, $$length2 = each_array_3.length; index < $$length2; index++) {
        let address = each_array_3[index];
        $$payload.out += `<div${attr_class("address-item svelte-1kcptvj", void 0, { "mb-0": index === group.addresses.length - 1 })}><div class="address-row svelte-1kcptvj">`;
        if (address.urltype) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<span${attr_class(`address-type ${stringify(getAddressTypeClass(address.urltype))}`, "svelte-1kcptvj")}>${escape_html(address.urltype)}</span>`;
        } else {
          $$payload.out += "<!--[!-->";
        }
        $$payload.out += `<!--]--> <a${attr("href", `/addresses/${stringify(address.address)}`)} class="address-link svelte-1kcptvj"${attr("data-address", address.address)}>${escape_html(formatAddress(address.address, 32, 6))}</a> `;
        CopyButton($$payload, {
          text: address.address,
          label: "Copy address",
          successMessage: "Address copied to clipboard!"
        });
        $$payload.out += `<!----></div></div>`;
      }
      $$payload.out += `<!--]--></div></div> `;
      if (getTokenForName(group.name)) {
        $$payload.out += "<!--[-->";
        const token = getTokenForName(group.name);
        $$payload.out += `<div class="contact-item mb-0"><span class="contact-label">Token:</span> <a${attr("href", `/tokens/${stringify(token.id)}`)}${attr("data-token-id", token.id)}${attr("data-token-name", token.name || "")} class="contact-link token-link" title="Click to view token details">${escape_html(token.id)}</a></div>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></div></div>`;
    }
    $$payload.out += `<!--]--></div> `;
    if (totalPages > 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="mt-0">`;
      Pagination($$payload, { currentPage, totalPages });
      $$payload.out += `<!----></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></div></div></div></div> <div class="page-bottom-margin"></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
