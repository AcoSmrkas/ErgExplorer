import { D as store_get, P as head, I as unsubscribe_stores, C as pop, z as push, G as escape_html, E as attr, O as stringify } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
/* empty css                                                         */
import { L as Loading } from "../../../../chunks/Loading.js";
import "../../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let blockId = store_get($$store_subs ??= {}, "$page", page).params.id;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Block ${escape_html(blockId.slice(0, 16))} - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description"${attr("content", `View block details, transactions, and miner information for Ergo block ${stringify(blockId)}`)}/>`;
  });
  {
    $$payload.out += "<!--[-->";
    Loading($$payload, { text: "Loading block details..." });
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
