import { writable, derived, get } from "svelte/store";
import { API_ENDPOINTS } from "$lib/utils/constants.js";
import { socketService } from "./socketService.js";
import { getBox } from "$lib/utils/api.js";
import { formatAddress } from "$lib/utils/ergotreeUtils.js";

/**
 * Transaction monitoring service that handles both confirmed and unconfirmed transactions
 * with real-time updates via socket and API polling
 */
class TransactionService {
  constructor() {
    // Store for monitored transactions
    this.monitoredTransactions = writable(new Map());

    // Track polling intervals
    this.pollingIntervals = new Map();

    // Configuration
    this.POLLING_INTERVAL = 10000; // 10 seconds
    this.MAX_RETRIES = 180; // 30 minutes of monitoring (180 * 10s)
  }

  /**
   * Get or start monitoring a transaction
   * @param {string} txId - Transaction ID to monitor
   * @returns {Object} Reactive store with transaction data and status
   */
  monitorTransaction(txId) {
    console.log("monitorTransaction called with txId:", txId);

    if (!txId || txId.trim() === "") {
      console.warn("Invalid txId provided to monitorTransaction:", txId);
      return writable({
        txId: "",
        data: null,
        status: "error",
        source: null,
        lastUpdate: null,
        retryCount: 0,
        error: "Invalid transaction ID",
      });
    }

    const transactions = get(this.monitoredTransactions);

    if (transactions.has(txId)) {
      console.log("Returning existing monitor for txId:", txId);
      return transactions.get(txId).store;
    }

    console.log("Creating new monitor for txId:", txId);

    // Create new transaction store
    const transactionStore = writable({
      txId,
      data: null,
      status: "loading", // loading, unconfirmed, confirmed, dropped, error
      source: null, // 'socket', 'unconfirmed_api', 'confirmed_api'
      lastUpdate: null,
      retryCount: 0,
      error: null,
      previousStatus: null, // Track status changes
      dropReason: null, // Reason for drop if applicable
    });

    const monitoringData = {
      store: transactionStore,
      startTime: Date.now(),
      retryCount: 0,
    };

    // Add to monitored transactions
    transactions.set(txId, monitoringData);
    this.monitoredTransactions.set(transactions);

    // Start monitoring
    this._startMonitoring(txId);

    return transactionStore;
  }

  /**
   * Stop monitoring a transaction
   * @param {string} txId - Transaction ID to stop monitoring
   */
  stopMonitoring(txId) {
    // Clear polling interval
    if (this.pollingIntervals.has(txId)) {
      clearInterval(this.pollingIntervals.get(txId));
      this.pollingIntervals.delete(txId);
    }

    // Remove from monitored transactions
    const transactions = get(this.monitoredTransactions);
    transactions.delete(txId);
    this.monitoredTransactions.set(transactions);
  }

