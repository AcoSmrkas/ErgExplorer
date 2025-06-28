// Parse NFT type from R7 register serialized value
export function parseNftTypeFromR7(r7Value) {
  if (!r7Value || typeof r7Value !== "string") return null;

  const r7Lower = r7Value.toLowerCase();

  // EIP-0004 standard NFT type mappings
  if (r7Lower === "0e020101") return "image"; // [0x01, 0x01] - Image NFT
  if (r7Lower === "0e020102") return "audio"; // [0x01, 0x02] - Audio NFT
  if (r7Lower === "0e020103") return "video"; // [0x01, 0x03] - Video NFT
  if (r7Lower === "0e020104") return "artcollection"; // [0x01, 0x04] - Art Collection
  if (r7Lower === "0e02010f") return "file"; // [0x01, 0x0F] - File Attachment
  if (r7Lower === "0e020201") return "membership"; // [0x02, 0x01] - Membership token

  // Check if it starts with NFT pattern (0e0201)
  if (r7Lower.startsWith("0e0201")) return "nft";

  // Some tokens might have different encoding - let's try to decode hex values
  try {
    // Convert to hex if it's a decimal number
    if (/^\d+$/.test(r7Value)) {
      const hexValue = parseInt(r7Value).toString(16).padStart(8, "0");

      // Check common NFT patterns in different formats
      if (hexValue.includes("0101")) return "image";
      if (hexValue.includes("0102")) return "audio";
      if (hexValue.includes("0103")) return "video";
      if (hexValue.includes("0104")) return "artcollection";
    }
  } catch (err) {
    console.warn("Error parsing R7 value:", err);
  }

  return null;
}

// Get the actual token type considering R7 register data
export function getActualTokenType(token) {
  // First check if token is burned
  if (token.isBurned === "t") return "burned";

  // Try to get type from R7 register if detailed token data is available
  const r7Value = token.detail?.additionalRegisters?.R7?.serializedValue;
  if (r7Value) {
    const r7Type = parseNftTypeFromR7(r7Value);
    if (r7Type) return r7Type;
  }

  // Fallback to the original type field from search API
  if (token.type) return token.type;

  // Final fallback based on token characteristics
  return token.decimals === 0 && token.emissionAmount === "1" ? "nft" : "token";
}

export function getTokenTypeIcon(token) {
  const actualType = getActualTokenType(token);

  switch (actualType) {
    case "burned":
      return "fas fa-fire text-danger";
    case "image":
      return "fas fa-image text-warning";
    case "audio":
      return "fas fa-music text-warning";
    case "video":
      return "fas fa-video text-warning";
    case "artcollection":
      return "fas fa-palette text-warning";
    case "file":
      return "fas fa-file text-warning";
    case "membership":
      return "fas fa-id-card text-warning";
    case "nft":
      return "fas fa-gem text-warning";
    default:
      return "fas fa-coins text-info"; // regular token
  }
}

export function getTokenTypeLabel(token) {
  const actualType = getActualTokenType(token);

  switch (actualType) {
    case "burned":
      return "Burned";
    case "image":
      return "Image NFT";
    case "audio":
      return "Audio NFT";
    case "video":
      return "Video NFT";
    case "artcollection":
      return "Art Collection";
    case "file":
      return "File NFT";
    case "membership":
      return "Membership";
    case "nft":
      return "NFT";
    default:
      return "Token";
  }
}

export function formatDescription(description) {
  if (!description) return "";
  return description.length > 100
    ? description.substring(0, 100) + "..."
    : description;
}
