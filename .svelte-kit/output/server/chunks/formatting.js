import { E as ERG_DECIMALS } from "./constants.js";
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
  return item ? (isMinus ? "-" : "") + (num / item.value).toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits
  }).replace(rx, "$1") + item.symbol : (isMinus ? "-" : "") + new Intl.NumberFormat("en-US", options).format(num);
}
function formatNumber$1(value, maxDecimals = 0, minDecimals = 0) {
  if (value == null || isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: minDecimals
  });
}
function formatValue(value, digits = 2, autodigits = false, same = false) {
  if (value == null || isNaN(value)) return "—";
  if (autodigits) {
    digits = getAutoDigits(value, digits);
  }
  let vstring = "";
  let minimumFractionDigits = 2;
  if (digits < minimumFractionDigits) {
    minimumFractionDigits = digits;
  }
  if (!isFloat(value) && isLargerThanMaxSafeInteger(value)) {
    vstring = formatBigIntToLocaleString(value);
  } else {
    vstring = value.toLocaleString("en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits
    });
  }
  if (same) {
    return `<span title="${vstring}">${vstring}</span>`;
  } else {
    return `<span title="${vstring}">${nFormatter(value, digits)}</span>`;
  }
}
function getAutoDigits(value, digits = 2, additionalDigits = 2) {
  let temp = value.toString().split(".");
  if (temp.length > 1) {
    let realSmall = temp[1].split("-");
    if (realSmall.length > 1) {
      digits = parseInt(realSmall[1]) + 1;
    } else {
      for (let j = 0; j < temp[1].length; j++) {
        if (temp[1][j] != "0" && j > 1) {
          digits = j + additionalDigits;
          if (j + 1 < temp[1].length && temp[1][j] != "0") {
            digits = j + additionalDigits + 1;
          }
          break;
        }
      }
    }
  }
  return digits;
}
function isFloat(value) {
  return typeof value === "number" && !Number.isInteger(value) && !isNaN(value);
}
function isLargerThanMaxSafeInteger(numberAsString) {
  let parsedNumber = BigInt(numberAsString);
  return parsedNumber > Number.MAX_SAFE_INTEGER;
}
function formatBigIntToLocaleString(bigIntNumber) {
  let bigIntAsString = bigIntNumber.toString();
  let chunks = [];
  while (bigIntAsString.length > 0) {
    chunks.unshift(bigIntAsString.slice(-3));
    bigIntAsString = bigIntAsString.slice(0, -3);
  }
  let formattedString = chunks.join(",");
  return formattedString;
}
function formatPercentage(value, decimals = 2) {
  if (value == null || isNaN(value)) return "—";
  const formatted = value.toFixed(decimals);
  const className = value >= 0 ? "text-success" : "text-danger";
  const sign = value >= 0 ? "+" : "";
  return `<span class="${className}">${sign}${formatted}%</span>`;
}
function formatHashRate$1(value) {
  if (value == null || isNaN(value)) return "—";
  return (value / 1e12).toLocaleString("en-US") + " TH/s";
}
function formatKbSize(size) {
  if (size == null || isNaN(size)) return "—";
  return (size / 1e3).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }) + " kB";
}
const ERG_SPAN = ' <span class="erg-span">ERG</span>';
function formatErgValue(value, decimals = ERG_DECIMALS, showDecimals = true) {
  if (!value && value !== 0) return `0 ${ERG_SPAN}`;
  let maxDecimals = ERG_DECIMALS;
  const num = parseFloat(value);
  const divisor = Math.pow(10, decimals);
  const ergValue = num / divisor;
  if (ergValue > 1) {
    maxDecimals = 2;
  }
  if (!showDecimals && ergValue >= 1) {
    return Math.floor(ergValue).toLocaleString() + ` ${ERG_SPAN}`;
  }
  return ergValue.toLocaleString(void 0, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, maxDecimals)
  }) + ERG_SPAN;
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
function formatNumberLarge(num, decimals = 2) {
  if (num == null || isNaN(num)) return "0";
  return nFormatter(num, decimals);
}
function formatCurrency(amount, decimals = 2) {
  if (amount == null || isNaN(amount)) return "$0.00";
  return "$" + formatNumber$1(amount, decimals, decimals);
}
function formatPercentageStyled(value, decimals = 2) {
  if (value == null || isNaN(value)) return "—";
  return formatPercentage(value, decimals);
}
function formatPriceUSD(amount, decimals, usdPrice) {
  if (!amount || !usdPrice) return "($0.00)";
  const erg = parseFloat(amount) / Math.pow(10, decimals);
  const usdValue = erg * parseFloat(usdPrice);
  return " ($" + usdValue.toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ")";
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
function formatAddress(address, startLength = 6, endLength = 6) {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
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
  ERG_SPAN as E,
  formatValue as a,
  formatNumber as b,
  formatErgValue as c,
  formatDateString as d,
  formatKbSize as e,
  formatAddress as f,
  formatCurrency as g,
  formatPercentageStyled as h,
  formatPriceUSD as i,
  formatNumberLarge as j,
  formatMiningTime as k,
  formatHashRate as l,
  formatFileSize as m,
  formatDifficulty as n,
  formatTokenAmount as o
};
