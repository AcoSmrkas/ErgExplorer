import { E as ERG_DECIMALS } from "./api.js";
function nFormatter(num, digits = 2, noLetter = false, noDecimal = false) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  let isMinus = num < 0;
  if (isMinus) {
    num = Math.abs(num);
  }
  if (num > 10) {
    digits = 2;
  }
  let minimumFractionDigits = 2;
  if (digits < minimumFractionDigits) {
    minimumFractionDigits = digits;
  }
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item2) {
    return num >= item2.value;
  });
  if (noLetter) {
    item = null;
  }
  let options = {
    minimumFractionDigits,
    maximumFractionDigits: digits
  };
  if (noDecimal) {
    options = {};
  }
  return item ? (isMinus ? "-" : "") + (num / item.value).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits }).replace(rx, "$1") + item.symbol : (isMinus ? "-" : "") + new Intl.NumberFormat("en-US", options).format(num);
}
function formatNumber$1(value, maxDecimals = 0, minDecimals = 0) {
  if (value == null || isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: minDecimals
  });
}
function formatHashRate$1(value) {
  if (value == null || isNaN(value)) return "—";
  return (value / 1e12).toLocaleString("en-US") + " TH/s";
}
function formatKbSize(size) {
  if (size == null || isNaN(size)) return "—";
  return (size / 1e3).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + " kB";
}
function formatErgValue(value, decimals = ERG_DECIMALS, showDecimals = true) {
  if (!value && value !== 0) return "0";
  const num = parseFloat(value);
  const divisor = Math.pow(10, decimals);
  const ergValue = num / divisor;
  if (!showDecimals && ergValue >= 1) {
    return Math.floor(ergValue).toLocaleString();
  }
  return ergValue.toLocaleString(void 0, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 8)
  });
}
function formatTokenAmount(amount, decimals = 0) {
  if (!amount && amount !== 0) return "0";
  const num = parseFloat(amount);
  const divisor = Math.pow(10, decimals);
  const tokenValue = num / divisor;
  return tokenValue.toLocaleString(void 0, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 8)
  });
}
function formatDateString(timestamp) {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  const now = /* @__PURE__ */ new Date();
  const diff = now - date;
  if (diff < 6e4) {
    return "Just now";
  }
  if (diff < 36e5) {
    const minutes = Math.floor(diff / 6e4);
    return `${minutes}m ago`;
  }
  if (diff < 864e5) {
    const hours = Math.floor(diff / 36e5);
    return `${hours}h ago`;
  }
  if (diff < 6048e5) {
    const days = Math.floor(diff / 864e5);
    return `${days}d ago`;
  }
  return date.toLocaleDateString() + " " + date.toLocaleTimeString(void 0, {
    hour: "2-digit",
    minute: "2-digit"
  });
}
function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
}
function formatNumber(num, decimals = 0, addCommas = true) {
  if (num == null || isNaN(num)) return "0";
  if (addCommas) {
    return formatNumber$1(num, decimals, 0);
  }
  return parseFloat(num).toFixed(decimals);
}
function formatPriceUSD(ergAmount, ergPrice) {
  return "$0.00";
}
function formatDifficulty(difficulty) {
  if (!difficulty) return "0";
  const num = parseFloat(difficulty);
  if (num >= 1e12) {
    return (num / 1e12).toFixed(2) + "T";
  }
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + "G";
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + "M";
  }
  return formatNumber(num, 0, true);
}
function formatMiningTime(milliseconds) {
  if (!milliseconds) return "0s";
  const minutes = Math.floor(milliseconds / 6e4);
  const seconds = Math.floor(milliseconds % 6e4 / 1e3);
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
function formatHashRate(hashRate) {
  if (!hashRate) return "0 H/s";
  return formatHashRate$1(hashRate);
}
export {
  formatErgValue as a,
  formatDateString as b,
  formatKbSize as c,
  formatMiningTime as d,
  formatHashRate as e,
  formatNumber as f,
  formatPriceUSD as g,
  formatTokenAmount as h,
  formatDifficulty as i,
  formatFileSize as j,
  nFormatter as n
};
