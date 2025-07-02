import {
  parseRegisterValue,
  getSigmaTypeDescription,
} from "./registerParser.js";

/**
 * Process register entries from a box's additionalRegisters object
 * @param {Object} additionalRegisters - The additionalRegisters object from a box
 * @returns {Array} Array of processed register objects
 */
export function processRegisters(additionalRegisters) {
  if (!additionalRegisters || typeof additionalRegisters !== "object") {
    return [];
  }

  return Object.entries(additionalRegisters)
    .filter(
      ([key, value]) =>
        key !== "R0" && key !== "R1" && key !== "R2" && key !== "R3",
    )
    .sort(([a], [b]) => {
      // Sort registers R4, R5, R6, R7, R8, R9, etc.
      const numA = parseInt(a.slice(1));
      const numB = parseInt(b.slice(1));
      return numA - numB;
    })
    .map(([key, registerObj]) => processRegister(key, registerObj));
}

/**
 * Process a single register entry
 * @param {string} key - Register key (e.g., 'R4', 'R5')
 * @param {Object|any} registerObj - Register object or value
 * @returns {Object} Processed register object
 */
export function processRegister(key, registerObj) {
  // Handle register object structure
  if (typeof registerObj === "object" && registerObj !== null) {
    const renderedValue = registerObj.renderedValue;
    const rawValue = registerObj.value;
    const sigmaType = registerObj.sigmaType || "Unknown";

    // Use the primary value for processing
    const primaryValue = renderedValue || rawValue || "N/A";

    // Determine if we should parse the value
    let parsedResult = null;

    if (
      sigmaType.includes("Coll[SByte]") &&
      typeof primaryValue === "string" &&
      primaryValue !== "N/A"
    ) {
      // Parse Coll[SByte] types - renderedValue is still hex for these
      parsedResult = parseRegisterValue(primaryValue, sigmaType);
    } else if (renderedValue && rawValue && renderedValue !== rawValue) {
      // For simple types (SInt, SLong, etc), use rendered as parsed
      parsedResult = {
        parsed: renderedValue,
        error: null,
        typeInfo: sigmaType,
      };
    }

    return {
      key,
      value: rawValue || primaryValue, // Prefer raw value for display
      type: sigmaType,
      parsed: parsedResult?.parsed || null,
      parseError: parsedResult?.error || null,
      typeDescription: getSigmaTypeDescription(sigmaType),
      actualType: parsedResult?.typeInfo || sigmaType,
      serializedValue: registerObj.serializedValue || null,
    };
  }

  // Fallback for simple values
  return {
    key,
    value: registerObj,
    type: "Raw",
    parsed: null,
    parseError: null,
    typeDescription: "Raw value",
    actualType: "Raw",
    serializedValue: null,
  };
}

/**
 * Check if registers should be shown
 * @param {Array} registers - Array of processed registers
 * @returns {boolean} True if registers should be displayed
 */
export function shouldShowRegisters(registers) {
  return Array.isArray(registers) && registers.length > 0;
}
