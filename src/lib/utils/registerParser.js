import { SConstant } from "@fleet-sdk/serializer";

/**
 * Convert hex string to bytes array
 */
function hexToBytes(hex) {
  if (!hex || typeof hex !== "string") return null;

  // Remove 0x prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (cleanHex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Parse a register value from hex string
 */
export function parseRegisterValue(hexValue, sigmaType) {
  if (!hexValue || typeof hexValue !== "string") {
    return { parsed: null, error: "Invalid hex value" };
  }

  try {
    const bytes = hexToBytes(hexValue);
    if (!bytes) {
      return { parsed: null, error: "Invalid hex format" };
    }

    // First try direct interpretation based on sigma type
    const directResult = interpretByteArrayWithType(bytes, sigmaType, hexValue);
    if (directResult !== null) {
      return {
        parsed: directResult,
        raw: directResult,
        rawHex: hexValue,
        typeInfo: `${sigmaType} (direct)`,
        error: null,
      };
    }

    // Try Fleet SDK parsing if direct interpretation fails
    try {
      const constant = SConstant.from(bytes);
      const value = constant.data;
      const typeString = constant.type.toString();
      let formatted = formatParsedValue(value, sigmaType, typeString);

      return {
        parsed: formatted,
        raw: value,
        rawHex: hexValue,
        typeInfo: typeString,
        error: null,
      };
    } catch (fleetError) {
      // Try fallback parsing for unsupported types
      const fallbackResult = tryFallbackParsing(hexValue, sigmaType);
      if (fallbackResult !== null) {
        return {
          parsed: fallbackResult,
          raw: fallbackResult,
          rawHex: hexValue,
          typeInfo: `${sigmaType} (fallback)`,
          error: null,
        };
      }

      throw fleetError; // Re-throw if fallback also fails
    }
  } catch (error) {
    return {
      parsed: null,
      error: `Parse error: ${error.message}`,
      rawHex: hexValue,
      debug: `Attempted to parse ${hexValue.length / 2} bytes: ${hexValue.substring(0, 20)}...`,
    };
  }
}

/**
 * Fallback parsing for types not supported by Fleet SDK
 */
function tryFallbackParsing(hexValue, sigmaType) {
  try {
    const bytes = hexToBytes(hexValue);
    if (!bytes) return null;

    // Skip the first byte (type code) and try to parse the data
    const dataBytes = bytes.slice(1);

    switch (sigmaType) {
      case "Coll[SByte]":
      case "SColl[SByte]":
        return parseBytesCollection(dataBytes);

      case "SColl[SLong]":
      case "Coll[SLong]":
        return parseLongCollection(dataBytes);

      default:
        // For unknown types, try to interpret as raw bytes
        return parseAsRawBytes(dataBytes);
    }
  } catch (error) {
    return null;
  }
}

/**
 * Parse as a collection of bytes
 */
function parseBytesCollection(bytes) {
  if (bytes.length === 0) return [];

  // First try to interpret the entire byte array as meaningful data
  const interpreted = interpretByteArray(new Uint8Array(bytes));
  if (
    interpreted !== null &&
    (typeof interpreted !== "object" || Array.isArray(interpreted))
  ) {
    return interpreted;
  }

  // Fall back to length-prefixed parsing
  const possibleLength = bytes[0];

  if (possibleLength <= bytes.length - 1) {
    // Treat first byte as length
    const dataBytes = bytes.slice(1, 1 + possibleLength);
    const interpreted = interpretByteArray(new Uint8Array(dataBytes));
    return interpreted !== null ? interpreted : Array.from(dataBytes);
  } else {
    // Treat all bytes as data
    const interpreted = interpretByteArray(new Uint8Array(bytes));
    return interpreted !== null ? interpreted : Array.from(bytes);
  }
}

/**
 * Parse as a collection of longs (8 bytes each)
 */
function parseLongCollection(bytes) {
  if (bytes.length === 0) return [];

  const longs = [];

  // Try to read VLQ length first
  let offset = 0;
  const length = readSimpleVLQ(bytes, offset);
  if (length.value > 0 && length.value < 1000) {
    // Reasonable limit
    offset = length.bytesRead;

    // Each long is encoded with VLQ encoding
    for (let i = 0; i < length.value && offset < bytes.length; i++) {
      const longValue = readZigZagLong(bytes, offset);
      if (longValue.bytesRead === 0) break;

      longs.push(longValue.value);
      offset += longValue.bytesRead;
    }

    if (longs.length > 0) return longs;
  }

  // Fallback: treat as raw 8-byte chunks
  for (let i = 0; i < bytes.length; i += 8) {
    if (i + 8 <= bytes.length) {
      const longBytes = bytes.slice(i, i + 8);
      const value = bytesToLong(longBytes);
      longs.push(value);
    }
  }

  return longs.length > 0 ? longs : Array.from(bytes);
}

/**
 * Simple VLQ reader
 */
function readSimpleVLQ(bytes, offset) {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;

  while (offset + bytesRead < bytes.length) {
    const byte = bytes[offset + bytesRead];
    bytesRead++;

    value |= (byte & 0x7f) << shift;
    shift += 7;

    if ((byte & 0x80) === 0) break;
    if (bytesRead > 5) break; // Prevent infinite loop
  }

  return { value, bytesRead };
}

/**
 * Read ZigZag encoded long
 */
function readZigZagLong(bytes, offset) {
  const vlq = readSimpleVLQ(bytes, offset);
  if (vlq.bytesRead === 0) return { value: 0, bytesRead: 0 };

  // ZigZag decode: (n >>> 1) ^ -(n & 1)
  const n = vlq.value;
  const decoded = (n >>> 1) ^ -(n & 1);

  return { value: decoded, bytesRead: vlq.bytesRead };
}

/**
 * Convert 8 bytes to long (little endian)
 */
function bytesToLong(bytes) {
  let result = 0;
  for (let i = 0; i < Math.min(bytes.length, 8); i++) {
    result += (bytes[i] & 0xff) * Math.pow(256, i);
  }

  // Handle sign bit for 64-bit values
  if (bytes.length === 8 && bytes[7] & 0x80) {
    result -= Math.pow(2, 64);
  }

  return result;
}

/**
 * Parse as raw bytes with intelligent formatting
 */
function parseAsRawBytes(bytes) {
  if (bytes.length === 0) return "empty";

  return interpretByteArray(new Uint8Array(bytes));
}

/**
 * Interpret byte arrays with type information
 */
function interpretByteArrayWithType(bytes, sigmaType, originalHex) {
  if (bytes.length === 0) return "empty";

  // Handle integer types - parse the hex string directly as integer
  if (
    sigmaType === "SInt" ||
    sigmaType === "SLong" ||
    sigmaType === "SByte" ||
    sigmaType === "SShort"
  ) {
    // For simple integer types, try parsing the hex as a direct integer
    const cleanHex = originalHex.startsWith("0x")
      ? originalHex.slice(2)
      : originalHex;
    const intValue = parseInt(cleanHex, 16);
    if (!isNaN(intValue)) {
      return intValue;
    }
  }

  // For non-integer types or if integer parsing fails, use generic interpretation
  return interpretByteArray(bytes);
}

/**
 * Intelligently interpret byte arrays as JSON, text, URLs, or hex
 */
function interpretByteArray(bytes) {
  if (bytes.length === 0) return "empty";

  // Handle single byte values
  if (bytes.length === 1) {
    const value = bytes[0];
    // Check if it's a printable ASCII character
    if (value >= 32 && value <= 126) {
      const char = String.fromCharCode(value);
      // For digit characters, return the character itself
      if (char >= "0" && char <= "9") {
        return char;
      }
      // For other printable characters, return the character
      return char;
    }
    // Return numeric value for non-printable bytes
    return value;
  }

  // Try to decode as UTF-8 string
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    // Check if it's a valid JSON object/array
    if (
      (text.startsWith("{") && text.endsWith("}")) ||
      (text.startsWith("[") && text.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(text);
        // Return the formatted JSON string, not the object itself
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If JSON parsing fails, treat as regular text
      }
    }

    // Check if it's a URL
    if (
      text.startsWith("http://") ||
      text.startsWith("https://") ||
      text.startsWith("ipfs://") ||
      text.startsWith("ftp://")
    ) {
      return text; // Return as URL string
    }

    // Check if it's printable text
    if (isPrintableString(text)) {
      return text; // Return as regular text
    }
  } catch {
    // Not valid UTF-8, continue to other interpretations
  }

  // If it's a short hash-like sequence (32 bytes or less), show as hex without quotes
  if (bytes.length <= 32 && bytes.length >= 16) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Show as hex if not too long
  if (bytes.length <= 64) {
    return `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  // Show truncated for long data
  const start = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const end = Array.from(bytes.slice(-8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${start}...${end} (${bytes.length} bytes)`;
}

/**
 * Format parsed value based on sigma type
 */
function formatParsedValue(value, sigmaType, constantTypeName) {
  if (value === null || value === undefined) {
    return "null";
  }

  // Handle different data types
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "boolean") {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return interpretByteArray(value);
  }

  if (Array.isArray(value)) {
    // Handle collections - limit display for very long arrays
    if (value.length > 10) {
      const first5 = value
        .slice(0, 5)
        .map((item) => formatParsedValue(item, null, null));
      const last5 = value
        .slice(-5)
        .map((item) => formatParsedValue(item, null, null));
      return `[${first5.join(", ")}, ... (${value.length - 10} more), ${last5.join(", ")}]`;
    }
    return `[${value.map((item) => formatParsedValue(item, null, null)).join(", ")}]`;
  }

  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value, (key, val) =>
        typeof val === "bigint" ? val.toString() : val,
      );
    } catch {
      return value.toString();
    }
  }

  return value.toString();
}

/**
 * Check if string contains only printable characters
 */
function isPrintableString(str) {
  // Allow printable ASCII characters (32-126) and some common whitespace
  return /^[\x20-\x7E\t\n\r]*$/.test(str) && str.trim().length > 0;
}

/**
 * Get a human-readable description of the sigma type
 */
export function getSigmaTypeDescription(sigmaType) {
  const typeMap = {
    SByte: "Signed byte (-128 to 127)",
    SShort: "Signed short (-32768 to 32767)",
    SInt: "Signed integer",
    SLong: "Signed long integer",
    SBigInt: "Big integer",
    SGroupElement: "Group element (elliptic curve point)",
    SSigmaProp: "Sigma proposition",
    SBox: "Box reference",
    SAvlTree: "AVL+ tree",
    SOption: "Optional value",
    SColl: "Collection/Array",
    STuple: "Tuple",
    SFunc: "Function",
    STypeVar: "Type variable",
    SString: "String",
    SBoolean: "Boolean (true/false)",
  };

  return typeMap[sigmaType] || sigmaType || "Unknown type";
}