  /**
   * Manually trigger input box resolution for a transaction
   * @param {string} txId - Transaction ID to resolve inputs for
   */
  async resolveInputBoxes(txId) {
    const transactions = get(this.monitoredTransactions);
    const monitoringData = transactions.get(txId);

    if (monitoringData) {
      const currentData = get(monitoringData.store);
      if (currentData.data) {
        try {
          const resolvedTransaction = await this._resolveInputBoxData(
            currentData.data,
          );
          monitoringData.store.set({
            ...currentData,
            data: resolvedTransaction,
            lastUpdate: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Failed to manually resolve input boxes:", error);
        }
      }
    }
  }

  /**
   * Start monitoring a transaction using multiple data sources
   * @private
   */
  async _startMonitoring(txId) {
    console.log("Starting monitoring for txId:", txId);

    // Wait for socket to be ready with data before checking it
    const socketReady = await this._waitForSocketReady();
    console.log("Socket ready status:", socketReady);

    if (socketReady) {
      // Socket is ready with data, check it first
      const socketTransaction = this._getFromSocket(txId);
      console.log(
        "Socket check result:",
        socketTransaction ? "Found" : "Not found",
      );

      if (socketTransaction) {
        console.log("Using socket data immediately");
        console.log(
          "Socket transaction input count:",
          socketTransaction.inputs?.length || 0,
        );
        console.log(
          "Socket transaction inputs with assets:",
          socketTransaction.inputs?.filter((i) => i.assets?.length > 0)
            .length || 0,
        );

        // For socket transactions, we know we'll likely need to fetch input boxes
        // so start that process immediately in parallel with the UI update
        await this._updateTransaction(txId, {
          data: socketTransaction,
          status: "unconfirmed",
          source: "socket",
          lastUpdate: new Date().toISOString(),
        });
        this._startPolling(txId);
        return;
      }
    }

    // Socket not ready or doesn't have the transaction, try APIs
    console.log("Socket not ready or transaction not in socket, trying APIs");
    const [unconfirmedTx, confirmedTx] = await Promise.allSettled([
      this._fetchUnconfirmed(txId),
      this._fetchConfirmed(txId),
    ]);

    // Check confirmed first (most authoritative)
    if (confirmedTx.status === "fulfilled" && confirmedTx.value) {
      console.log("Found in confirmed API");
      await this._updateTransaction(txId, {
        data: confirmedTx.value,
        status: "confirmed",
        source: "confirmed_api",
        lastUpdate: new Date().toISOString(),
      });
      return; // No need to poll confirmed transactions
    }

    // Check unconfirmed
    if (unconfirmedTx.status === "fulfilled" && unconfirmedTx.value) {
      console.log("Found in unconfirmed API");
      console.log(
        "API transaction input count:",
        unconfirmedTx.value.inputs?.length || 0,
      );
      console.log(
        "API transaction inputs with assets:",
        unconfirmedTx.value.inputs?.filter((i) => i.assets?.length > 0)
          .length || 0,
      );

      await this._updateTransaction(txId, {
        data: unconfirmedTx.value,
        status: "unconfirmed",
        source: "unconfirmed_api",
        lastUpdate: new Date().toISOString(),
      });
      this._startPolling(txId);
      return;
    }

    // Not found anywhere - this is an error (invalid/non-existent transaction)
    console.log("Transaction not found in any source - invalid transaction ID");

    await this._updateTransaction(txId, {
      status: "error",
      error: "Transaction not found",
      lastUpdate: new Date().toISOString(),
    });
  }

  /**
   * Wait for socket to be connected and have mempool data
   * @private
   */
  async _waitForSocketReady(maxWaitMs = 2000) {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkReady = () => {
        // Check if we've exceeded max wait time
        if (Date.now() - startTime > maxWaitMs) {
          console.log("Socket wait timeout, proceeding with APIs");
          resolve(false);
          return;
        }

        let isConnected = false;
        let mempoolSize = 0;

        // Get current status
        socketService.getConnectionStatus().subscribe((status) => {
          isConnected = status;
        })();

        socketService.getMempoolTransactions().subscribe((transactions) => {
          mempoolSize = transactions.length;
        })();

        console.log(
          `Socket status: connected=${isConnected}, mempoolSize=${mempoolSize}`,
        );

        // Socket is ready if connected and has some mempool data
        if (isConnected && mempoolSize > 0) {
          console.log("Socket is ready with mempool data");
          resolve(true);
        } else {
          // Check again in 200ms
          setTimeout(checkReady, 200);
        }
      };

      checkReady();
    });
  }

  /**
   * Start polling for transaction status changes
   * @private
   */
  _startPolling(txId) {
    const intervalId = setInterval(async () => {
      const transactions = get(this.monitoredTransactions);
      const monitoringData = transactions.get(txId);

      if (!monitoringData) {
        clearInterval(intervalId);
        return;
      }

      const currentTx = get(monitoringData.store);

      // Stop polling if already confirmed or max retries reached
      if (
        currentTx.status === "confirmed" ||
        monitoringData.retryCount >= this.MAX_RETRIES
      ) {
        this.stopMonitoring(txId);
        return;
      }

      // Check for confirmation first
      const confirmedTx = await this._fetchConfirmed(txId);
      if (confirmedTx) {
        this._updateTransaction(txId, {
          data: confirmedTx,
          status: "confirmed",
          source: "confirmed_api",
          lastUpdate: new Date().toISOString(),
        });
        this.stopMonitoring(txId);
        return;
      }

      // Check if still in unconfirmed
      const socketTx = this._getFromSocket(txId);
      const unconfirmedTx = await this._fetchUnconfirmed(txId);

      if (socketTx || unconfirmedTx) {
        // Still unconfirmed, update data if needed
        const newData = socketTx || unconfirmedTx;
        const newSource = socketTx ? "socket" : "unconfirmed_api";

        console.log(`Polling found transaction in ${newSource}`);
        console.log("Polling data input count:", newData.inputs?.length || 0);
        console.log(
          "Polling data inputs with assets:",
          newData.inputs?.filter((i) => i.assets?.length > 0).length || 0,
        );

        // Reset retry count since we found the transaction
        monitoringData.retryCount = 0;

        await this._updateTransaction(txId, {
          data: newData,
          status: "unconfirmed",
          source: newSource,
          lastUpdate: new Date().toISOString(),
        });
      } else {
        // Not in socket or unconfirmed API, might be dropped
        monitoringData.retryCount++;
        console.log(
          `Transaction ${txId} not found in mempool, retry ${monitoringData.retryCount}/2`,
        );

        // Update retry count in store immediately for UI feedback
        await this._updateTransaction(txId, {
          retryCount: monitoringData.retryCount,
          lastUpdate: new Date().toISOString(),
        });

        if (monitoringData.retryCount >= 2) {
          // Wait 2 intervals (20 seconds) before marking as dropped
          console.log(`Transaction ${txId} appears to be dropped from mempool`);
          await this._updateTransaction(txId, {
            status: "dropped",
            error: "Transaction was dropped from mempool",
            dropReason:
              "Transaction not found in mempool after 3 consecutive checks",
            lastUpdate: new Date().toISOString(),
            previousStatus: currentTx.status,
          });
          this.stopMonitoring(txId);
        }
      }
    }, this.POLLING_INTERVAL);

    this.pollingIntervals.set(txId, intervalId);
  }

