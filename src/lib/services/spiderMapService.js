import { API_ENDPOINTS } from "$lib/utils/constants.js";

/**
 * Service for spider map functionality
 * Provides simple transaction fetching for visualization
 */
class SpiderMapService {
  /**
   * Get transaction details for spider map visualization
   * @param {string} txId - Transaction ID
   * @returns {Promise<Object|null>} Transaction data or null
   */
  async getTransactionDetails(txId) {
    if (!txId) return null;

    // Try confirmed API first (most complete data)
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ERGOPLATFORM}transactions/${txId}`,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Failed to fetch confirmed transaction:", error);
    }

    // Try unconfirmed API as fallback
    try {
      const response = await fetch(
        `${API_ENDPOINTS.ERGOPLATFORM_BASE}transactions/unconfirmed/${txId}`,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Failed to fetch unconfirmed transaction:", error);
    }

    return null;
  }

  /**
   * Get multiple transactions in parallel
   * @param {string[]} txIds - Array of transaction IDs
   * @returns {Promise<Object[]>} Array of transaction data
   */
  async getMultipleTransactions(txIds) {
    const promises = txIds.map((txId) => this.getTransactionDetails(txId));
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result) => result.status === "fulfilled" && result.value !== null,
      )
      .map((result) => result.value);
  }

  /**
   * Extract related transaction IDs from a transaction
   * @param {Object} transaction - Transaction object
   * @returns {Object} Related transaction IDs
   */
  extractRelatedTransactions(transaction) {
    if (!transaction) return { inputs: [], outputs: [] };

    const inputTxIds = new Set();
    const outputTxIds = new Set(); // For future: spending transactions

    // Extract input transaction IDs
    if (transaction.inputs) {
      transaction.inputs.forEach((input) => {
        if (
          input.outputTransactionId &&
          input.outputTransactionId !== transaction.id
        ) {
          inputTxIds.add(input.outputTransactionId);
        }
      });
    }

    return {
      inputs: Array.from(inputTxIds),
      outputs: Array.from(outputTxIds),
    };
  }

  /**
   * Check if a box is spent by looking for transactions that use it as input
   * @param {string} boxId - Box ID to check
   * @returns {Promise<Object|null>} Spending transaction or null if unspent
   */
  async checkBoxSpentStatus(boxId) {
    if (!boxId) return null;

    // Try to find a transaction that spends this box
    // This would require searching through transactions or using a specific API endpoint
    // For now, we'll return null (unspent) as we don't have a direct API for this

    // TODO: Implement proper box spending lookup when API supports it
    // This could involve:
    // 1. Searching recent transactions for inputs matching this boxId
    // 2. Using a dedicated "box spending" API endpoint if available
    // 3. Caching spent status to avoid repeated checks

    return null;
  }

  /**
   * Format transaction data for visualization
   * @param {Object} transaction - Raw transaction data
   * @returns {Object} Formatted transaction data
   */
  formatTransactionForVisualization(transaction) {
    if (!transaction) return null;

    return {
      id: transaction.id,
      blockId: transaction.blockId,
      inclusionHeight: transaction.inclusionHeight,
      timestamp: transaction.timestamp,
      size: transaction.size,
      inputs:
        transaction.inputs?.map((input) => ({
          boxId: input.boxId,
          outputTransactionId: input.outputTransactionId,
          value: input.value,
          assets: input.assets || [],
          address: input.address,
          spendingProof: input.spendingProof,
        })) || [],
      outputs:
        transaction.outputs?.map((output, index) => ({
          boxId: output.boxId,
          value: output.value,
          assets: output.assets || [],
          address: output.address,
          ergoTree: output.ergoTree,
          additionalRegisters: output.additionalRegisters || {},
          index,
          isSpent: false, // Will be updated when we can check spending status
        })) || [],
    };
  }
}

// Export singleton instance
export const spiderMapService = new SpiderMapService();

// Convenience function for components
export async function getTransactionDetails(txId) {
  return await spiderMapService.getTransactionDetails(txId);
}
