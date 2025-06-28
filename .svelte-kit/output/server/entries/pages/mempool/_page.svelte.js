import { W as current_component, E as store_get, Q as head, F as attr_class, G as escape_html, J as attr, I as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import { P as PageHeader, a as Pagination } from "../../../chunks/PageHeader.js";
import { E as ErrorMessage } from "../../../chunks/ErrorMessage.js";
import { getMempool } from "../../../chunks/api.js";
import { g as goto } from "../../../chunks/client.js";
import { A as API_ENDPOINTS, F as FEE_ERGOTREE, E as ERG_DECIMALS } from "../../../chunks/constants.js";
import { b as formatNumber, m as formatFileSize, f as formatAddress, c as formatErgValue, i as formatPriceUSD } from "../../../chunks/formatting.js";
import { e as ergPrice } from "../../../chunks/priceStore.js";
import { w as writable } from "../../../chunks/index3.js";
import { io } from "socket.io-client";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function createPaginationHandler(page2, loadDataFn, defaultLimit = 20) {
  const limit = parseInt(page2.url.searchParams.get("limit") || defaultLimit.toString(), 10);
  const offset = parseInt(page2.url.searchParams.get("offset") || "0", 10);
  const currentPage = Math.floor(offset / limit) + 1;
  async function handlePageChange(event) {
    const newPage = event.detail.page;
    const newOffset = (newPage - 1) * limit;
    const url = new URL(page2.url);
    if (newOffset === 0) {
      url.searchParams.delete("offset");
    } else {
      url.searchParams.set("offset", newOffset.toString());
    }
    if (limit === defaultLimit) {
      url.searchParams.delete("limit");
    } else {
      url.searchParams.set("limit", limit.toString());
    }
    await goto(url.pathname + url.search, {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function getInfoText(data, totalItems, loading) {
    if (loading || !data.length) return "";
    const start = offset + 1;
    const end = Math.min(offset + limit, offset + data.length);
    return `Showing ${start} - ${end}${totalItems ? ` of ${totalItems}` : ""} items`;
  }
  return {
    limit,
    offset,
    currentPage,
    handlePageChange,
    getInfoText
  };
}
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1e3;
    this.eventListeners = /* @__PURE__ */ new Map();
    this.connectionStatus = writable(false);
    this.mempoolTransactions = writable([]);
    this.lastUpdate = writable(null);
  }
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }
    try {
      this.socket = io(API_ENDPOINTS.SOCKET, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });
      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to connect to socket:", error);
      this.connectionStatus.set(false);
    }
  }
  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to socket server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionStatus.set(true);
    });
    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      this.isConnected = false;
      this.connectionStatus.set(false);
    });
    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnected = false;
      this.connectionStatus.set(false);
    });
    this.socket.on("mempoolTxs", (transactions) => {
      this.mempoolTransactions.set(transactions);
      this.lastUpdate.set((/* @__PURE__ */ new Date()).toISOString());
      this.emit("mempoolTxs", transactions);
    });
  }
  // Subscribe to specific events
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(callback);
  }
  // Unsubscribe from events
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }
  // Emit events to custom listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in socket event callback:", error);
        }
      });
    }
  }
  // Find specific transaction in mempool
  findTransaction(txId) {
    let transaction = null;
    this.mempoolTransactions.subscribe((transactions) => {
      transaction = transactions.find((tx) => tx.id === txId);
    })();
    return transaction;
  }
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatus.set(false);
    }
  }
  // Get connection status store
  getConnectionStatus() {
    return this.connectionStatus;
  }
  // Get mempool transactions store
  getMempoolTransactions() {
    return this.mempoolTransactions;
  }
  // Get last update time store
  getLastUpdate() {
    return this.lastUpdate;
  }
}
const socketService = new SocketService();
if (typeof window !== "undefined") {
  socketService.connect();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let pagination, limit, offset, currentPage, displayTransactions;
  let transactions = [];
  let groupedTransactions = [];
  let loading = true;
  let error = null;
  let totalPages = 1;
  let totalItems = 0;
  let useRealTime = true;
  let isSocketConnected = false;
  let showConflicts = false;
  const DEFAULT_LIMIT = 50;
  function groupConflictingTransactions(txs) {
    const boxToTxMap = /* @__PURE__ */ new Map();
    const conflicts = /* @__PURE__ */ new Map();
    txs.forEach((tx) => {
      tx.inputs?.forEach((input) => {
        if (!boxToTxMap.has(input.boxId)) {
          boxToTxMap.set(input.boxId, []);
        }
        boxToTxMap.get(input.boxId).push(tx);
      });
    });
    let conflictGroupId = 1;
    for (const [boxId, spendingTxs] of boxToTxMap) {
      if (spendingTxs.length > 1) {
        console.log(`Conflict detected: ${spendingTxs.length} transactions trying to spend box ${boxId}`);
        console.log("Conflicting transactions:", spendingTxs.map((tx) => tx.id));
        spendingTxs.forEach((tx) => {
          if (!conflicts.has(tx.id)) {
            conflicts.set(tx.id, {
              groupId: conflictGroupId,
              conflictingBoxes: [],
              conflictCount: spendingTxs.length
            });
          }
          conflicts.get(tx.id).conflictingBoxes.push(boxId);
        });
        conflictGroupId++;
      }
    }
    return txs.map((tx) => ({
      ...tx,
      conflictGroup: conflicts.has(tx.id) ? conflicts.get(tx.id).groupId : null,
      conflictingBoxes: conflicts.has(tx.id) ? conflicts.get(tx.id).conflictingBoxes : [],
      conflictCount: conflicts.has(tx.id) ? conflicts.get(tx.id).conflictCount : 0
    }));
  }
  const headers = [
    {
      label: "Transaction ID",
      field: "id",
      render: (value, row) => {
        const conflictBadge = row.conflictGroup ? `<span class="conflict-badge" title="Competing with ${row.conflictCount - 1} other transaction(s) for the same UTXO. Only one will succeed.">
						Double-spend #${row.conflictGroup}
					</span>` : "";
        return `<a href="/transactions/${value}" class="height-link">${formatAddress(value, 15, 4)}</a> ${conflictBadge}`;
      }
    },
    {
      label: "Fee",
      field: null,
      render: (value, row) => {
        const feeOutput = row.outputs?.find((output) => output.ergoTree === FEE_ERGOTREE);
        const fee = feeOutput ? parseInt(feeOutput.value) : 0;
        return fee > 0 ? `${formatErgValue(fee, ERG_DECIMALS)} <small class="text-muted">${formatPriceUSD(fee, 9, store_get($$store_subs ??= {}, "$ergPrice", ergPrice).value)}</small>` : "N/A";
      }
    },
    {
      label: "Inputs",
      field: "inputs",
      render: (value) => formatNumber(value?.length || 0)
    },
    {
      label: "Outputs",
      field: "outputs",
      render: (value) => formatNumber(value?.length || 0)
    },
    {
      label: "ERG Transferred",
      field: "outputs",
      render: (value) => {
        const totalValue = value?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
        return `${formatErgValue(totalValue)} <small class="text-muted">${formatPriceUSD(totalValue, 9, store_get($$store_subs ??= {}, "$ergPrice", ergPrice).value)}</small>`;
      }
    },
    {
      label: "Size",
      field: "size",
      render: (value) => formatFileSize(value)
    }
  ];
  onDestroy(() => {
  });
  async function loadTransactions() {
    try {
      loading = true;
      error = null;
      const data = await getMempool({ limit, offset });
      transactions = data.items || [];
      totalItems = data.total || 0;
      totalPages = Math.ceil(totalItems / limit);
    } catch (err) {
      error = err.message;
      console.error("Failed to load mempool:", err);
    } finally {
      loading = false;
    }
  }
  pagination = createPaginationHandler(store_get($$store_subs ??= {}, "$page", page), loadTransactions, DEFAULT_LIMIT);
  ({ limit, offset, currentPage } = pagination);
  groupedTransactions = groupConflictingTransactions(transactions);
  displayTransactions = groupedTransactions;
  if (store_get($$store_subs ??= {}, "$page", page).url.pathname === "/mempool") {
    loadTransactions();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Mempool - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="View pending transactions in the Ergo blockchain mempool awaiting confirmation." class="svelte-1h9rb0"/>`;
  });
  $$payload.out += `<div class="container-fluid p-0 svelte-1h9rb0"><div class="row p-0 svelte-1h9rb0"><div class="col-12 p-0 svelte-1h9rb0">`;
  PageHeader($$payload, {
    title: "Mempool Transactions",
    icon: "fa-clock",
    info: pagination.getInfoText(displayTransactions, totalItems, loading)
  });
  $$payload.out += `<!----> `;
  if (error) {
    $$payload.out += "<!--[-->";
    ErrorMessage($$payload, {
      message: error,
      type: "danger",
      dismissible: true
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="mempool-info svelte-1h9rb0">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="info-card svelte-1h9rb0"><i class="fas fa-info-circle info-icon svelte-1h9rb0"></i> <div class="info-content svelte-1h9rb0"><strong class="svelte-1h9rb0">Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block.</div> <button class="dismiss-btn svelte-1h9rb0" title="Dismiss"><i class="fas fa-times svelte-1h9rb0"></i></button></div>`;
  }
  $$payload.out += `<!--]--> <div class="info-card svelte-1h9rb0"><div class="control-section svelte-1h9rb0"><div class="connection-status svelte-1h9rb0"><div${attr_class("status-indicator svelte-1h9rb0", void 0, {
    "connected": isSocketConnected,
    "disconnected": !isSocketConnected
  })}><i class="fas fa-circle svelte-1h9rb0"></i></div> <span class="status-text svelte-1h9rb0">${escape_html("Fallback")}</span></div> <div class="form-check form-switch svelte-1h9rb0"><input class="form-check-input svelte-1h9rb0" type="checkbox" id="realTimeToggle"${attr("checked", useRealTime, true)}${attr("disabled", !isSocketConnected, true)}/> <label class="form-check-label svelte-1h9rb0" for="realTimeToggle">Real-time updates</label></div> <div class="form-check form-switch svelte-1h9rb0"><input class="form-check-input svelte-1h9rb0" type="checkbox" id="conflictsToggle"${attr("checked", showConflicts, true)}/> <label class="form-check-label svelte-1h9rb0" for="conflictsToggle">Show conflicts only</label></div></div></div></div> `;
  DataTable($$payload, {
    headers,
    data: displayTransactions,
    loading,
    emptyMessage: "No pending transactions in mempool"
  });
  $$payload.out += `<!----> `;
  if (!loading && totalPages > 1) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="mt-2 svelte-1h9rb0">`;
    Pagination($$payload, { currentPage, totalPages });
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div> <div class="page-bottom-margin svelte-1h9rb0"></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