  /**
   * Get transaction from socket/mempool data
   * @private
   */
  _getFromSocket(txId) {
    // Use the socket service's optimized method
    return socketService.findTransaction(txId);
  }

  /**
   * Fetch transaction from unconfirmed API
   * @private
   */
  async _fetchUnconfirmed(txId) {
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
   * Fetch transaction from confirmed API
   * @private
   */
  async _fetchConfirmed(txId) {
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
    return null;
  }

  /**
   * Process transaction data to ensure all ergotrees are converted to addresses
   * @private
   */
  _processTransactionData(transaction) {
    if (!transaction) return transaction;

    console.log("Processing transaction data for address conversion");

    // Process inputs - convert ergotrees to addresses if needed
    const processedInputs =
      transaction.inputs?.map((input) => {
        const originalAddress = input.address;
        const hasErgoTree = input.ergoTree && !input.address;
        const convertedAddress = hasErgoTree
          ? formatAddress(input.ergoTree)
          : input.address;

        if (hasErgoTree) {
          console.log(
            "Converted input ergotree to address:",
            input.ergoTree.substring(0, 20) + "... → " + convertedAddress,
          );
        }

        return {
          ...input,
          address: convertedAddress || "",
        };
      }) || [];

    // Process outputs - convert ergotrees to addresses if needed
    const processedOutputs =
      transaction.outputs?.map((output) => {
        const originalAddress = output.address;
        const hasErgoTree = output.ergoTree && !output.address;
        const convertedAddress = hasErgoTree
          ? formatAddress(output.ergoTree)
          : output.address;

        if (hasErgoTree) {
          console.log(
            "Converted output ergotree to address:",
            output.ergoTree.substring(0, 20) + "... → " + convertedAddress,
          );
        }

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

    console.log("Address conversion completed");
    return processedTransaction;
  }

  /**
   * Resolve missing input box data for unconfirmed transactions
   * @private
   */
  async _resolveInputBoxData(transaction) {
    if (!transaction?.inputs) return transaction;

    console.log(
      "Starting input box resolution for",
      transaction.inputs.length,
      "inputs",
    );
    const startTime = Date.now();

    // Debug: Log input structure
    console.log("Input structure sample:", transaction.inputs[0]);
    console.log("Input keys:", Object.keys(transaction.inputs[0] || {}));

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

    console.log(
      `${inputsWithAssets.length} inputs already have assets, ${inputsNeedingResolution.length} need resolution`,
    );

    if (inputsNeedingResolution.length === 0) {
      return transaction; // No resolution needed
    }

    // Create a copy of inputs array to fill in resolved data
    const resolvedInputs = [...transaction.inputs];

    // For unconfirmed transactions, most inputs will be confirmed boxes from the API
    // Try socket first for potential chained transactions, but prioritize API calls
    console.log("Checking socket for chained transactions...");
    const socketBoxes = new Map();

    // Quick check for any chained transactions in socket
    inputsNeedingResolution.forEach(({ input, index }) => {
      const boxId = input.boxId || input.id;
      if (boxId) {
        const socketBox = this._findBoxInSocketTransactions(boxId);
        if (socketBox && socketBox.assets) {
          console.log(
            `Found input ${index} in socket with ${socketBox.assets.length} assets`,
          );
          socketBoxes.set(index, socketBox);
        }
      }
    });

    console.log(
      `Socket resolved ${socketBoxes.size} inputs from chained transactions`,
    );

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

    // Get remaining inputs that need API resolution
    const needingApiResolution = inputsNeedingResolution.filter(
      ({ index }) => !socketBoxes.has(index),
    );

    if (needingApiResolution.length === 0) {
      const elapsedTime = Date.now() - startTime;
      console.log(
        `Input box resolution completed in ${elapsedTime}ms (socket only)`,
      );
      return {
        ...transaction,
        inputs: resolvedInputs,
      };
    }

    // Fetch all remaining inputs from API in parallel with aggressive optimization
    console.log(
      `Fetching ${needingApiResolution.length} inputs from boxes API in parallel...`,
    );
    const apiPromises = needingApiResolution.map(async ({ input, index }) => {
      try {
        // Use boxId or id as fallback
        const boxId = input.boxId || input.id;
        if (!boxId) {
          console.warn(`Input ${index} has no valid boxId/id`);
          return { index, resolved: false };
        }

        console.log(`Fetching box ${boxId} for input ${index}`);
        const boxData = await getBox(boxId);
        if (boxData) {
          console.log(
            `API resolved input ${index} with ${boxData.assets?.length || 0} assets`,
          );
          resolvedInputs[index] = {
            ...input,
            boxId: boxId, // Ensure boxId is set
            assets: boxData.assets || [],
            address: boxData.address || input.address,
            value: boxData.value || input.value,
          };
          return { index, resolved: true };
        }
      } catch (error) {
        const boxId = input.boxId || input.id;
        console.warn(
          `Failed to fetch box ${boxId} for input ${index}:`,
          error.message,
        );
      }
      return { index, resolved: false };
    });

    await Promise.all(apiPromises);

    const elapsedTime = Date.now() - startTime;
    console.log(`Input box resolution completed in ${elapsedTime}ms`);

    return {
      ...transaction,
      inputs: resolvedInputs,
    };
  }

  /**
   * Find box data in socket mempool transactions (for chained transactions)
   * @private
   */
  _findBoxInSocketTransactions(boxId) {
    let foundBox = null;

    // Get current mempool transactions from socket
    socketService.getMempoolTransactions().subscribe((transactions) => {
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
   * Update transaction data in store
   * @private
   */
  async _updateTransaction(txId, updates) {
    const transactions = get(this.monitoredTransactions);
    const monitoringData = transactions.get(txId);

    if (monitoringData) {
      const currentData = get(monitoringData.store);

      // If we're updating with transaction data, process it
      let processedUpdates = updates;
      if (updates.data) {
        try {
          // First, convert any ergotrees to addresses
          let processedTransaction = this._processTransactionData(updates.data);

          // Then resolve input box data if it's unconfirmed
          if (
            updates.status === "unconfirmed" ||
            !updates.data.inclusionHeight ||
            updates.data.inclusionHeight === 0
          ) {
            console.log(
              "Resolving input box data for transaction from source:",
              updates.source,
            );

            // Check if inputs need resolution
            const inputsNeedingResolution =
              processedTransaction.inputs?.filter(
                (input) => !input.assets || input.assets.length === 0,
              ).length || 0;

            console.log(
              `Transaction has ${inputsNeedingResolution} inputs needing asset resolution`,
            );

            // For all sources with missing input data, show immediate update then resolve in background
            if (inputsNeedingResolution > 0) {
              console.log(
                `${updates.source} source with missing input assets - using background resolution`,
              );

              // Show immediate update without waiting for input resolution
              const immediateUpdates = {
                ...updates,
                data: processedTransaction,
              };

              monitoringData.store.set({
                ...currentData,
                ...immediateUpdates,
              });

              // Then resolve inputs in background and update again
              this._resolveInputBoxData(processedTransaction)
                .then((resolvedTransaction) => {
                  const currentStoreData = get(monitoringData.store);
                  monitoringData.store.set({
                    ...currentStoreData,
                    data: resolvedTransaction,
                    lastUpdate: new Date().toISOString(),
                  });
                  console.log("Background input box resolution completed");
                })
                .catch((error) => {
                  console.warn(
                    "Background input box resolution failed:",
                    error,
                  );
                });

              return; // Exit early, background resolution will update later
            } else {
              console.log("No input resolution needed");
            }
          }

          processedUpdates = {
            ...updates,
            data: processedTransaction,
          };
        } catch (error) {
          console.warn("Failed to process transaction data:", error);
          // Continue with original data if processing fails
        }
      }

      // Track status changes
      const newData = {
        ...currentData,
        ...processedUpdates,
      };

      // Set previousStatus if status is changing
      if (
        processedUpdates.status &&
        processedUpdates.status !== currentData.status
      ) {
        newData.previousStatus = currentData.status;
        console.log(
          `Transaction ${txId} status changed: ${currentData.status} → ${processedUpdates.status}`,
        );
      }

      // Update retry count if provided
      if (updates.retryCount !== undefined) {
        monitoringData.retryCount = updates.retryCount;
        newData.retryCount = updates.retryCount;
      }

      monitoringData.store.set(newData);
    }
  }

  /**
   * Cleanup all monitoring
   */
  cleanup() {
    // Clear all intervals
    for (const intervalId of this.pollingIntervals.values()) {
      clearInterval(intervalId);
    }
    this.pollingIntervals.clear();

    // Clear monitored transactions
    this.monitoredTransactions.set(new Map());
  }

  /**
   * Get all monitored transactions (for debugging)
   */
  getMonitoredTransactions() {
    return this.monitoredTransactions;
  }
}

// Create singleton instance
export const transactionService = new TransactionService();

// Cleanup on page unload (browser only)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    transactionService.cleanup();
  });
}
