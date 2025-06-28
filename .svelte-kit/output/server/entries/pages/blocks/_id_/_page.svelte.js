import { U as sanitize_slots, M as fallback, F as attr_class, R as slot, G as escape_html, O as bind_props, P as stringify, T as ensure_array_like, J as attr, E as store_get, Q as head, I as unsubscribe_stores, D as pop, z as push } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
import { D as DataTable } from "../../../../chunks/DataTable.js";
import { L as Loading } from "../../../../chunks/Loading.js";
import { E as ErrorMessage } from "../../../../chunks/ErrorMessage.js";
import { b as formatNumber, m as formatFileSize, n as formatDifficulty, d as formatDateString, c as formatErgValue, i as formatPriceUSD } from "../../../../chunks/formatting.js";
import { w as writable } from "../../../../chunks/index3.js";
function Card($$payload, $$props) {
  const $$slots = sanitize_slots($$props);
  let title = fallback($$props["title"], "");
  let icon = fallback($$props["icon"], "");
  let headerClass = fallback($$props["headerClass"], "");
  let bodyClass = fallback($$props["bodyClass"], "");
  let noPadding = fallback($$props["noPadding"], false);
  let count = fallback($$props["count"], null);
  $$payload.out += `<div class="card mb-4">`;
  if (title || icon || $$slots.header) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr_class(`card-header ${stringify(headerClass)}`)}>`;
    if ($$slots.header) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<!---->`;
      slot($$payload, $$props, "header", {});
      $$payload.out += `<!---->`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<h5 class="card-title mb-0">`;
      if (icon) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<i${attr_class(`fas ${stringify(icon)} me-2`)}></i>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--> ${escape_html(title)} `;
      if (count !== null) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="text-muted ms-2">(${escape_html(count)})</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></h5>`;
    }
    $$payload.out += `<!--]--></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div${attr_class(`card-body ${stringify(bodyClass)}`, void 0, { "p-0": noPadding })}><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></div></div>`;
  bind_props($$props, {
    title,
    icon,
    headerClass,
    bodyClass,
    noPadding,
    count
  });
}
function StatsGrid($$payload, $$props) {
  let columnClass;
  let stats = fallback($$props["stats"], () => [], true);
  let columns = fallback($$props["columns"], 4);
  columnClass = `col-md-${12 / columns}`;
  const each_array = ensure_array_like(stats);
  $$payload.out += `<div class="row mb-4 svelte-kmeh8u"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let stat = each_array[$$index];
    $$payload.out += `<div${attr_class(`${stringify(columnClass)} mb-3`, "svelte-kmeh8u")}><div class="card h-100 stat-card svelte-kmeh8u"><div class="card-body text-center">`;
    if (stat.icon) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="stat-icon mb-2 svelte-kmeh8u"><i${attr_class(`fas ${stringify(stat.icon)} text-${stringify(stat.color || "primary")}`, "svelte-kmeh8u")}></i></div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <h6 class="card-title text-muted small">${escape_html(stat.label)}</h6> `;
    if (stat.link) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<a${attr("href", stat.link)}${attr_class(`stat-value text-${stringify(stat.color || "primary")} text-decoration-none`, "svelte-kmeh8u")}><h4 class="mb-0">${escape_html(stat.value)}</h4></a>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<h4${attr_class(`stat-value text-${stringify(stat.color || "primary")} mb-0`, "svelte-kmeh8u")}>${escape_html(stat.value)}</h4>`;
    }
    $$payload.out += `<!--]--> `;
    if (stat.subtitle) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<small class="text-muted">${escape_html(stat.subtitle)}</small>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></div></div></div>`;
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { stats, columns });
}
function RawDataToggle($$payload, $$props) {
  let data = fallback($$props["data"], () => ({}), true);
  let title = fallback($$props["title"], "Raw Data");
  let icon = fallback($$props["icon"], "fa-code");
  $$payload.out += `<div class="card"><div class="card-header flex-between"><h5 class="card-title mb-0"><i${attr_class(`fas ${stringify(icon)} me-2`)}></i> ${escape_html(title)}</h5> <button class="btn btn-outline-light btn-sm" type="button"><i${attr_class(`fas ${stringify("fa-eye")} me-1`)}></i> ${escape_html("Show")} Raw Data</button></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { data, title, icon });
}
function useAsyncData() {
  const data = writable(null);
  const loading = writable(false);
  const error = writable(null);
  async function fetchData(apiCall, errorMessage = "Failed to load data") {
    try {
      loading.set(true);
      error.set(null);
      const result = await apiCall();
      data.set(result);
      return result;
    } catch (err) {
      const message = err.message || errorMessage;
      error.set(message);
      console.error(errorMessage + ":", err);
      throw err;
    } finally {
      loading.set(false);
    }
  }
  function reset() {
    data.set(null);
    loading.set(false);
    error.set(null);
  }
  return {
    data: { subscribe: data.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    fetchData,
    reset
  };
}
function usePrices() {
  const { data: ergPrice, loading, error, fetchData } = useAsyncData();
  async function loadPrices() {
    const { getPrices } = await import("../../../../chunks/api.js");
    return fetchData(
      async () => {
        const priceData = await getPrices();
        return priceData?.price || null;
      },
      "Failed to load prices"
    );
  }
  return {
    ergPrice: { subscribe: ergPrice.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    loadPrices
  };
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let stats;
  let blockId = store_get($$store_subs ??= {}, "$page", page).params.id;
  const { data: block, loading, error } = useAsyncData();
  const { ergPrice } = usePrices();
  const txHeaders = [
    {
      label: "Transaction ID",
      field: "id",
      render: (value) => `<a href="/transactions/${value}" class="fw-bold font-monospace">${value.slice(0, 16)}...</a>`
    },
    {
      label: "Inputs",
      field: "inputsCount",
      render: (value) => formatNumber(value || 0)
    },
    {
      label: "Outputs",
      field: "outputsCount",
      render: (value) => formatNumber(value || 0)
    },
    {
      label: "Size",
      field: "size",
      render: (value) => formatFileSize(value)
    }
  ];
  stats = store_get($$store_subs ??= {}, "$block", block) ? [
    {
      label: "Height",
      value: formatNumber(store_get($$store_subs ??= {}, "$block", block).height, 0, true),
      icon: "fa-layer-group",
      color: "primary"
    },
    {
      label: "Transactions",
      value: formatNumber(store_get($$store_subs ??= {}, "$block", block).transactionsCount || 0),
      icon: "fa-exchange-alt",
      color: "info"
    },
    {
      label: "Size",
      value: formatFileSize(store_get($$store_subs ??= {}, "$block", block).size),
      icon: "fa-file",
      color: "warning"
    },
    {
      label: "Difficulty",
      value: formatDifficulty(store_get($$store_subs ??= {}, "$block", block).difficulty),
      icon: "fa-chart-line",
      color: "success"
    }
  ] : [];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Block ${escape_html(store_get($$store_subs ??= {}, "$block", block)?.height || blockId.slice(0, 16))} - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description"${attr("content", `View block details, transactions, and miner information for Ergo block ${stringify(blockId)}`)}/>`;
  });
  if (store_get($$store_subs ??= {}, "$loading", loading)) {
    $$payload.out += "<!--[-->";
    Loading($$payload, { text: "Loading block details..." });
  } else if (store_get($$store_subs ??= {}, "$error", error)) {
    $$payload.out += "<!--[1-->";
    ErrorMessage($$payload, {
      message: store_get($$store_subs ??= {}, "$error", error),
      type: "danger"
    });
  } else if (store_get($$store_subs ??= {}, "$block", block)) {
    $$payload.out += "<!--[2-->";
    $$payload.out += `<div class="col-md-12"><div class="row w-100"><div class="col-md-12 mb-3 mb-md-4"><h2 class="m-0 svelte-dq7fvx">Block ${escape_html(formatNumber(store_get($$store_subs ??= {}, "$block", block).height))}</h2></div></div> `;
    StatsGrid($$payload, { stats });
    $$payload.out += `<!----> `;
    Card($$payload, {
      title: "Block Details",
      icon: "fa-cube",
      children: ($$payload2) => {
        $$payload2.out += `<div class="flex-between mb-3"><h6 class="mb-0">Basic Information</h6> <button class="copy-btn" title="Copy block ID"><i class="fas fa-copy"></i></button></div> <div class="row"><div class="col-lg-6"><table class="table table-sm svelte-dq7fvx"><tbody><tr><td class="svelte-dq7fvx"><strong>Height:</strong></td><td class="svelte-dq7fvx">${escape_html(formatNumber(store_get($$store_subs ??= {}, "$block", block).height))}</td></tr><tr><td class="svelte-dq7fvx"><strong>Block ID:</strong></td><td class="svelte-dq7fvx"><span class="font-monospace text-truncate-custom"${attr("title", store_get($$store_subs ??= {}, "$block", block).id)}>${escape_html(store_get($$store_subs ??= {}, "$block", block).id)}</span></td></tr><tr><td class="svelte-dq7fvx"><strong>Timestamp:</strong></td><td class="svelte-dq7fvx">${escape_html(formatDateString(store_get($$store_subs ??= {}, "$block", block).timestamp))}</td></tr><tr><td class="svelte-dq7fvx"><strong>Transactions:</strong></td><td class="svelte-dq7fvx">${escape_html(formatNumber(store_get($$store_subs ??= {}, "$block", block).transactionsCount))}</td></tr></tbody></table></div> <div class="col-lg-6"><table class="table table-sm svelte-dq7fvx"><tbody><tr><td class="svelte-dq7fvx"><strong>Miner:</strong></td><td class="svelte-dq7fvx"><a${attr("href", `/addresses/${stringify(store_get($$store_subs ??= {}, "$block", block).miner.address)}`)} class="font-monospace">${escape_html(store_get($$store_subs ??= {}, "$block", block).miner.name || `${store_get($$store_subs ??= {}, "$block", block).miner.address.slice(0, 12)}...`)}</a></td></tr><tr><td class="svelte-dq7fvx"><strong>Reward:</strong></td><td class="text-success svelte-dq7fvx">${escape_html(formatErgValue(store_get($$store_subs ??= {}, "$block", block).minerReward))} ERG `;
        if (store_get($$store_subs ??= {}, "$ergPrice", ergPrice)) {
          $$payload2.out += "<!--[-->";
          $$payload2.out += `<br/><small class="text-muted">${escape_html(formatPriceUSD(store_get($$store_subs ??= {}, "$block", block).minerReward, store_get($$store_subs ??= {}, "$ergPrice", ergPrice)))}</small>`;
        } else {
          $$payload2.out += "<!--[!-->";
        }
        $$payload2.out += `<!--]--></td></tr><tr><td class="svelte-dq7fvx"><strong>Difficulty:</strong></td><td class="svelte-dq7fvx">${escape_html(formatDifficulty(store_get($$store_subs ??= {}, "$block", block).difficulty))}</td></tr><tr><td class="svelte-dq7fvx"><strong>Size:</strong></td><td class="svelte-dq7fvx">${escape_html(formatFileSize(store_get($$store_subs ??= {}, "$block", block).size))}</td></tr></tbody></table></div></div>`;
      },
      $$slots: { default: true }
    });
    $$payload.out += `<!----> <div class="row mb-4"><div class="col-12"><div class="d-flex justify-content-between">`;
    if (block.height > 1) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<a${attr("href", `/blocks/${stringify(block.height - 1)}`)} class="btn btn-outline-primary svelte-dq7fvx"><i class="fas fa-chevron-left me-1"></i> Previous Block</a>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<span></span>`;
    }
    $$payload.out += `<!--]--> <a${attr("href", `/blocks/${stringify(block.height + 1)}`)} class="btn btn-outline-primary svelte-dq7fvx">Next Block <i class="fas fa-chevron-right ms-1"></i></a></div></div></div> `;
    if (store_get($$store_subs ??= {}, "$block", block).blockTransactions?.length > 0) {
      $$payload.out += "<!--[-->";
      Card($$payload, {
        title: "Transactions",
        icon: "fa-exchange-alt",
        count: store_get($$store_subs ??= {}, "$block", block).blockTransactions.length,
        noPadding: true,
        children: ($$payload2) => {
          DataTable($$payload2, {
            headers: txHeaders,
            data: store_get($$store_subs ??= {}, "$block", block).blockTransactions,
            loading: false,
            sortable: false
          });
        },
        $$slots: { default: true }
      });
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> `;
    RawDataToggle($$payload, {
      data: store_get($$store_subs ??= {}, "$block", block),
      title: "Raw Block Data"
    });
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
    ErrorMessage($$payload, { message: "Block not found", type: "warning" });
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
