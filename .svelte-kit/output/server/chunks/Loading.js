import { K as fallback, F as attr_class, G as escape_html, N as bind_props, O as stringify } from "./index.js";
/* empty css                                      */
function Loading($$payload, $$props) {
  let size = fallback($$props["size"], "md");
  let text = fallback($$props["text"], "Loading...");
  $$payload.out += `<div class="loading-container svelte-1yzsuon"><div class="spinner-container svelte-1yzsuon"><img src="/images/logo-new.png" alt="Loading"${attr_class(`loading-logo ${stringify(size)}`, "svelte-1yzsuon")}/></div> `;
  if (text) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<p class="loading-text svelte-1yzsuon">${escape_html(text)}</p>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div>`;
  bind_props($$props, { size, text });
}
export {
  Loading as L
};
