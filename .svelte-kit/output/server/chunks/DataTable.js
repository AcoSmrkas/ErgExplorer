import { M as fallback, T as ensure_array_like, G as escape_html, J as attr, X as spread_props, O as bind_props, D as pop, z as push } from "./index.js";
/* empty css                                        */
import { h as html } from "./html.js";
function DataTable($$payload, $$props) {
  push();
  let sortedData;
  let headers = fallback($$props["headers"], () => [], true);
  let data = fallback($$props["data"], () => [], true);
  let sortable = fallback($$props["sortable"], true);
  let loading = fallback($$props["loading"], false);
  let emptyMessage = fallback($$props["emptyMessage"], "No data available");
  function sortData(items, key, direction) {
    return items;
  }
  function getNestedValue(obj, key) {
    if (!key) return null;
    return key.split(".").reduce((value, k) => value?.[k], obj);
  }
  sortedData = loading ? [] : sortData(data);
  const each_array = ensure_array_like(headers);
  $$payload.out += `<div class="table-responsive glass-table-container p-0 svelte-pl0dr2"><table class="table glass-table svelte-pl0dr2"><thead class="svelte-pl0dr2"><tr class="svelte-pl0dr2"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let header = each_array[$$index];
    $$payload.out += `<th class="svelte-pl0dr2">${escape_html(header.label)}</th>`;
  }
  $$payload.out += `<!--]--></tr></thead><tbody class="svelte-pl0dr2">`;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr class="svelte-pl0dr2"><td${attr("colspan", headers.length)} class="text-center py-4 svelte-pl0dr2"><div class="spinner-border spinner-border-sm text-primary svelte-pl0dr2" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`;
  } else if (sortedData.length === 0) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<tr class="svelte-pl0dr2"><td${attr("colspan", headers.length)} class="text-center py-4 text-muted svelte-pl0dr2">${escape_html(emptyMessage)}</td></tr>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_1 = ensure_array_like(sortedData);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let row = each_array_1[index];
      const each_array_2 = ensure_array_like(headers);
      $$payload.out += `<tr class="svelte-pl0dr2"><!--[-->`;
      for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
        let header = each_array_2[$$index_1];
        $$payload.out += `<td class="svelte-pl0dr2">`;
        if (header.component) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<!---->`;
          header.component?.($$payload, spread_props([
            header.componentProps ? header.componentProps(row, getNestedValue(row, header.field), index) : { data: row, field: header.field }
          ]));
          $$payload.out += `<!---->`;
        } else if (header.render) {
          $$payload.out += "<!--[1-->";
          $$payload.out += `${html(header.render(getNestedValue(row, header.field), row, index))}`;
        } else {
          $$payload.out += "<!--[!-->";
          $$payload.out += `${escape_html(getNestedValue(row, header.field) || "—")}`;
        }
        $$payload.out += `<!--]--></td>`;
      }
      $$payload.out += `<!--]--></tr>`;
    }
    $$payload.out += `<!--]-->`;
  }
  $$payload.out += `<!--]--></tbody></table></div>`;
  bind_props($$props, {
    headers,
    data,
    sortable,
    loading,
    emptyMessage
  });
  pop();
}
export {
  DataTable as D
};
