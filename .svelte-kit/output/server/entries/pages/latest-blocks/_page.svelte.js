import { E as store_get, Q as head, I as unsubscribe_stores, D as pop, z as push } from "../../../chunks/index.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/client.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import { P as PageHeader, a as Pagination } from "../../../chunks/PageHeader.js";
import { E as ErrorMessage } from "../../../chunks/ErrorMessage.js";
import { getBlocks } from "../../../chunks/api.js";
import { g as getLatestBlocksHeaders } from "../../../chunks/tableConfigs.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let limit, offset, currentPage;
  let blocks = [];
  let loading = true;
  let error = null;
  let totalPages = 1;
  let totalItems = 0;
  const DEFAULT_LIMIT = 20;
  async function loadBlocks() {
    try {
      loading = true;
      error = null;
      const data = await getBlocks({
        limit,
        offset,
        sortBy: "height",
        sortDirection: "desc"
      });
      blocks = data.items || [];
      totalItems = data.total || 0;
      totalPages = Math.ceil(totalItems / limit);
    } catch (err) {
      error = err.message;
      console.error("Failed to load blocks:", err);
    } finally {
      loading = false;
    }
  }
  function getInfoText() {
    if (loading || !blocks.length) return "";
    const start = offset + 1;
    const end = Math.min(offset + limit, offset + blocks.length);
    return `Showing ${start} - ${end}${totalItems ? ` of ${totalItems}` : ""} blocks`;
  }
  limit = parseInt(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10);
  offset = parseInt(store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("offset") || "0", 10);
  currentPage = Math.floor(offset / limit) + 1;
  if (store_get($$store_subs ??= {}, "$page", page).url.pathname === "/latest-blocks") {
    loadBlocks();
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Latest Blocks - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="View the latest blocks mined on the Ergo blockchain with details about transactions, miners, and rewards."/>`;
  });
  $$payload.out += `<div class="container-fluid p-0"><div class="row p-0"><div class="col-12 p-0">`;
  PageHeader($$payload, {
    title: "Latest Blocks",
    icon: "fa-cubes",
    info: getInfoText()
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
  $$payload.out += `<!--]--> `;
  DataTable($$payload, {
    headers: getLatestBlocksHeaders(),
    data: blocks,
    loading,
    emptyMessage: "No blocks found"
  });
  $$payload.out += `<!----> `;
  if (!loading && totalPages > 1) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="mt-2">`;
    Pagination($$payload, { currentPage, totalPages });
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div> <div class="page-bottom-margin"></div>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
