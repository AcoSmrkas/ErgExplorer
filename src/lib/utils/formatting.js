import { ERG_DECIMALS } from "$lib/utils/constants.js";
import {
  nFormatter,
  formatNumber as formatNum,
} from "./numberFormatting.js";

export const ERG_SPAN = ' <span class="erg-span">ERG</span>';

export function formatErgValue(
  value,
  decimals = ERG_DECIMALS,
  showDecimals = true,
) {
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

  return (
    ergValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.min(decimals, maxDecimals),
    }) + ERG_SPAN
  );
}

export function formatTokenAmount(amount, decimals = 0) {
  if (!amount && amount !== 0) return "0";

  const num = parseFloat(amount);
  const divisor = Math.pow(10, decimals);
  const tokenValue = num / divisor;

  return tokenValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(decimals, 8),
  });
}

export function formatDateString(timestamp, full = false) {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (!full) {
    // Less than 1 minute
    if (diff < 60000) {
      return "Just now";
    }

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
  }

  // Default to full date
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
}

export function formatFileSize(bytes) {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

// Re-export formatNumber from numberFormatting for consistency  
export { formatNumber } from "./numberFormatting.js";

// Large number formatting with abbreviated suffixes (M, B, T) - alias for nFormatter
export function formatNumberLarge(num, decimals = 2, symbol = true) {
  if (num == null || isNaN(num)) return "0";
  return nFormatter(num, decimals, !symbol);
}

// Currency formatting with consistent decimal places
export function formatCurrency(amount, decimals = 2) {
  if (amount == null || isNaN(amount)) return "$0.00";
  return "$" + formatNum(amount, decimals, decimals);
}

// Alias for formatPercentage for backward compatibility
export { formatPercentage as formatPercentageStyled } from "./numberFormatting.js";

// Alias for nFormatter
export function formatNumberShort(num, decimals = 0) {
  if (num == null || isNaN(num)) return "0";
  return nFormatter(num, decimals);
}

export function formatPriceUSD(amount, decimals, usdPrice) {
  if (!amount || !usdPrice) return "";

  const erg = parseFloat(amount) / Math.pow(10, decimals);
  const usdValue = erg * parseFloat(usdPrice);

  if (usdValue < 0.01) {
    return "";
  }

  return (
    " ($" +
    usdValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    ")"
  );
}

export function formatDifficulty(difficulty) {
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

export function truncateText(text, maxLength = 50) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function formatAddress(address, startLength = 6, endLength = 6) {
  if (!address) return "";
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

export function formatMiningTime(milliseconds) {
  if (!milliseconds) return "0s";

  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Re-export formatHashRate from numberFormatting
export { formatHashRate } from "./numberFormatting.js";
