import { P as head, E as attr, C as pop, z as push } from "../../../chunks/index.js";
import "../../../chunks/client.js";
import { D as DataTable } from "../../../chunks/DataTable.js";
import "../../../chunks/TokenDisplay.svelte_svelte_type_style_lang.js";
import "../../../chunks/Pagination.svelte_svelte_type_style_lang.js";
import "../../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { h as formatTokenAmount, f as formatNumber, b as formatDateString } from "../../../chunks/formatting.js";
function _page($$payload, $$props) {
  push();
  let filteredTokens;
  let tokens = [];
  let loading = true;
  let searchQuery = "";
  let showNFTs = true;
  let showFungible = true;
  const headers = [
    {
      label: "Token",
      field: "name",
      render: (value, row) => `
				<div class="d-flex align-items-center">
					<img src="${getTokenIcon(row.tokenId, row.name)}" alt="${row.name || "Token"}" class="token-icon me-2" width="24" height="24">
					<div>
						<div class="fw-bold">${row.name || "Unnamed Token"}</div>
						<small class="text-muted font-monospace">${row.tokenId.slice(0, 16)}...</small>
					</div>
				</div>
			`
    },
    {
      label: "Type",
      field: "type",
      render: (value, row) => {
        const isNFT = row.decimals === 0 && row.emissionAmount === "1";
        return `<span class="badge ${isNFT ? "bg-info" : "bg-success"}">${isNFT ? "NFT" : "Token"}</span>`;
      }
    },
    {
      label: "Supply",
      field: "emissionAmount",
      render: (value, row) => formatTokenAmount(value, row.decimals)
    },
    {
      label: "Decimals",
      field: "decimals",
      render: (value) => formatNumber(value)
    },
    {
      label: "Created",
      field: "createdAt",
      sortKey: "createdAt",
      render: (value) => formatDateString(value)
    },
    {
      label: "Actions",
      field: "tokenId",
      render: (value) => `<a href="/tokens/${value}" class="btn btn-outline-primary btn-sm">View</a>`
    }
  ];
  function getTokenIcon(tokenId, name) {
    const knownTokens = {};
    if (knownTokens[tokenId]) {
      return `/images/tokens/${knownTokens[tokenId]}`;
    }
    return "/images/logo-new.png";
  }
  function filterTokens(tokenList, query, includeNFTs, includeFungible) {
    return tokenList.filter((token) => {
      token.decimals === 0 && token.emissionAmount === "1";
      return true;
    });
  }
  filteredTokens = filterTokens(tokens);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Issued Tokens - Erg Explorer</title>`;
    $$payload2.out += `<meta name="description" content="Browse all tokens and NFTs issued on the Ergo blockchain with advanced filtering and search capabilities."/>`;
  });
  $$payload.out += `<div class="container-fluid"><div class="row"><div class="col-12"><div class="d-flex justify-content-between align-items-center mb-4"><h1 class="h3 mb-0 svelte-160ibkl"><i class="fas fa-coins me-2 text-primary svelte-160ibkl"></i> Issued Tokens</h1> <div class="text-muted">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div> <div class="card mb-4 svelte-160ibkl"><div class="card-body"><div class="row g-3"><div class="col-md-6"><label class="form-label">Search tokens</label> <div class="input-group"><input${attr("value", searchQuery)} type="text" class="form-control" placeholder="Search by name, ID, or description..."/> <button class="btn btn-outline-primary svelte-160ibkl" type="button"><i class="fas fa-search"></i></button></div></div> <div class="col-md-3"><label class="form-label">Token Types</label> <div class="d-flex gap-3"><div class="form-check"><input${attr("checked", showFungible, true)} class="form-check-input svelte-160ibkl" type="checkbox" id="showFungible"/> <label class="form-check-label" for="showFungible">Tokens</label></div> <div class="form-check"><input${attr("checked", showNFTs, true)} class="form-check-input svelte-160ibkl" type="checkbox" id="showNFTs"/> <label class="form-check-label" for="showNFTs">NFTs</label></div></div></div> <div class="col-md-3 d-flex align-items-end"><button class="btn btn-outline-secondary"><i class="fas fa-times me-1"></i> Clear Filters</button></div></div></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="card svelte-160ibkl"><div class="card-body p-0">`;
  DataTable($$payload, {
    headers,
    data: filteredTokens,
    loading,
    emptyMessage: "No tokens found matching your criteria"
  });
  $$payload.out += `<!----></div></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div>`;
  pop();
}
export {
  _page as default
};
