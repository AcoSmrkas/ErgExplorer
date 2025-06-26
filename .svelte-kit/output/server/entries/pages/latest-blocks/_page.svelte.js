import { P as head, C as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import "../../../chunks/AddressFormatter.svelte_svelte_type_style_lang.js";
import "../../../chunks/Pagination.svelte_svelte_type_style_lang.js";
/* empty css                                                    */
import "../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { f as formatNumber, b as formatDateString, a as formatErgValue, g as formatPriceUSD, i as formatDifficulty, j as formatFileSize } from "../../../chunks/formatting.js";
function _page($$payload, $$props) {
  push();
  let blocks = [];
  let loading = true;
  const headers = [
    {
      label: "Height",
      field: "height",
      sortKey: "height",
      render: (value, row) => `<a href="/blocks/${row.id}" data-block-id="${row.id}" aria-label="View block ${value}"><i class="fas fa-link text-info me-1"></i></a><span class="fw-bold">${formatNumber(value, 0, true)}</span>`
    },
    {
      label: "Time",
      field: "timestamp",
      sortKey: "timestamp",
      render: (value) => formatDateString(value)
    },
    {
      label: "Transactions",
      field: "transactionsCount",
      sortKey: "transactionsCount",
      render: (value) => formatNumber(value)
    },
    {
      label: "Mined by",
      field: "miner",
      render: (value) => `<span class="miner-cell" data-address="${value.address}" data-name="${value.name}"></span>`
    },
    {
      label: "Reward",
      field: "minerReward",
      sortKey: "minerReward",
      render: (value) => `${formatErgValue(value)} ERG<br><small class="text-muted">${formatPriceUSD()}</small>`
    },
    {
      label: "Difficulty",
      field: "difficulty",
      sortKey: "difficulty",
      render: (value) => formatDifficulty(value)
    },
    {
      label: "Size",
      field: "size",
      sortKey: "size",
      render: (value) => formatFileSize(value)
    }
  ];
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Latest Blocks - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="View the latest blocks mined on the Ergo blockchain with details about transactions, miners, and rewards."/>`;
  });
  $$payload.out += `<div class="container-fluid"><div class="row"><div class="col-12"><div class="d-flex justify-content-between align-items-center mb-4"><h1 class="h3 mb-0 svelte-1k3v57u"><i class="fas fa-cubes me-2 text-primary svelte-1k3v57u"></i> Latest Blocks</h1> <div class="text-muted">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="card svelte-1k3v57u"><div class="card-body p-0">`;
  DataTable($$payload, {
    headers,
    data: blocks,
    loading,
    emptyMessage: "No blocks found"
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div>`;
  pop();
}
export {
  _page as default
};
