import { K as fallback, G as escape_html, N as bind_props, C as pop, z as push, S as ensure_array_like, F as attr_class, O as stringify, E as attr, T as clsx, P as head } from "../../chunks/index.js";
import "../../chunks/ErrorMessage.svelte_svelte_type_style_lang.js";
import { f as formatNumber, b as formatDateString, a as formatErgValue, n as nFormatter, d as formatMiningTime, e as formatHashRate } from "../../chunks/formatting.js";
import { A as API_ENDPOINTS } from "../../chunks/api.js";
import { h as html } from "../../chunks/html.js";
import { a as addressBook, g as getOwner, b as addAddress, e as ergPrice, d as currentPrices } from "../../chunks/addressBook.js";
function StatsOverview($$payload, $$props) {
  push();
  let ergPrice2 = fallback($$props["ergPrice"], null);
  let protocolInfo = fallback($$props["protocolInfo"], null);
  let latestBlocks = fallback($$props["latestBlocks"], () => [], true);
  let networkStats = fallback($$props["networkStats"], null);
  $$payload.out += `<div class="row w-100 div-cell-dark"><div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3"><div class="d-flex"><div class="me-3 text-center mx-auto index-card-symbol-holder"><img id="erg-logo" src="/images/logo-new.png" alt="Ergo coin" style="width:50px; height:50px;"/></div> <div class="flex-grow-1"><p><span class="erg-span"><b>ERG</b></span> price</p> <h2 class="text-white index-card-values">`;
  if (ergPrice2) {
    $$payload.out += "<!--[-->";
    $$payload.out += `$${escape_html(formatNumber(parseFloat(ergPrice2.value), 4))}`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `--`;
  }
  $$payload.out += `<!--]--></h2></div></div> <hr class="my-3"/> <div class="d-flex"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-globe erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p><strong class="erg-span"></strong>Market cap</p> <h2 class="text-white index-card-values">${escape_html(ergPrice2 && protocolInfo ? "$" + formatNumber(protocolInfo.supply / 1e9 * parseFloat(ergPrice2.value), 2) : "--")}</h2></div></div></div> <hr class="my-3 d-block d-md-none"/> <div class="col-md-6 col-lg-4 p-1 pe-0 ps-0 pe-lg-3"><div class="d-flex"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-bars erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p>Block height</p> <h2 class="text-white index-card-values">${escape_html(latestBlocks.length > 0 ? formatNumber(latestBlocks[0].height) : "--")}</h2></div></div> <hr class="my-3"/> <div class="d-flex"><div class="me-3 text-center mx-auto index-card-symbol-holder"><i class="fas fa-list erg-span index-card-symbol"></i></div> <div class="flex-grow-1"><p><strong class="erg-span"></strong>Total transactions</p> <h2 class="text-white index-card-values">${escape_html(networkStats?.maxTxGix ? formatNumber(networkStats.maxTxGix) : "--")}</h2></div></div></div> <hr class="my-3 d-block d-lg-none"/> <div class="col p-1 ps-lg-3 border-lg-start"><h2 class="erg-span" style="font-size:1.7em; margin-bottom: 0;">Protocol information</h2> <br/> <h5 style="font-size:1em" class="text-light">Version: <span class="text-white">${escape_html(protocolInfo?.version || "Unknown")}</span></h5> <h5 style="font-size:1em" class="text-light">Circulating Supply: <span class="text-white">${escape_html(protocolInfo?.supply ? formatNumber(protocolInfo.supply / 1e9, 1) + " ERG" : "--")}</span></h5> <h5 style="font-size:1em" class="text-light">Max Supply: <span class="text-white">97,739,924 ERG</span></h5></div></div>`;
  bind_props($$props, {
    ergPrice: ergPrice2,
    protocolInfo,
    latestBlocks,
    networkStats
  });
  pop();
}
let tokenIconsDb = {};
const tokenIcons = {
  "ERG": "/images/logo-new.png",
  // Common tokens that might have local icons
  "e8b20745ee9d18817305f32eb21015831a48f02d40980de6e849f886dca7f807": "/images/tokens/flux.png",
  "4f792b75a0f1a46083824cfd6b4766d094698d71c37f7f5083bf09dec3d0fbcd": "/images/tokens/dude.png"
};
function hasIcon(tokenId) {
  if (tokenIconsDb[tokenId]) {
    return true;
  }
  return tokenIcons[tokenId] != void 0;
}
function getIcon(tokenId) {
  if (tokenIconsDb[tokenId]) {
    return tokenIconsDb[tokenId];
  }
  return tokenIcons[tokenId];
}
function getAssetTitleParams(token, tokenId, name, iconIsToTheLeft, scam = false) {
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
  if (tokenId == "ERG") {
    return name;
  }
  const displayName = name == "" || name == null ? tokenId.substring(0, 15) + (tokenId.length > 15 ? "..." : "") : name;
  const iconHtml = imgSrc ? `<img class="token-icon me-2" src="${imgSrc}" alt="${displayName}" />` : "";
  const content = iconHtml + displayName;
  return `<a title="${scam ? "Reported as suspicious by users." : ""}" class="token-link ${scam ? "text-danger" : ""}" href="${getTokenUrl(tokenId)}" data-token-id="${tokenId}" data-token-name="${displayName}">${content}</a>`;
}
function getTokenUrl(tokenId) {
  return `/tokens/${tokenId}`;
}
function TopVolumeTokens($$payload, $$props) {
  push();
  let topVolumeTokens = fallback($$props["topVolumeTokens"], () => [], true);
  $$payload.out += `<div class="col-lg-6 p-0 pe-lg-3"><h2 class="subtitle ps-1 ps-sm-0">Top 10 by DEX volume</h2> <table class="table table-striped table-dark"><thead><tr><th scope="col">Token</th><th scope="col">Volume</th></tr></thead><tbody>`;
  if (topVolumeTokens.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(topVolumeTokens);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let token = each_array[index];
      $$payload.out += `<tr><td>${html(getAssetTitleParams(null, token.asset, token.name))}</td><td>$${escape_html(formatNumber(token.total_usd, 2))}</td></tr>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<tr><td colspan="2" class="text-center text-light"><i class="fas fa-spinner fa-spin me-2"></i>Loading volume data...</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div>`;
  bind_props($$props, { topVolumeTokens });
  pop();
}
function GainersLosers($$payload, $$props) {
  push();
  let gainersLosersData = fallback($$props["gainersLosersData"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "24h");
  let onPeriodChange = fallback($$props["onPeriodChange"], () => {
  });
  $$payload.out += `<div class="col-lg-6 p-0 ps-lg-3"><h2 style="display:inline-block;" class="subtitle ps-1 ps-sm-0">Top 5 profit/loss</h2> <input${attr_class(`p-2 p-sm-2 btn ${stringify(selectedPeriod === "30d" ? "btn-info" : "btn-primary")} float-end`)} style="margin-top:23px;margin-bottom:10px;margin-left:5px;display:inline-block;" type="button" value="30d"/> <input${attr_class(`p-2 p-sm-2 btn ${stringify(selectedPeriod === "7d" ? "btn-info" : "btn-primary")} float-end`)} style="margin-top:23px;margin-bottom:10px;display:inline-block;" type="button" value="7d"/> <input${attr_class(`p-2 p-sm-2 btn ${stringify(selectedPeriod === "24h" ? "btn-info" : "btn-primary")} float-end`)} style="margin-top:23px;margin-bottom:10px;margin-right:5px;display:inline-block;" type="button" value="24h"/> <table class="table table-dark table-striped"><thead><tr><th scope="col">Token</th><th scope="col">Price</th><th scope="col">Change</th></tr></thead><tbody>`;
  if (gainersLosersData.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(gainersLosersData);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let token = each_array[index];
      $$payload.out += `<tr><td>${html(getAssetTitleParams(token, token.tokenid, token.ticker))}</td><td>$${escape_html(formatNumber(token.currentPrice, 4))}</td><td><span${attr_class(token.difference >= 0 ? "text-success" : "text-danger")}>${escape_html(token.difference >= 0 ? "+" : "")}${escape_html(formatNumber(token.difference, 2))}%</span></td></tr>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<tr><td colspan="3" class="text-center text-light"><i class="fas fa-spinner fa-spin me-2"></i>Loading price data...</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div>`;
  bind_props($$props, {
    gainersLosersData,
    selectedPeriod,
    onPeriodChange
  });
  pop();
}
function TokenTables($$payload, $$props) {
  push();
  let topVolumeTokens = fallback($$props["topVolumeTokens"], () => [], true);
  let gainersLosersData = fallback($$props["gainersLosersData"], () => [], true);
  let selectedPeriod = fallback($$props["selectedPeriod"], "24h");
  let onPeriodChange = fallback($$props["onPeriodChange"], () => {
  });
  $$payload.out += `<div class="row w-100" role="region" aria-label="Token data tables">`;
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
  pop();
}
function AddressLink($$payload, $$props) {
  push();
  let ownerName, displayText, addressUrl;
  let address = fallback($$props["address"], "");
  let name = fallback($$props["name"], "");
  let startChars = fallback($$props["startChars"], 9);
  let endChars = fallback($$props["endChars"], 3);
  let showCopy = fallback($$props["showCopy"], true);
  let linkClass = fallback($$props["linkClass"], "address-link");
  let currentAddressBook = [];
  addressBook.subscribe((value) => {
    currentAddressBook = value;
  });
  ownerName = getOwner(address, currentAddressBook);
  displayText = name || ownerName || (address ? address.length <= startChars + endChars ? address : address.substring(0, startChars) + "..." + address.substring(address.length - endChars) : "Unknown Address");
  addressUrl = `/addresses/${address}`;
  if (address && !name) {
    addAddress(address);
  }
  if (address) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<span class="address-link-wrapper svelte-g5aa4h"><a${attr_class(clsx(linkClass), "svelte-g5aa4h")}${attr("href", addressUrl)}${attr("data-address", address)}${attr("title", name ? `${name} (${address})` : ownerName ? `${ownerName} - ${address}` : address)}>${escape_html(displayText)}</a> `;
    if (showCopy) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button class="copy-btn-inline svelte-g5aa4h" title="Copy address to clipboard"><i class="fas fa-copy"></i></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></span>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<span class="text-muted">N/A</span>`;
  }
  $$payload.out += `<!--]-->`;
  bind_props($$props, {
    address,
    name,
    startChars,
    endChars,
    showCopy,
    linkClass
  });
  pop();
}
function WhaleTransactions($$payload, $$props) {
  push();
  let whaleTxs = fallback($$props["whaleTxs"], () => [], true);
  let currentPrices2 = fallback($$props["currentPrices"], () => ({}), true);
  $$payload.out += `<div class="row w-100"><h2 class="subtitle ps-1 ps-sm-0">Latest big transactions</h2> <div class="d-none d-lg-block p-0"><table class="table table-dark table-striped"><thead><tr><th scope="col">Tx</th><th scope="col">Time</th><th scope="col">From</th><th scope="col">To</th><th scope="col">Value</th></tr></thead><tbody>`;
  if (whaleTxs.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(whaleTxs);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let tx = each_array[index];
      $$payload.out += `<tr><td><a${attr("href", `/transactions/${stringify(tx.txid)}`)}${attr("aria-label", `View transaction ${stringify(tx.txid)}`)}><i class="fas fa-link text-info"></i></a></td><td>${escape_html(formatDateString(parseInt(tx.time)))}</td><td>`;
      AddressLink($$payload, {
        address: tx.fromaddress,
        startChars: 6,
        endChars: 4
      });
      $$payload.out += `<!----></td><td>`;
      AddressLink($$payload, {
        address: tx.toaddress,
        startChars: 6,
        endChars: 4
      });
      $$payload.out += `<!----></td><td>${escape_html(formatNumber(tx.value / Math.pow(10, tx.decimals), tx.decimals > 4 ? 4 : tx.decimals))} 
								${escape_html(tx.ticker || "Token")} `;
      if (tx.value && currentPrices2[tx.tokenid]) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="text-light">$${escape_html(formatNumber(tx.value / Math.pow(10, tx.decimals) * currentPrices2[tx.tokenid], 2))}</span>`;
      } else {
        $$payload.out += "<!--[!-->";
      }
      $$payload.out += `<!--]--></td></tr>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<tr><td colspan="5" class="text-center text-light">`;
    {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<i class="fas fa-spinner fa-spin me-2"></i>Loading whale transactions...`;
    }
    $$payload.out += `<!--]--></td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div> <div class="d-lg-none mobile-whale-txs div-cell-dark stripedHolderDark svelte-1wfx2d0">`;
  if (whaleTxs.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array_1 = ensure_array_like(whaleTxs);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let tx = each_array_1[index];
      $$payload.out += `<div class="mobile-tx-item svelte-1wfx2d0"><div class="d-flex justify-content-between align-items-center mb-2 row"><a${attr("href", `/transactions/${stringify(tx.txid)}`)} class="text-info"${attr("aria-label", `View transaction ${stringify(tx.txid)}`)}><i class="fas fa-link me-1"></i> Transaction</a> <span class="text-light small">${escape_html(formatDateString(parseInt(tx.time)))}</span></div> <div class="row mb-1"><div class="col-2 text-muted small">From:</div> <div class="col-10">`;
      AddressLink($$payload, {
        address: tx.fromaddress,
        startChars: 6,
        endChars: 3
      });
      $$payload.out += `<!----></div></div> <div class="row mb-1"><div class="col-2 text-muted small">To:</div> <div class="col-10">`;
      AddressLink($$payload, {
        address: tx.toaddress,
        startChars: 6,
        endChars: 3
      });
      $$payload.out += `<!----></div></div> <div class="row"><div class="col-2 text-muted small">Value:</div> <div class="col-10 text-white">${escape_html(formatNumber(tx.value / Math.pow(10, tx.decimals), tx.decimals > 4 ? 4 : tx.decimals))} 
							${escape_html(tx.ticker || "Token")} `;
      if (tx.value && currentPrices2[tx.tokenid]) {
        $$payload.out += "<!--[-->";
        $$payload.out += `<span class="text-light small">($${escape_html(formatNumber(tx.value / Math.pow(10, tx.decimals) * currentPrices2[tx.tokenid], 2))})</span>`;
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
function LatestBlocks($$payload, $$props) {
  push();
  let latestBlocks = fallback($$props["latestBlocks"], () => [], true);
  $$payload.out += `<div class="row w-100"><h2 class="subtitle ps-1 ps-sm-0">Latest blocks</h2> <table class="table table-dark table-striped"><thead><tr><th scope="col">Height</th><th scope="col">Time</th><th scope="col">Transactions</th><th scope="col">Reward</th></tr></thead><tbody>`;
  if (latestBlocks.length > 0) {
    $$payload.out += "<!--[-->";
    const each_array = ensure_array_like(latestBlocks);
    $$payload.out += `<!--[-->`;
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let block = each_array[index];
      $$payload.out += `<tr><td><a${attr("href", `/blocks/${stringify(block.id)}`)}${attr("data-block-id", block.id)}${attr("aria-label", `View block ${stringify(block.height)}`)}>${escape_html(formatNumber(block.height))}</a></td><td>${escape_html(formatDateString(block.timestamp))}</td><td>${escape_html(formatNumber(block.transactionsCount))}</td><td>${escape_html(formatErgValue(block.minerReward))} ERG</td></tr>`;
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<tr><td colspan="4" class="text-center text-light"><i class="fas fa-spinner fa-spin me-2"></i>Loading latest blocks...</td></tr>`;
  }
  $$payload.out += `<!--]--></tbody></table></div>`;
  bind_props($$props, { latestBlocks });
  pop();
}
function DailyStats($$payload, $$props) {
  push();
  let statsData = fallback($$props["statsData"], null);
  let ergPrice2 = fallback($$props["ergPrice"], null);
  $$payload.out += `<div class="row w-100 p-0"><div class="col-md-12 m-0 div-cell-dark p-2">`;
  if (!statsData) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="text-center py-4"><h2 class="text-white mb-3">24h Stats</h2> <i class="fas fa-spinner fa-spin me-2"></i>Loading statistics...</div>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<div class="row w-100 p-0"><div class="col-md-6 p-0"><h2 class="p-1 p-sm-3 m-0 text-white">24h Stats</h2> <h3 class="p-1 p-sm-3 erg-span">Block summary</h3> <div class="col-12 p-0 p-sm-1"><div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Blocks mined</strong></div> <div class="col"><p>${escape_html(statsData?.blockSummary.total ? nFormatter(statsData.blockSummary.total, 0, true) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Average mining time</strong></div> <div class="col"><p>${escape_html(statsData?.blockSummary.averageMiningTime ? formatMiningTime(statsData.blockSummary.averageMiningTime) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Coins mined</strong></div> <div class="col">`;
    if (statsData?.blockSummary.totalCoins) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-white">${escape_html(formatErgValue(statsData.blockSummary.totalCoins, 9, false))} ERG <span class="text-light">${escape_html(ergPrice2 ? "$" + formatNumber(statsData.blockSummary.totalCoins / 1e9 * parseFloat(ergPrice2.value), 2) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p>--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="d-block d-sm-none my-2" style="border:0;"/> <h3 class="p-1 p-sm-3 erg-span">Transactions summary</h3> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Number of Transactions</strong></div> <div class="col"><p>${escape_html(statsData?.transactionsSummary.total ? nFormatter(statsData.transactionsSummary.total, 0, true) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Total Transaction Fees</strong></div> <div class="col">`;
    if (statsData?.transactionsSummary.totalFee) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-white">${escape_html(formatErgValue(statsData.transactionsSummary.totalFee))} ERG <span class="text-light">${escape_html(ergPrice2 ? "$" + formatNumber(statsData.transactionsSummary.totalFee / 1e9 * parseFloat(ergPrice2.value), 2) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p>--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="d-block d-sm-none my-2" style="border:0;"/></div></div> <div class="col-md-6 p-0"><h3 class="p-1 p-sm-3 erg-span mt-md-5">Mining cost</h3> <div class="col-12 p-0 p-sm-1"><div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Total Miners Revenue</strong></div> <div class="col">`;
    if (statsData?.miningCost.totalMinersRevenue) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-white">${escape_html(formatErgValue(statsData.miningCost.totalMinersRevenue))} ERG <span class="text-light">${escape_html(ergPrice2 ? "$" + formatNumber(statsData.miningCost.totalMinersRevenue / 1e9 * parseFloat(ergPrice2.value), 2) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p>--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>% Earned From Transaction Fees</strong></div> <div class="col"><p>${escape_html(statsData?.miningCost.percentEarnedTransactionsFees ? formatNumber(statsData.miningCost.percentEarnedTransactionsFees, 2) + "%" : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>% Of Transaction Volume</strong></div> <div class="col"><p>${escape_html(statsData?.miningCost.percentTransactionVolume ? formatNumber(statsData.miningCost.percentTransactionVolume, 4) + "%" : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Cost per Transaction</strong></div> <div class="col">`;
    if (statsData?.miningCost.costPerTransaction) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<p class="text-white">${escape_html(formatErgValue(statsData.miningCost.costPerTransaction))} ERG <span class="text-light">${escape_html(ergPrice2 ? "$" + formatNumber(statsData.miningCost.costPerTransaction / 1e9 * parseFloat(ergPrice2.value), 2) : "")}</span></p>`;
    } else {
      $$payload.out += "<!--[!-->";
      $$payload.out += `<p>--</p>`;
    }
    $$payload.out += `<!--]--></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Difficulty</strong></div> <div class="col"><p>${escape_html(statsData?.miningCost.difficulty ? nFormatter(statsData.miningCost.difficulty, 0, true) : "--")}</p></div></div> <hr class="my-1"/> <div class="row w-100 p-0 p-sm-1"><div class="col-6 ps-1 ps-sm-2"><strong>Hash Rate</strong></div> <div class="col"><p>${escape_html(statsData?.miningCost.hashRate ? formatHashRate(statsData.miningCost.hashRate) : "--")}</p></div></div></div></div></div>`;
  }
  $$payload.out += `<!--]--></div></div>`;
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
  $$payload.out += `<!----> `;
  LatestBlocks($$payload, { latestBlocks });
  $$payload.out += `<!----> <br/> `;
  DailyStats($$payload, { statsData, ergPrice: ergPriceValue });
  $$payload.out += `<!----> <br/>`;
  bind_props($$props, { data });
  pop();
}
export {
  _page as default
};
