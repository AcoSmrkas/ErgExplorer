import { D as store_get, P as head, G as escape_html, I as unsubscribe_stores, C as pop, z as push, E as attr, O as stringify } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
import { D as DataTable } from "../../../../chunks/DataTable.js";
import "../../../../chunks/AddressFormatter.svelte_svelte_type_style_lang.js";
import "../../../../chunks/TokenDisplay.svelte_svelte_type_style_lang.js";
import "../../../../chunks/Pagination.svelte_svelte_type_style_lang.js";
/* empty css                                                       */
import "../../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { f as formatNumber, a as formatErgValue, b as formatDateString, g as formatPriceUSD } from "../../../../chunks/formatting.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let verifiedOwner, ergBalance, totalTxs;
  let address = store_get($$store_subs ??= {}, "$page", page).params.address;
  let transactions = [];
  let loading = true;
  const txHeaders = [
    {
      label: "Transaction ID",
      field: "id",
      render: (value) => `<a href="/transactions/${value}" class="fw-bold font-monospace">${value.slice(0, 16)}...</a>`
    },
    {
      label: "Time",
      field: "timestamp",
      render: (value) => formatDateString(value)
    },
    {
      label: "Height",
      field: "inclusionHeight",
      render: (value) => value ? `<a href="/blocks/${value}">${formatNumber(value)}</a>` : "Pending"
    },
    {
      label: "Direction",
      field: "direction",
      render: (value, row) => {
        const isIncoming = row.inputs?.some((input) => input.address !== address) && row.outputs?.some((output) => output.address === address);
        return `<span class="badge ${isIncoming ? "bg-success" : "bg-warning"}">${isIncoming ? "In" : "Out"}</span>`;
      }
    },
    {
      label: "Value",
      field: "outputs",
      render: (value, row) => {
        const relevantOutputs = value?.filter((o) => o.address === address) || [];
        const totalValue = relevantOutputs.reduce((sum, output) => sum + (parseInt(output.value) || 0), 0);
        return `${formatErgValue(totalValue)} ERG<br><small class="text-muted">${formatPriceUSD()}</small>`;
      }
    }
  ];
  function getVerifiedOwner(addr) {
    const knownAddresses = {
      "9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk": "ErgExplorer",
      "9fRAWhdxEsTcdb8PhGNrpfhBmXNpUGcGVCKVNEJUQCrEQpGpBZR": "Ergo Foundation"
    };
    return knownAddresses[addr] || null;
  }
  verifiedOwner = getVerifiedOwner(address);
  ergBalance = 0;
  totalTxs = 0;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Address ${escape_html(address.slice(0, 16))}... - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description"${attr("content", `View address details, balance, and transaction history for Ergo address ${stringify(address)}`)}/>`;
  });
  $$payload.out += `<div class="col-md-12"><div class="row w-100"><div class="col-md-12 mb-3 mb-md-4"><h2 class="m-0 svelte-7wbf07">Address</h2></div></div> <div class="mb-3"><div class="row w-100 div-cell-dark border-bottom-flat p-2 p-lg-3 svelte-7wbf07" style="align-items:center;"><div class="col pe-0 ps-0"><p><button class="btn-link text-decoration-none p-0 border-0 bg-transparent font-monospace svelte-7wbf07" title="Click to copy address">${escape_html(address)}</button></p></div></div> <div class="row w-100 div-cell-dark border-top-flat p-2 p-lg-3 svelte-7wbf07"><div class="col-md p-0"><div class="row w-100"><div class="ps-0 pe-0 col-lg-6 col-md-12"><h4 class="svelte-7wbf07"><strong>Summary</strong></h4> `;
  if (verifiedOwner) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p><strong>Verified owner:</strong> <span class="text-success svelte-7wbf07">${escape_html(verifiedOwner)}</span></p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <p><strong>Total transactions:</strong> ${escape_html(formatNumber(totalTxs))}</p> `;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button class="btn btn-info mb-2">Show Unspent Boxes</button>`;
  }
  $$payload.out += `<!--]--> <hr class="my-3 d-lg-none"/></div> <div class="ps-0 pe-0 ps-lg-3 col-lg-6 col-md-12 border-lg-start"><h4 class="svelte-7wbf07"><strong>Balance</strong></h4> <h5 class="text-primary svelte-7wbf07">${escape_html(formatErgValue(ergBalance))} ERG `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></h5> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="card svelte-7wbf07"><div class="card-header d-flex justify-content-between align-items-center svelte-7wbf07"><h5 class="card-title mb-0"><i class="fas fa-exchange-alt me-2"></i> Transaction History</h5> <div class="text-muted">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="card-body p-0">`;
  DataTable($$payload, {
    headers: txHeaders,
    data: transactions,
    loading,
    emptyMessage: "No transactions found for this address"
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
