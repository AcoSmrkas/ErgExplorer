import { E as store_get, Q as head, I as unsubscribe_stores, D as pop, z as push, G as escape_html, J as attr, P as stringify } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
/* empty css                                                         */
import "../../../../chunks/AddressFormatter.svelte_svelte_type_style_lang.js";
import "../../../../chunks/TokenDisplay.svelte_svelte_type_style_lang.js";
import { L as Loading } from "../../../../chunks/Loading.js";
/* empty css                                                            */
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let txId = store_get($$store_subs ??= {}, "$page", page).params.txId;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Transaction ${escape_html(txId.slice(0, 16))}... - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description"${attr("content", `View transaction details, inputs, outputs, and fees for Ergo transaction ${stringify(txId)}`)}/>`;
  });
  {
    $$payload.out += "<!--[-->";
    Loading($$payload, { text: "Loading transaction details..." });
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
