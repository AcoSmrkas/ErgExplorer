import { getBox } from "$lib/utils/api.js";
import { formatAddress } from "$lib/utils/ergotreeUtils.js";

/**
 * Service for resolving box data and assets for transactions
 * Handles both confirmed and unconfirmed transactions with socket/API fallback
 */
class BoxResolutionService {
  constructor() {
    this.socketService = null; // Will be injected to avoid circular dependency
  }

  /**
   * Set socket service reference (to avoid circular dependency)
   * @param {Object} socketService - Socket service instance
   */
  setSocketService(socketService) {
    this.socketService = socketService;
  }

  /**
   * Process transaction data to ensure all ergotrees are converted to addresses
   * @param {Object} transaction - Transaction object
   * @returns {Object} Processed transaction with addresses
   */
  processTransactionData(transaction) {
    if (!transaction) return transaction;

    // Process inputs - convert ergotrees to addresses if needed
    const processedInputs =
      transaction.inputs?.map((input) => {
        const hasErgoTree = input.ergoTree && !input.address;
        const convertedAddress = hasErgoTree
          ? formatAddress(input.ergoTree)
          : input.address;

        return {
          ...input,
          address: convertedAddress || "",
        };
      }) || [];

    // Process outputs - convert ergotrees to addresses if needed
    const processedOutputs =
      transaction.outputs?.map((output) => {
        const hasErgoTree = output.ergoTree && !output.address;
        const convertedAddress = hasErgoTree
          ? formatAddress(output.ergoTree)
          : output.address;

        return {
          ...output,
          address: convertedAddress || "",
        };
      }) || [];

    const processedTransaction = {
      ...transaction,
      inputs: processedInputs,
      outputs: processedOutputs,
    };

    return processedTransaction;
  }

  /**
   * Resolve missing input box data for transactions
   * @param {Object} transaction - Transaction object
   * @param {Object} options - Resolution options
   * @returns {Promise<Object>} Transaction with resolved input box data
   */
  async resolveInputBoxData(transaction, options = {}) {
    if (!transaction?.inputs) return transaction;

    const { prioritizeSocket = false, maxConcurrency = 10 } = options;
    const startTime = Date.now();

    // Separate inputs that need resolution vs those that don't
    const inputsNeedingResolution = [];
    const inputsWithAssets = [];

    transaction.inputs.forEach((input, index) => {
      // Check if input has valid boxId
      if (!input.boxId && !input.id) {
        console.warn(`Input ${index} missing boxId/id:`, input);
        return;
      }

      if (input.assets && input.assets.length > 0) {
        inputsWithAssets.push({ input, index });
      } else {
        inputsNeedingResolution.push({ input, index });
      }
    });

    if (inputsNeedingResolution.length === 0) {
      return transaction; // No resolution needed
    }

    // Create a copy of inputs array to fill in resolved data
    const resolvedInputs = [...transaction.inputs];

    // Try socket first for potential chained transactions
    const socketBoxes = new Map();
    if (this.socketService && prioritizeSocket) {
      inputsNeedingResolution.forEach(({ input, index }) => {
        const boxId = input.boxId || input.id;
        if (boxId) {
          const socketBox = this._findBoxInSocketTransactions(boxId);
          if (socketBox && socketBox.assets) {
            socketBoxes.set(index, socketBox);
          }
        }
      });

      // Apply socket resolutions
      socketBoxes.forEach((socketBox, index) => {
        const input = transaction.inputs[index];
        resolvedInputs[index] = {
          ...input,
          assets: socketBox.assets || [],
          address: socketBox.address || input.address,
          value: socketBox.value || input.value,
        };
      });
    }

    // Get remaining inputs that need API resolution
    const needingApiResolution = inputsNeedingResolution.filter(
      ({ index }) => !socketBoxes.has(index),
    );

    if (needingApiResolution.length === 0) {
      const elapsedTime = Date.now() - startTime;
      return {
        ...transaction,
        inputs: resolvedInputs,
      };
    }

    await this._resolveInputsInBatches(
      needingApiResolution,
      resolvedInputs,
      maxConcurrency,
    );

    const elapsedTime = Date.now() - startTime;

    return {
      ...transaction,
      inputs: resolvedInputs,
    };
  }

  /**
   * Resolve inputs in batches to control API load
   * @private
   */
  async _resolveInputsInBatches(
    needingApiResolution,
    resolvedInputs,
    maxConcurrency,
  ) {
    for (let i = 0; i < needingApiResolution.length; i += maxConcurrency) {
      const batch = needingApiResolution.slice(i, i + maxConcurrency);
      const batchPromises = batch.map(async ({ input, index }) => {
        try {
          const boxId = input.boxId || input.id;
          if (!boxId) {
            return { index, resolved: false };
          }

          const boxData = await getBox(boxId);
          if (boxData) {
            resolvedInputs[index] = {
              ...input,
              boxId: boxId,
              assets: boxData.assets || [],
              address: boxData.address || input.address,
              value: boxData.value || input.value,
            };
            return { index, resolved: true };
          }
        } catch (error) {
          const boxId = input.boxId || input.id;
        }
        return { index, resolved: false };
      });

      await Promise.all(batchPromises);
    }
  }

