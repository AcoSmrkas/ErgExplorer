import { J as attr, G as escape_html, F as attr_class, P as stringify, D as pop, z as push, M as fallback, O as bind_props, T as ensure_array_like, Q as head } from "../../chunks/index.js";
/* empty css                                                      */
import { g as formatCurrency, b as formatNumber, c as formatErgValue, E as ERG_SPAN, a as formatValue, h as formatPercentageStyled, d as formatDateString, i as formatPriceUSD, j as formatNumberLarge, k as formatMiningTime, l as formatHashRate } from "../../chunks/formatting.js";
import { h as html } from "../../chunks/html.js";
import { A as API_ENDPOINTS, E as ERG_DECIMALS } from "../../chunks/constants.js";
import { w as writable } from "../../chunks/index3.js";
import { D as DataTable } from "../../chunks/DataTable.js";
import { A as AddressLink, g as getLatestBlocksHeaders } from "../../chunks/tableConfigs.js";
import { e as ergPrice, c as currentPrices } from "../../chunks/priceStore.js";
const tokenIconsStore = writable({});
const staticTokenIcons = {
  ERG: "/images/logo-new.png",
  // Common tokens that might have local icons
  e8b20745ee9d18817305f32eb21015831a48f02d40980de6e849f886dca7f807: "/images/tokens/flux.png",
  "4f792b75a0f1a46083824cfd6b4766d094698d71c37f7f5083bf09dec3d0fbcd": "/images/tokens/dude.png"
};
function getTokenIcon(tokenId) {
  let icons = {};
  tokenIconsStore.subscribe((value) => icons = value)();
  if (icons[tokenId]) {
    return icons[tokenId];
  }
  return staticTokenIcons[tokenId] || null;
}
function hasTokenIcon(tokenId) {
  return getTokenIcon(tokenId) !== null;
}
function StatsOverview($$payload, $$props) {
  push();
  let {
    ergPrice: ergPrice2 = null,
    protocolInfo = null,
    latestBlocks = [],
    networkStats = null
  } = $$props;
  function getLogoSrc() {
    return "/images/logo-new.png";
  }
  $$payload.out += `<div class="row w-100 div-cell-dark"><div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3"><div class="d-flex align-items-center"><div class="me-3 text-center mx-auto index-card-symbol-holder"><img id="erg-logo"${attr("src", getLogoSrc())} alt="Ergo coin" style="width:50px; height:50px;"/></div> <div class="flex-grow-1"><p class="mb-1"><span class="erg-span"><b>ERG</b></span> price</p> <div class="d-flex align-items-center gap-2"><h2 class="text-strong index-card-values mb-0">`;
  if (ergPrice2) {
    $$payload.out += "<!--[-->";
    $$payload.out += `${escape_html(formatCurrency(parseFloat(ergPrice2.value), 2))}`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `--`;
  }
  $$payload.out += `<!--]--></h2> `;
  if (ergPrice2 && ergPrice2.difference) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span${attr_class(`price-change ${stringify(parseFloat(ergPrice2.difference) >= 0 ? "positive" : "negative")}`, "svelte-1ms9dz7")}>${escape_html(parseFloat(ergPrice2.difference) >= 0 ? "+" : "")}${escape_html(formatNumber(parseFloat(ergPrice2.difference), 2))}%</span>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></div></div> <hr class="my-3"/> <div class="d-flex align-items-center"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-globe erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p class="mb-1"><strong class="erg-span"></strong>Market cap</p> <h2 class="text-strong index-card-values mb-0">${escape_html(ergPrice2 && protocolInfo ? formatCurrency(protocolInfo.supply / 1e9 * parseFloat(ergPrice2.value), 0) : "--")}</h2></div></div></div> <hr class="my-3 d-block d-md-none"/> <div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3"><div class="d-flex align-items-center"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-bars erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p class="mb-1">Block height</p> <h2 class="text-strong index-card-values mb-0">${escape_html(latestBlocks.length > 0 ? formatNumber(latestBlocks[0].height, 0) : "--")}</h2></div></div> <hr class="my-3"/> <div class="d-flex align-items-center"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-list erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p class="mb-1"><strong class="erg-span"></strong>Total transactions</p> <h2 class="text-strong index-card-values mb-0">${escape_html(networkStats?.maxTxGix ? formatNumber(networkStats.maxTxGix, 0) : "--")}</h2></div></div></div> <hr class="my-3 d-block d-lg-none"/> <div class="col p-1 ps-lg-3 border-lg-start"><h2 class="erg-span" style="font-size:1.7em; margin-bottom: 0;">Protocol information</h2> <br/> <h5 style="font-size:1em" class="text-light">Version: <span class="text-white">${escape_html(protocolInfo?.version || "Unknown")}</span></h5> <h5 style="font-size:1em" class="text-light">Circulating Supply: <span class="text-white">${html(protocolInfo?.supply ? formatErgValue(protocolInfo.supply / 1e9, 0) : "--")}</span></h5> <h5 style="font-size:1em" class="text-light">Max Supply: <span class="text-white">97,739,924 <span class="erg-span">ERG</span></span></h5></div></div>`;
  pop();
}
function hasIcon(tokenId) {
  return hasTokenIcon(tokenId);
}
function getIcon(tokenId) {
  return getTokenIcon(tokenId);
}
function getAssetTitleParams(token, tokenId, name, iconIsToTheLeft, scam = false) {
  if (tokenId === void 0 && name === "ERG") {
    return ERG_SPAN;
  }
  let imgSrc = "";
  if (hasIcon(tokenId)) {
    imgSrc = getIcon(tokenId);
  } else {
    console.log("No icon found for", tokenId);
  }
  if (name == "Crooks Finance Stake Key") {
    imgSrc = "https://crooks-fi.com/images/logo.png";
  }
  if (name == "Mew Fun Lottery Ticket") {
    imgSrc = `${API_ENDPOINTS.ERGEXPLORER}nftcache/bafybeie6z4zm7ahjvlawjfq4idojdrahklksygpfmb4zvlrx3id3h5dyty.png`;
  }
  if (token && token.iconurl) {
    imgSrc = token.iconurl;
  }
  const displayName = name == "" || name == null ? tokenId.substring(0, 15) + (tokenId.length > 15 ? "..." : "") : name;
  const iconHtml = imgSrc ? `<img class="token-icon me-2" src="${imgSrc}" alt="${displayName}" />` : "";
  const content = iconIsToTheLeft ? iconHtml + displayName : displayName + (imgSrc ? " " + iconHtml : "");
  return `<a title="${scam ? "Reported as suspicious by users." : ""}" class="token-link ${scam ? "text-danger" : ""}" href="${getTokenUrl(tokenId)}" data-token-id="${tokenId}" data-token-name="${displayName}">${content}</a>`;
}
function getTokenUrl(tokenId) {
  return `/tokens/${tokenId}`;
}
function TopVolumeTokens($$payload, $$props) {
  push();
  let loading;
  let topVolumeTokens = fallback($$props["topVolumeTokens"], () => [], true);
  const headers = [
    {
      label: "Token",
      field: "asset",
      render: (value, row) => getAssetTitleParams(null, row.asset, row.name, true)
    },
    {
      label: "Volume",
      field: "total_usd",
      render: (value) => `$${formatValue(value, 2)}`
    }
  ];
  loading = topVolumeTokens.length === 0;
  $$payload.out += `<div class="col-lg-6 p-0 pe-lg-3"><h2 class="subtitle ps-1 ps-sm-0">Top 10 by DEX volume</h2> `;
  DataTable($$payload, {
    headers,
    data: topVolumeTokens,
    loading,
    emptyMessage: "Loading volume data..."
  });
  $$payload.out += `<!----></div>`;
  bind_props($$props, { topVolumeTokens });
  pop();
}
function GainersLosers($$payload, $$props) {
  push();
  let loading;
  let gainersLosersData = fallback($$props["gainersLosersData"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "24h");
  let onPeriodChange = fallback($$props["onPeriodChange"], () => {
  });
  const headers = [
    {
      label: "Token",
      field: "tokenid",
      render: (value, row) => getAssetTitleParams(row, row.tokenid, row.ticker, true)
    },
    {
      label: "Price",
      field: "currentPrice",
      render: (value) => `$${formatValue(value, 0, true)}`
    },
    {
      label: "Change",
      field: "difference",
      render: (value) => formatPercentageStyled(value)
    }
  ];
  loading = gainersLosersData.length === 0;
  $$payload.out += `<div class="col-lg-6 p-0 ps-lg-3"><div class="header-with-controls svelte-dgd410"><h2 class="subtitle ps-1 ps-sm-0">Top 5 profit/loss</h2> <div class="period-controls svelte-dgd410"><button${attr_class(`btn btn-sm ${stringify(selectedPeriod === "24h" ? "btn-info" : "btn-primary")}`, "svelte-dgd410")} type="button">24h</button> <button${attr_class(`btn btn-sm ${stringify(selectedPeriod === "7d" ? "btn-info" : "btn-primary")}`, "svelte-dgd410")} type="button">7d</button> <button${attr_class(`btn btn-sm ${stringify(selectedPeriod === "30d" ? "btn-info" : "btn-primary")}`, "svelte-dgd410")} type="button">30d</button></div></div> `;
  DataTable($$payload, {
    headers,
    data: gainersLosersData,
    loading,
    emptyMessage: "Loading price data..."
  });
  $$payload.out += `<!----></div>`;
  bind_props($$props, {
    gainersLosersData,
    selectedPeriod,
    onPeriodChange
  });
  pop();
}
function TokenTables($$payload, $$props) {
  let topVolumeTokens = fallback($$props["topVolumeTokens"], () => [], true);
  let gainersLosersData = fallback($$props["gainersLosersData"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "24h");
  let onPeriodChange = fallback($$props["onPeriodChange"], () => {
  });
  $$payload.out += `<div class="row w-100 mt-3" role="region" aria-label="Token data tables">`;
  TopVolumeTokens($$payload, { topVolumeTokens });
  $$payload.out += `<!----> `;
  GainersLosers($$payload, {
    gainersLosersData,
    selectedPeriod,
    onPeriodChange
  });
  $$payload.out += `<!----></div>`;
  bind_props($$props, {
    topVolumeTokens,
    gainersLosersData,
    selectedPeriod,
    onPeriodChange
  });
}
function WhaleTransactions($$payload, $$props) {
  push();
  let loading;
  let whaleTxs = fallback($$props["whaleTxs"], () => [], true);
  let currentPrices2 = fallback($$props["currentPrices"], () => ({}), true);
  const headers = [
    {
      label: "Tx",
      field: "txid",
      render: (value) => `<a href="/transactions/${value}" data-transaction-hover="${value}" aria-label="View transaction ${value}"><i class="fas fa-link text-info"></i></a>`
    },
    {
      label: "Time",
      field: "time",
      render: (value) => formatDateString(parseInt(value))
    },
    {
      label: "From",
      field: "fromaddress",
      render: (value) => renderAddressCell(value, 9, 4)
    },
    {
      label: "To",
      field: "toaddress",
      render: (value) => renderAddressCell(value, 9, 4)
    },
    {
      label: "Value",
      field: "value",
      render: (value, row) => renderValueCell(value, row)
    }
  ];
  function renderAddressCell(address, startChars, endChars) {
    if (!address) return "";
    return `<span data-address-wrapper="${address}" data-start-chars="${startChars}" data-end-chars="${endChars}"></span>`;
  }
  function renderValueCell(value, row) {
    let result = `${formatValue(row.value / Math.pow(10, row.decimals), row.decimals)} ${getAssetTitleParams(null, row.tokenId, row.ticker, false)}`;
    if (row.value && currentPrices2[row.tokenid]) {
      result += ` <span class="text-light">${formatPriceUSD(row.value, row.decimals, currentPrices2[row.tokenid])}</span>`;
    }
    return result;
  }
  loading = whaleTxs.length === 0;
  $$payload.out += `<div class="row w-100"><h2 class="subtitle ps-1 ps-sm-0">Latest big transactions</h2> <div class="d-none d-lg-block p-0">`;
  DataTable($$payload, {
    headers,
    data: whaleTxs,
    loading,
    emptyMessage: "Loading whale transactions..."
  });
  $$payload.out += `<!----></div> <div class="d-lg-none mobile-whale-txs glass-table-container svelte-1fn406m">`;
  if (whaleTxs.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(whaleTxs);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let tx = each_array[index];
      $$payload.out += `<div class="mobile-tx-item svelte-1fn406m"><div class="d-flex justify-content-between align-items-center mb-2 row"><a${attr("href", `/transactions/${stringify(tx.txid)}`)}${attr("data-transaction-hover", tx.txid)} class="text-info svelte-1fn406m"${attr("aria-label", `View transaction ${stringify(tx.txid)}`)}><i class="fas fa-link me-1"></i> Transaction</a> <span class="text-light small">${escape_html(formatDateString(parseInt(tx.time)))}</span></div> <div class="row mb-1"><div class="col-3 text-muted small">From:</div> <div class="col-9">`;
      AddressLink($$payload, {
        address: tx.fromaddress,
        startChars: 15,
        endChars: 4
      });
      $$payload.out += `<!----></div></div> <div class="row mb-1"><div class="col-3 text-muted small">To:</div> <div class="col-9">`;
      AddressLink($$payload, {
        address: tx.toaddress,
        startChars: 15,
        endChars: 4
      });
      $$payload.out += `<!----></div></div> <div class="row"><div class="col-3 text-muted small">Value:</div> <div class="col-9 text-white">${html(formatValue(tx.value / Math.pow(10, tx.decimals), tx.decimals))} ${html(getAssetTitleParams(null, tx.tokenId, tx.ticker, false))} `;
      if (tx.value && currentPrices2[tx.tokenid]) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="text-light small">(${escape_html(formatPriceUSD(tx.value, tx.decimals, currentPrices2[tx.tokenid]))})</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></div></div></div>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="text-center py-4 text-light">`;
    {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<i class="fas fa-spinner fa-spin me-2"></i>Loading whale transactions...`;
    }
    $$payload.out += `<!--]--></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
  bind_props($$props, { whaleTxs, currentPrices: currentPrices2 });
  pop();
}
function DailyStats($$payload, $$props) {
  push();
  let statsData = fallback($$props["statsData"], null);
  let ergPrice2 = fallback($$props["ergPrice"], null);
  $$payload.out += `<div class="row w-100 p-0"><div class="col-md-12 m-0 p-0"><div class="glass-card"><div class="card-header svelte-1yqzhq3"><h2 class="section-title svelte-1yqzhq3">24h Stats</h2></div> <div class="card-content svelte-1yqzhq3">`;
  if (!statsData) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<i class="fas fa-spinner fa-spin me-2"></i>Loading statistics...`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="row w-100 p-0 gx-5"><div class="col-md-6 ps-0"><h3 class="p-0 erg-span">Block summary</h3> <div class="col-12 p-0 p-sm-0"><div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Blocks mined</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.blockSummary.total ? formatNumberLarge(statsData.blockSummary.total, 0) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Average mining time</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.blockSummary.averageMiningTime ? formatMiningTime(statsData.blockSummary.averageMiningTime) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Coins mined</strong></div> <div class="col svelte-1yqzhq3">`;
    if (statsData?.blockSummary.totalCoins) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-strong svelte-1yqzhq3">${html(formatErgValue(statsData.blockSummary.totalCoins, 9, false))}<span class="text-light">${escape_html(ergPrice2 ? formatPriceUSD(statsData.blockSummary.totalCoins, ERG_DECIMALS, ergPrice2.value) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="svelte-1yqzhq3">--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="d-block d-sm-none my-2" style="border:0;"/> <h3 class="mt-3 p-0 erg-span">Transactions summary</h3> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Number of Transactions</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.transactionsSummary.total ? formatNumberLarge(statsData.transactionsSummary.total, 0) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Total Transaction Fees</strong></div> <div class="col svelte-1yqzhq3">`;
    if (statsData?.transactionsSummary.totalFee) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-strong svelte-1yqzhq3">${html(formatErgValue(statsData.transactionsSummary.totalFee))} <span class="text-light">${escape_html(ergPrice2 ? formatPriceUSD(statsData.transactionsSummary.totalFee, 9, ergPrice2.value) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="svelte-1yqzhq3">--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="d-block d-sm-none my-2" style="border:0;"/></div></div> <div class="col-md-6 p-0"><h3 class="p-1 p-sm-3 ps-0 erg-span" style="padding-top: 0 !important; padding-bottom: 0 !important;">Mining cost</h3> <div class="col-12 p-0 p-sm-0"><div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Total Miners Revenue</strong></div> <div class="col svelte-1yqzhq3">`;
    if (statsData?.miningCost.totalMinersRevenue) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-strong svelte-1yqzhq3">${html(formatErgValue(statsData.miningCost.totalMinersRevenue))} <span class="text-light">${escape_html(ergPrice2 ? formatPriceUSD(statsData.miningCost.totalMinersRevenue, ERG_DECIMALS, ergPrice2.value) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="svelte-1yqzhq3">--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>% Earned From Transaction Fees</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.miningCost.percentEarnedTransactionsFees ? formatNumber(statsData.miningCost.percentEarnedTransactionsFees, 2) + "%" : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>% Of Transaction Volume</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.miningCost.percentTransactionVolume ? formatNumber(statsData.miningCost.percentTransactionVolume, 4) + "%" : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Cost per Transaction</strong></div> <div class="col svelte-1yqzhq3">`;
    if (statsData?.miningCost.costPerTransaction) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-strong svelte-1yqzhq3">${html(formatErgValue(statsData.miningCost.costPerTransaction))} <span class="text-light">${escape_html(ergPrice2 ? formatPriceUSD(statsData.miningCost.costPerTransaction, 9, ergPrice2.value) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p class="svelte-1yqzhq3">--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Difficulty</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.miningCost.difficulty ? formatNumberLarge(statsData.miningCost.difficulty, 0) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1 ps-0"><div class="col-6 pe-2 p-sm-1 ps-0"><strong>Hash Rate</strong></div> <div class="col svelte-1yqzhq3"><p class="svelte-1yqzhq3">${escape_html(statsData?.miningCost.hashRate ? formatHashRate(statsData.miningCost.hashRate) : "--")}</p></div></div></div></div></div>`;
  }
  $$payload.out += `<!--]--></div></div></div></div>`;
  bind_props($$props, { statsData, ergPrice: ergPrice2 });
  pop();
}
function _page($$payload, $$props) {
  push();
  let data = $$props["data"];
  let ergPriceValue = null;
  let currentPricesValue = {};
  let networkStats = null;
  let protocolInfo = null;
  let statsData = null;
  let latestBlocks = [];
  let topVolumeTokens = [];
  let whaleTxs = [];
  let gainersLosersData = [];
  let selectedPeriod = "24h";
  ergPrice.subscribe((price) => {
    ergPriceValue = price;
  });
  currentPrices.subscribe((prices) => {
    currentPricesValue = prices;
  });
  function handlePeriodChange(period) {
    selectedPeriod = period;
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Erg Explorer - Ergo Blockchain Explorer</title>`;
  });
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  StatsOverview($$payload, {
    ergPrice: ergPriceValue,
    protocolInfo,
    latestBlocks,
    networkStats
  });
  $$payload.out += `<!----> `;
  TokenTables($$payload, {
    topVolumeTokens,
    gainersLosersData,
    selectedPeriod,
    onPeriodChange: handlePeriodChange
  });
  $$payload.out += `<!----> `;
  WhaleTransactions($$payload, { whaleTxs, currentPrices: currentPricesValue });
  $$payload.out += `<!----> <div class="row w-100"><h2 class="subtitle ps-1 ps-sm-0">Latest blocks</h2> `;
  DataTable($$payload, {
    headers: getLatestBlocksHeaders(),
    data: latestBlocks,
    loading: latestBlocks.length === 0,
    emptyMessage: "Loading blocks..."
  });
  $$payload.out += `<!----></div> <br/> <br/> `;
  DailyStats($$payload, { statsData, ergPrice: ergPriceValue });
  $$payload.out += `<!----> <br/> <br/>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
