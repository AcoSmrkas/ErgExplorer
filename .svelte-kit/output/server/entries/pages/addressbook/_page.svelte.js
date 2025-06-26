import { S as ensure_array_like, P as head, E as attr, J as maybe_selected, G as escape_html, C as pop, z as push } from "../../../chunks/index.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import "../../../chunks/AddressFormatter.svelte_svelte_type_style_lang.js";
import "../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
function _page($$payload, $$props) {
  push();
  let filteredAddresses;
  let addresses = [];
  let loading = true;
  let searchQuery = "";
  let selectedCategory = "all";
  const headers = [
    {
      label: "Name",
      field: "name",
      render: (value, row) => `
				<div class="d-flex align-items-center">
					<div>
						<div class="fw-bold">${value}</div>
						${row.verified ? '<span class="badge bg-success ms-2"><i class="fas fa-check-circle"></i> Verified</span>' : ""}
					</div>
				</div>
			`
    },
    {
      label: "Address",
      field: "address",
      render: (value) => `<span class="address-cell" data-address="${value}"></span>`
    },
    {
      label: "Category",
      field: "category",
      render: (value) => `<span class="badge bg-primary">${getCategoryLabel(value)}</span>`
    },
    {
      label: "Description",
      field: "description",
      render: (value) => value || "—"
    },
    {
      label: "Actions",
      field: "address",
      render: (value) => `
				<div class="btn-group btn-group-sm">
					<a href="/addresses/${value}" class="btn btn-outline-primary">
						<i class="fas fa-eye"></i> View
					</a>
					<button class="btn btn-outline-secondary copy-address" data-address="${value}">
						<i class="fas fa-copy"></i>
					</button>
				</div>
			`
    }
  ];
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "service", label: "Services" },
    { value: "foundation", label: "Foundation" },
    { value: "defi", label: "DeFi" },
    { value: "privacy", label: "Privacy" },
    { value: "mining", label: "Mining" },
    { value: "gaming", label: "Gaming" },
    { value: "token", label: "Tokens" }
  ];
  function filterAddresses(addressList, query, category) {
    return addressList.filter((addr) => {
      return true;
    });
  }
  function getCategoryLabel(category) {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  }
  filteredAddresses = filterAddresses(addresses);
  const each_array = ensure_array_like(categories);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Address Book - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="Directory of known and verified addresses on the Ergo blockchain including services, DeFi protocols, and notable entities."/>`;
  });
  $$payload.out += `<div class="container-fluid"><div class="row"><div class="col-12"><div class="d-flex justify-content-between align-items-center mb-4"><h1 class="h3 mb-0 svelte-jpgp5"><i class="fas fa-address-book me-2 text-primary svelte-jpgp5"></i> Address Book</h1> <div class="text-muted">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="alert alert-info d-flex align-items-center mb-4 svelte-jpgp5" role="alert"><i class="fas fa-info-circle me-2"></i> <div><strong>Address Directory:</strong> A curated list of known addresses on the Ergo blockchain. <span class="badge bg-success ms-2 svelte-jpgp5"><i class="fas fa-check-circle"></i> Verified</span> addresses are officially confirmed.</div></div> <div class="card mb-4 svelte-jpgp5"><div class="card-body"><div class="row g-3"><div class="col-md-6"><label class="form-label">Search addresses</label> <div class="input-group"><input${attr("value", searchQuery)} type="text" class="form-control" placeholder="Search by name, address, or description..."/> <button class="btn btn-outline-primary svelte-jpgp5" type="button"><i class="fas fa-search"></i></button></div></div> <div class="col-md-4"><label class="form-label">Category</label> <select class="form-select">`;
  $$payload.select_value = selectedCategory;
  $$payload.out += `<!--[-->`;
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let category = each_array[$$index];
    $$payload.out += `<option${attr("value", category.value)}${maybe_selected($$payload, category.value)}>${escape_html(category.label)}</option>`;
  }
  $$payload.out += `<!--]-->`;
  $$payload.select_value = void 0;
  $$payload.out += `</select></div> <div class="col-md-2 d-flex align-items-end"><button class="btn btn-outline-secondary w-100"><i class="fas fa-times me-1"></i> Clear</button></div></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="card svelte-jpgp5"><div class="card-body p-0">`;
  DataTable($$payload, {
    headers,
    data: filteredAddresses,
    loading,
    emptyMessage: "No addresses found matching your criteria",
    sortable: true
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
