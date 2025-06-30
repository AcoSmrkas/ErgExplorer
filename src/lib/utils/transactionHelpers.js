import { FEE_ERGOTREE } from "./constants.js";
import { formatFileSize } from "./formatting.js";

/**
 * Calculate the fee amount from a transaction
 * @param {Object} tx - Transaction object
 * @returns {number} Fee amount in nanoERG
 */
export function calculateFee(tx) {
  if (!tx?.outputs) return 0;
  const feeOutput = tx.outputs.find(
    (output) => output.ergoTree === FEE_ERGOTREE,
  );
  return feeOutput ? parseInt(feeOutput.value) : 0;
}

/**
 * Calculate burned assets from a transaction
 * @param {Object} tx - Transaction object
 * @returns {Array} Array of burned assets
 */
export function calculateBurnedAssets(tx) {
  if (!tx) return [];
  // Implementation would track assets in inputs vs outputs to find burned assets
  // For now, return empty array - can be enhanced later
  return [];
}

/**
 * Get box status based on spending state
 * @param {Object} box - Box object
 * @returns {string} Box status
 */
export function getBoxStatus(box) {
  if (!box) return "Unknown";
  if (box.spentTransactionId) return "Spent";
  if (box.mainChain === false) return "Unconfirmed";
  return "Unspent";
}

/**
 * Get status type for badge styling
 * @param {Object} box - Box object
 * @returns {string} Status type for styling
 */
export function getStatusType(box) {
  const status = getBoxStatus(box);
  switch (status) {
    case "Spent":
      return "danger";
    case "Unconfirmed":
      return "warning";
    case "Unspent":
      return "success";
    default:
      return "default";
  }
}

/**
 * Generate info text for page header
 * @param {Object} transaction - Transaction object
 * @param {boolean} isConfirmed - Whether transaction is confirmed
 * @returns {string} Formatted info text
 */
export function getInfoText(transaction, isConfirmed) {
  if (!transaction) return "";
  const status = isConfirmed ? "Confirmed" : "Pending";
  const inputs = transaction.inputs?.length || 0;
  const outputs = transaction.outputs?.length || 0;
  return `${status} • ${inputs} inputs → ${outputs} outputs • ${formatFileSize(transaction.size || 0)}`;
}

/**
 * Calculate total input value
 * @param {Object} transaction - Transaction object
 * @returns {number} Total input value in nanoERG
 */
export function calculateTotalInputValue(transaction) {
  return (
    transaction?.inputs?.reduce(
      (sum, input) => sum + (parseInt(input.value) || 0),
      0,
    ) || 0
  );
}

/**
 * Calculate total output value
 * @param {Object} transaction - Transaction object
 * @returns {number} Total output value in nanoERG
 */
export function calculateTotalOutputValue(transaction) {
  return (
    transaction?.outputs?.reduce(
      (sum, output) => sum + (parseInt(output.value) || 0),
      0,
    ) || 0
  );
}
