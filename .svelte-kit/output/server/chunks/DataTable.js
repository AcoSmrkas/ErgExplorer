import { K as fallback, S as ensure_array_like, F as attr_class, G as escape_html, O as stringify, E as attr, N as bind_props, C as pop, z as push } from "./index.js";
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
  let sortKey = "";
  function sortData(items, key, direction) {
    return items;
  }
  function getNestedValue(obj, key) {
    return key.split(".").reduce((value, k) => value?.[k], obj);
  }
  function getSortIcon(key) {
    if (sortKey !== key) return "fas fa-sort";
    return "fas fa-sort-up";
  }
  sortedData = loading ? [] : sortData(data);
  const each_array = ensure_array_like(headers);
  $$payload.out += `<div class="table-responsive"><table class="table table-hover svelte-86bima"><thead class="svelte-86bima"><tr class="svelte-86bima"><!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let header = each_array[$$index];
    $$payload.out += `<th${attr_class("svelte-86bima", void 0, { "sortable": sortable && header.sortKey })}>${escape_html(header.label)} `;
    if (sortable && header.sortKey) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i${attr_class(`${stringify(getSortIcon(header.sortKey))} ms-1`, "svelte-86bima")}></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></th>`;
  }
  $$payload.out += `<!--]--></tr></thead><tbody class="svelte-86bima">`;
  if (loading) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<tr class="svelte-86bima"><td${attr("colspan", headers.length)} class="text-center py-4 svelte-86bima"><div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>`;
  } else if (sortedData.length === 0) {
    $$payload.out += "<!--[1-->";
    $$payload.out += `<tr class="svelte-86bima"><td${attr("colspan", headers.length)} class="text-center py-4 text-muted svelte-86bima">${escape_html(emptyMessage)}</td></tr>`;
  } else {
    $$payload.out += "<!--[!-->";
    const each_array_1 = ensure_array_like(sortedData);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let row = each_array_1[index];
      const each_array_2 = ensure_array_like(headers);
      $$payload.out += `<tr class="svelte-86bima"><!--[-->`;
      for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
        let header = each_array_2[$$index_1];
        $$payload.out += `<td class="svelte-86bima">`;
        if (header.component) {
          $$payload.out += "<!--[-->";
          $$payload.out += `<!---->`;
          header.component?.($$payload, { data: row, field: header.field });
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
