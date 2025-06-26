import { D as store_get, P as head, I as unsubscribe_stores, C as pop, z as push, G as escape_html, E as attr, O as stringify } from "../../../../chunks/index.js";
import { p as page } from "../../../../chunks/stores.js";
/* empty css                                                         */
import "../../../../chunks/TokenDisplay.svelte_svelte_type_style_lang.js";
import { L as Loading } from "../../../../chunks/Loading.js";
import "../../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { h as formatTokenAmount } from "../../../../chunks/formatting.js";
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
