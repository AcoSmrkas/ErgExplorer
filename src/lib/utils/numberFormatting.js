/**
 * Number formatting utilities for consistent display across the application
 * Based on the original nFormatter function from main.js
 */

/**
 * Format number with abbreviated suffixes (M, B, T, etc.)
 * @param {number} num - The number to format
 * @param {number} digits - Maximum decimal places
 * @param {boolean} noLetter - If true, don't use abbreviations (M, B, etc.)
 * @param {boolean} noDecimal - If true, don't show decimal places
 * @returns {string} Formatted number string
 */
export function nFormatter(
  num,
  digits = 2,
  noLetter = false,
  noDecimal = false,
) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
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

  let split = num.toString().split['.'];
  if (split?.length == 2) {
    let allZero = true;
    for (let i = 0; i < split[1].length; i++) {
      if (split[1][i] !== '0') {
        allZero = false;
        break;
      }
    }
    console.log(allZero);
    if (allZero) {
      digits = 0;
    }
  } else {
    digits = 0;
    minimumFractionDigits = 0;
  }

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });

  if (noLetter) {
    item = null;
  }

  let options = {
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: digits,
  };

  if (noDecimal) {
    options = {};
  }

  return item
    ? (isMinus ? "-" : "") +
        (num / item.value)
          .toLocaleString("en-US", {
            maximumFractionDigits: digits,
            minimumFractionDigits: minimumFractionDigits,
          })
          .replace(rx, "$1") +
        item.symbol
    : (isMinus ? "-" : "") +
        new Intl.NumberFormat("en-US", options).format(num);
}

/**
 * Format a number with full precision and locale string formatting
 * @param {number} value - The value to format
 * @param {number} maxDecimals - Maximum decimal places
 * @param {number} minDecimals - Minimum decimal places
 * @returns {string} Formatted number string
 */
export function formatNumber(value, maxDecimals = 0, minDecimals = 0) {
  if (value == null || isNaN(value)) return "—";

  return value.toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
    minimumFractionDigits: minDecimals,
  });
}

/**
 * Format a value with automatic decimal precision based on magnitude
 * @param {number} value - The value to format
 * @param {number} digits - Base number of decimal places
 * @param {boolean} autodigits - Whether to auto-adjust decimal places
 * @param {boolean} same - Whether to show full number instead of abbreviated
 * @returns {string} Formatted value with span and title
 */
export function formatValue(
  value,
  digits = 2,
  autodigits = false,
  same = false,
  noLetter = false
) {
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
      minimumFractionDigits: minimumFractionDigits,
    });
  }

  if (same) {
    return `<span title="${vstring}">${vstring}</span>`;
  } else {
    return `<span title="${vstring}">${nFormatter(value, digits, noLetter)}</span>`;
  }
}

/**
 * Get automatic number of decimal places based on value magnitude
 * @param {number} value - The value to analyze
 * @param {number} digits - Base number of digits
 * @param {number} additionalDigits - Additional digits to add
 * @returns {number} Calculated decimal places
 */
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

/**
 * Check if a value is a float
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a float
 */
function isFloat(value) {
  return typeof value === "number" && !Number.isInteger(value) && !isNaN(value);
}

/**
 * Check if a number is larger than the maximum safe integer
 * @param {string|number} numberAsString - Number to check
 * @returns {boolean} True if larger than max safe integer
 */
function isLargerThanMaxSafeInteger(numberAsString) {
  let parsedNumber = BigInt(numberAsString);
  return parsedNumber > Number.MAX_SAFE_INTEGER;
}

/**
 * Format a BigInt number to locale string
 * @param {BigInt} bigIntNumber - BigInt to format
 * @returns {string} Formatted string with commas
 */
function formatBigIntToLocaleString(bigIntNumber) {
  // Convert BigInt to a string
  let bigIntAsString = bigIntNumber.toString();

  // Split the string into chunks of 3 digits (for formatting)
  let chunks = [];
  while (bigIntAsString.length > 0) {
    chunks.unshift(bigIntAsString.slice(-3));
    bigIntAsString = bigIntAsString.slice(0, -3);
  }

  // Join the chunks with the appropriate locale-specific separator
  let formattedString = chunks.join(",");

  return formattedString;
}

/**
 * Format percentage with appropriate styling
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage with styling
 */
export function formatPercentage(value, decimals = 2) {
  if (value == null || isNaN(value)) return "—";

  const formatted = value.toFixed(decimals);
  const className = value >= 0 ? "text-success" : "text-danger";
  const sign = value >= 0 ? "+" : "";

  return `<span class="${className}">${sign}${formatted}%</span>`;
}

/**
 * Format hash rate with appropriate units
 * @param {number} value - Hash rate value
 * @returns {string} Formatted hash rate string
 */
export function formatHashRate(value) {
  if (value == null || isNaN(value)) return "—";

  return (value / 1000000000000).toLocaleString("en-US") + " TH/s";
}

/**
 * Format file size in kilobytes
 * @param {number} size - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatKbSize(size) {
  if (size == null || isNaN(size)) return "—";

  return (
    (size / 1000).toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }) + " kB"
  );
}