  /**
   * Find box data in socket mempool transactions (for chained transactions)
   * @private
   */
  _findBoxInSocketTransactions(boxId) {
    if (!this.socketService) return null;

    let foundBox = null;

    // Get current mempool transactions from socket
    this.socketService.getMempoolTransactions().subscribe((transactions) => {
      for (const tx of transactions) {
        // Check if this box is an output of another mempool transaction
        const outputBox = tx.outputs?.find((output) => output.boxId === boxId);
        if (outputBox) {
          foundBox = outputBox;
          break;
        }
      }
    })();

    return foundBox;
  }

  /**
   * Extract assets that actually moved between different addresses
   * @param {Object} transaction - Transaction object
   * @returns {Array} Array of assets that moved between addresses
   */
  extractMovedAssets(transaction) {
    if (!transaction) return [];

    // Sum all assets by address for inputs
    const inputAssetsByAddress = new Map();
    transaction.inputs?.forEach((input) => {
      if (input.address && input.assets) {
        if (!inputAssetsByAddress.has(input.address)) {
          inputAssetsByAddress.set(input.address, new Map());
        }
        const addressAssets = inputAssetsByAddress.get(input.address);

        input.assets.forEach((asset) => {
          const currentAmount = BigInt(addressAssets.get(asset.tokenId) || 0);
          addressAssets.set(
            asset.tokenId,
            currentAmount + BigInt(asset.amount || 0),
          );
        });
      }
    });

    // Sum all assets by address for outputs
    const outputAssetsByAddress = new Map();
    transaction.outputs?.forEach((output) => {
      if (output.address && output.assets) {
        if (!outputAssetsByAddress.has(output.address)) {
          outputAssetsByAddress.set(output.address, new Map());
        }
        const addressAssets = outputAssetsByAddress.get(output.address);

        output.assets.forEach((asset) => {
          const currentAmount = BigInt(addressAssets.get(asset.tokenId) || 0);
          addressAssets.set(
            asset.tokenId,
            currentAmount + BigInt(asset.amount || 0),
          );
        });
      }
    });

    // Get all unique token IDs and addresses
    const allTokenIds = new Set();
    const allAddresses = new Set();

    for (const [address, assets] of inputAssetsByAddress) {
      allAddresses.add(address);
      for (const tokenId of assets.keys()) {
        allTokenIds.add(tokenId);
      }
    }
    for (const [address, assets] of outputAssetsByAddress) {
      allAddresses.add(address);
      for (const tokenId of assets.keys()) {
        allTokenIds.add(tokenId);
      }
    }

    // For each token, check if it actually moved between addresses
    const movedAssets = new Set();

    for (const tokenId of allTokenIds) {
      let totalMoved = false;

      // Check each address to see if their balance changed for this token
      for (const address of allAddresses) {
        const inputAmount =
          inputAssetsByAddress.get(address)?.get(tokenId) || BigInt(0);
        const outputAmount =
          outputAssetsByAddress.get(address)?.get(tokenId) || BigInt(0);

        // If any address has a different amount, this token moved
        if (inputAmount !== outputAmount) {
          totalMoved = true;
          break;
        }
      }

      if (totalMoved) {
        // Find the asset details from inputs or outputs
        let assetDetails = null;
        for (const input of transaction.inputs || []) {
          const found = input.assets?.find((a) => a.tokenId === tokenId);
          if (found) {
            assetDetails = found;
            break;
          }
        }
        if (!assetDetails) {
          for (const output of transaction.outputs || []) {
            const found = output.assets?.find((a) => a.tokenId === tokenId);
            if (found) {
              assetDetails = found;
              break;
            }
          }
        }

        if (assetDetails) {
          movedAssets.add(assetDetails);
        }
      }
    }

    return Array.from(movedAssets);
  }

  /**
   * Extract all assets from a transaction (inputs + outputs) - legacy method
   * @param {Object} transaction - Transaction object
   * @returns {Array} Array of unique assets
   */
  extractTransactionAssets(transaction) {
    // Use the moved assets method for better accuracy
    return this.extractMovedAssets(transaction);
  }

  /**
   * Get asset summary for multiple transactions (for mempool overview)
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Asset summary with counts
   */
  getAssetSummary(transactions) {
    const assetCounts = new Map();
    let totalTransactionsWithAssets = 0;

    transactions.forEach((transaction) => {
      const assets = this.extractTransactionAssets(transaction);

      if (assets.length > 0) {
        totalTransactionsWithAssets++;
      }

      assets.forEach((asset) => {
        const tokenId = asset.tokenId;

        // Count occurrences
        if (!assetCounts.has(tokenId)) {
          assetCounts.set(tokenId, {
            ...asset,
            transactionCount: 0,
          });
        }

        const summary = assetCounts.get(tokenId);
        summary.transactionCount++;
      });
    });

    return {
      totalUniqueAssets: assetCounts.size,
      totalTransactionsWithAssets,
      assetCounts: Array.from(assetCounts.values()),
    };
  }
}

// Create singleton instance
export const boxResolutionService = new BoxResolutionService();
