import { P as head, E as attr, F as attr_class, C as pop, z as push } from "../../../chunks/index.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import "../../../chunks/AddressFormatter.svelte_svelte_type_style_lang.js";
import "../../../chunks/Pagination.svelte_svelte_type_style_lang.js";
import "../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { b as formatDateString, f as formatNumber, j as formatFileSize, a as formatErgValue, g as formatPriceUSD } from "../../../chunks/formatting.js";
function _page($$payload, $$props) {
  push();
  let transactions = [];
  let loading = true;
  let autoRefresh = true;
  const headers = [
    {
      label: "Transaction ID",
      field: "id",
      render: (value) => `<a href="/transactions/${value}" class="fw-bold text-monospace">${value.slice(0, 16)}...</a>`
    },
    {
      label: "Created",
      field: "creationTimestamp",
      sortKey: "creationTimestamp",
      render: (value) => formatDateString(value)
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
      label: "Value",
      field: "outputs",
      render: (value) => {
        const totalValue = value?.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0) || 0;
        return `${formatErgValue(totalValue)} ERG<br><small class="text-muted">${formatPriceUSD()}</small>`;
      }
    },
    {
      label: "Size",
      field: "size",
      render: (value) => formatFileSize(value)
    }
  ];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Mempool - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="View pending transactions in the Ergo blockchain mempool awaiting confirmation." class="svelte-vvjqw1"/>`;
  });
  $$payload.out += `<div class="container-fluid svelte-vvjqw1"><div class="row svelte-vvjqw1"><div class="col-12 svelte-vvjqw1"><div class="d-flex justify-content-between align-items-center mb-4 svelte-vvjqw1"><h1 class="h3 mb-0 svelte-vvjqw1"><i class="fas fa-clock me-2 text-warning svelte-vvjqw1"></i> Mempool Transactions</h1> <div class="d-flex align-items-center gap-3 svelte-vvjqw1"><div class="form-check form-switch svelte-vvjqw1"><input class="form-check-input svelte-vvjqw1" type="checkbox" id="autoRefresh"${attr("checked", autoRefresh, true)}/> <label class="form-check-label svelte-vvjqw1" for="autoRefresh">Auto-refresh</label></div> <button class="btn btn-outline-primary btn-sm svelte-vvjqw1"${attr("disabled", loading, true)}><i${attr_class("fas fa-sync-alt svelte-vvjqw1", void 0, { "fa-spin": loading })}></i> Refresh</button></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="alert alert-info d-flex align-items-center svelte-vvjqw1" role="alert"><i class="fas fa-info-circle me-2 svelte-vvjqw1"></i> <div class="svelte-vvjqw1"><strong class="svelte-vvjqw1">Mempool Overview:</strong> These are unconfirmed transactions waiting to be included in the next block. `;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="badge bg-success ms-2 svelte-vvjqw1">Auto-refreshing every 10s</span>`;
  }
  $$payload.out += `<!--]--></div></div> <div class="card svelte-vvjqw1"><div class="card-body p-0 svelte-vvjqw1">`;
  DataTable($$payload, {
    headers,
    data: transactions,
    loading,
    emptyMessage: "No pending transactions in mempool"
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div>`;
  pop();
}
export {
  _page as default
};
