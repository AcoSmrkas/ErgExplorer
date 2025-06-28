import { E as store_get, Q as head, I as unsubscribe_stores, D as pop, z as push, G as escape_html, J as attr, P as stringify } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
/* empty css                                                         */
import "../../../../chunks/TokenDisplay.svelte_svelte_type_style_lang.js";
import { L as Loading } from "../../../../chunks/Loading.js";
/* empty css                                                            */
import { o as formatTokenAmount } from "../../../../chunks/formatting.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let tokenId = store_get($$store_subs ??= {}, "$page", page).params.tokenId;
  formatTokenAmount("0", 0);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Token ${escape_html(tokenId.slice(0, 16))} - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description"${attr("content", `View token details, metadata, and holder information for ${stringify("Ergo token")} ${stringify(tokenId)}`)}/>`;
  });
  {
    $$payload.out += "<!--[-->";
    Loading($$payload, { text: "Loading token details..." });
  }
  $$payload.out += `<!--]-->`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
