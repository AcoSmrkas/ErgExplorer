import { writable, derived, get } from "svelte/store";
import { API_ENDPOINTS } from "$lib/utils/constants.js";
import { socketService } from "./socketService.js";
import { boxResolutionService } from "./boxResolutionService.js";

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

    // Set up box resolution service with socket reference
    boxResolutionService.setSocketService(socketService);

    // Set up real-time socket monitoring for mempool updates
    this._setupMempoolMonitoring();
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

    // For transaction pages, we want to prioritize socket data but not wait too long
    // Check socket immediately if connected, otherwise fall back to API quickly
    const isSocketConnected = await this._isSocketConnected();
    
    if (isSocketConnected) {
      const socketTransaction = this._getFromSocket(txId);
      if (socketTransaction) {
        console.log("Found transaction in socket immediately - using with priority resolution");
        
        // Update UI immediately with socket data
        const processedTransaction = this._processTransactionData(socketTransaction);
        const monitoringData = this._getMonitoringData(txId);
        
        if (monitoringData) {
          monitoringData.store.set({
            txId,
            data: processedTransaction,
            status: "unconfirmed",
            source: "socket",
            lastUpdate: new Date().toISOString(),
            retryCount: 0,
            error: null,
          });
        }

        // Start immediate priority box resolution in parallel (don't wait)
        this._priorityResolveInputBoxes(txId, processedTransaction);
        this._startPolling(txId);
        return;
      }
    }

    // Wait briefly for socket to get data, but with shorter timeout for transaction pages
    const socketReady = await this._waitForSocketReady(1000); // Reduced from 2000ms
    console.log("Socket ready status:", socketReady);

    if (socketReady) {
      const socketTransaction = this._getFromSocket(txId);
      if (socketTransaction) {
        console.log("Found transaction in socket after brief wait - using with priority resolution");
        
        // Update UI immediately with socket data
        const processedTransaction = this._processTransactionData(socketTransaction);
        const monitoringData = this._getMonitoringData(txId);
        
        if (monitoringData) {
          monitoringData.store.set({
            txId,
            data: processedTransaction,
            status: "unconfirmed",
            source: "socket",
            lastUpdate: new Date().toISOString(),
            retryCount: 0,
            error: null,
          });
        }

        // Start immediate priority box resolution
        this._priorityResolveInputBoxes(txId, processedTransaction);
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
      await this._updateTransaction(txId, {
        data: unconfirmedTx.value,
        status: "unconfirmed",
        source: "API",
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
   * Check if socket is currently connected (synchronous)
   * @private
   */
  async _isSocketConnected() {
    if (!socketService) return false;
    
    let isConnected = false;
    socketService.getConnectionStatus().subscribe((status) => {
      isConnected = status;
    })();
    
    return isConnected;
  }

  /**
   * Get monitoring data for a transaction
   * @private
   */
  _getMonitoringData(txId) {
    const transactions = get(this.monitoredTransactions);
    return transactions.get(txId);
  }

  /**
   * Set up real-time mempool monitoring for watched transactions
   * @private
   */
  _setupMempoolMonitoring() {
    if (!socketService) return;

    // Subscribe to mempool updates and check for monitored transactions
    socketService.getMempoolTransactions().subscribe((mempoolTransactions) => {
      const transactions = get(this.monitoredTransactions);
      
      // Check each monitored transaction
      for (const [txId, monitoringData] of transactions) {
        const currentData = get(monitoringData.store);
        
        // Only check transactions that are still loading or need updates
        if (currentData.status === 'loading' || currentData.source === null) {
          const socketTransaction = mempoolTransactions.find(tx => tx.id === txId);
          
          if (socketTransaction) {
            console.log(`Real-time: Found monitored transaction ${txId} in mempool`);
            
            // Update immediately with socket data
            const processedTransaction = this._processTransactionData(socketTransaction);
            monitoringData.store.set({
              ...currentData,
              data: processedTransaction,
              status: "unconfirmed",
              source: "socket_realtime",
              lastUpdate: new Date().toISOString(),
              retryCount: 0,
              error: null,
            });

            // Start priority box resolution
            this._priorityResolveInputBoxes(txId, processedTransaction);
            
            // Start polling if not already started
            if (!this.pollingIntervals.has(txId)) {
              this._startPolling(txId);
            }
          }
        }
        
        // Also check for transactions that might have disappeared from mempool
        else if (currentData.status === 'unconfirmed' && currentData.source === 'socket') {
          const socketTransaction = mempoolTransactions.find(tx => tx.id === txId);
          
          if (!socketTransaction) {
            console.log(`Real-time: Transaction ${txId} disappeared from mempool`);
            // Don't immediately mark as dropped - let polling handle confirmation check
          }
        }
      }
    });
  }

  /**
   * Priority box resolution for socket transactions - immediate and aggressive
   * @private
   */
  async _priorityResolveInputBoxes(txId, transaction) {
    console.log("Starting priority box resolution for transaction:", txId);
    
    try {
      // Use aggressive resolution settings for transaction pages
      const resolvedTransaction = await this._resolveInputBoxData(transaction, {
        prioritizeSocket: true,
        maxConcurrency: 20, // Higher concurrency for faster resolution
      });
      
      const monitoringData = this._getMonitoringData(txId);
      if (monitoringData) {
        const currentData = get(monitoringData.store);
        monitoringData.store.set({
          ...currentData,
          data: resolvedTransaction,
          lastUpdate: new Date().toISOString(),
        });
        console.log("Priority box resolution completed for transaction:", txId);
      }
    } catch (error) {
      console.warn("Priority box resolution failed for transaction:", txId, error);
    }
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
    console.log(`Starting polling for transaction: ${txId}`);
    const intervalId = setInterval(async () => {
      const transactions = get(this.monitoredTransactions);
      const monitoringData = transactions.get(txId);

      if (!monitoringData) {
        console.log(`Polling stopped for ${txId}: monitoring data not found`);
        clearInterval(intervalId);
        return;
      }

      const currentTx = get(monitoringData.store);
      console.log(`Polling ${txId}: current status=${currentTx.status}, retryCount=${monitoringData.retryCount}`);

      // Stop polling if already confirmed or max retries reached
      if (
        currentTx.status === "confirmed" ||
        monitoringData.retryCount >= this.MAX_RETRIES
      ) {
        console.log(`Stopping polling for ${txId}: status=${currentTx.status}, retryCount=${monitoringData.retryCount}`);
        this.stopMonitoring(txId);
        return;
      }

      // Check for confirmation first
      console.log(`Polling ${txId}: checking for confirmation...`);
      const confirmedTx = await this._fetchConfirmed(txId);
      if (confirmedTx) {
        console.log(`Polling ${txId}: CONFIRMED! Updating status...`);
        await this._updateTransaction(txId, {
          data: confirmedTx,
          status: "confirmed",
          source: "confirmed_api",
          lastUpdate: new Date().toISOString(),
        });
        console.log(`Polling ${txId}: stopping monitoring after confirmation`);
        this.stopMonitoring(txId);
        return;
      } else {
        console.log(`Polling ${txId}: still not confirmed`);
      }

      // Check if still in unconfirmed
      const socketTx = this._getFromSocket(txId);
      const unconfirmedTx = await this._fetchUnconfirmed(txId);

      if (socketTx || unconfirmedTx) {
        // Still unconfirmed, update data if needed
        const newData = socketTx || unconfirmedTx;
        const newSource = socketTx ? "socket" : "API";

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
        // Not in socket or unconfirmed API - could be confirmed or dropped
        console.log(`Transaction ${txId} disappeared from mempool - checking if confirmed before marking as dropped`);
        
        // When transaction disappears from mempool, check confirmation again with retry
        // Sometimes there's a delay between confirmation and API availability
        const confirmedTxRetry = await this._fetchConfirmed(txId, 2); // 2 attempts with backoff
        if (confirmedTxRetry) {
          console.log(`Transaction ${txId} was actually CONFIRMED (found on retry check)`);
          await this._updateTransaction(txId, {
            data: confirmedTxRetry,
            status: "confirmed",
            source: "confirmed_api",
            lastUpdate: new Date().toISOString(),
          });
          this.stopMonitoring(txId);
          return;
        }
        
        // Still not confirmed, increment retry count
        monitoringData.retryCount++;
        console.log(
          `Transaction ${txId} not found in mempool or confirmed, retry ${monitoringData.retryCount}/2`,
        );

        // Update retry count in store immediately for UI feedback
        await this._updateTransaction(txId, {
          retryCount: monitoringData.retryCount,
          lastUpdate: new Date().toISOString(),
        });

        if (monitoringData.retryCount >= 2) {
          // Final check for confirmation before marking as dropped
          console.log(`Transaction ${txId} final confirmation check before marking as dropped`);
          const finalConfirmedCheck = await this._fetchConfirmed(txId, 3); // 3 attempts with backoff
          if (finalConfirmedCheck) {
            console.log(`Transaction ${txId} was CONFIRMED on final check!`);
            await this._updateTransaction(txId, {
              data: finalConfirmedCheck,
              status: "confirmed",
              source: "confirmed_api",
              lastUpdate: new Date().toISOString(),
            });
            this.stopMonitoring(txId);
            return;
          }
          
          // Definitely dropped now
          console.log(`Transaction ${txId} appears to be dropped from mempool after final checks`);
          await this._updateTransaction(txId, {
            status: "dropped",
            error: "Transaction was dropped from mempool",
            dropReason:
              "Transaction not found in mempool or confirmed API after multiple checks",
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
   * Fetch transaction from confirmed API with retry logic
   * @private
   */
  async _fetchConfirmed(txId, retries = 1) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.ERGOPLATFORM}transactions/${txId}`,
        );
        if (response.ok) {
          const data = await response.json();
          console.log(`Found confirmed transaction ${txId} on attempt ${attempt + 1}`);
          return data;
        } else if (response.status === 404) {
          console.log(`Confirmed API returned 404 for ${txId} on attempt ${attempt + 1}`);
        } else {
          console.warn(`Confirmed API returned ${response.status} for ${txId} on attempt ${attempt + 1}`);
        }
      } catch (error) {
        console.warn(`Failed to fetch confirmed transaction ${txId} on attempt ${attempt + 1}:`, error);
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 1s, 2s, 4s, max 5s
        console.log(`Waiting ${delay}ms before retry ${attempt + 2} for ${txId}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return null;
  }

  /**
   * Process transaction data to ensure all ergotrees are converted to addresses
   * @private
   */
  _processTransactionData(transaction) {
    return boxResolutionService.processTransactionData(transaction);
  }

  /**
   * Resolve missing input box data for unconfirmed transactions
   * @private
   */
  async _resolveInputBoxData(transaction) {
    return await boxResolutionService.resolveInputBoxData(transaction, {
      prioritizeSocket: true,
      maxConcurrency: 10,
    });
  }

  /**
   * Find box data in socket mempool transactions (for chained transactions)
   * @private
   */
  _findBoxInSocketTransactions(boxId) {
    return boxResolutionService._findBoxInSocketTransactions(boxId);
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

          // Only resolve input box data for unconfirmed transactions
          // Confirmed transactions should already have complete data
          if (updates.status === "unconfirmed") {
            console.log(
              "Resolving input box data for unconfirmed transaction from source:",
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

            // For unconfirmed transactions with missing input data, resolve in background
            if (inputsNeedingResolution > 0) {
              console.log(
                `${updates.source} source with missing input assets - using background resolution`,
              );

              // Resolve inputs in background and update once when complete
              this._resolveInputBoxData(processedTransaction)
                .then((resolvedTransaction) => {
                  const currentStoreData = get(monitoringData.store);
                  // Only update if the transaction is still being monitored and still unconfirmed
                  if (transactions.has(txId) && currentStoreData.status === "unconfirmed") {
                    monitoringData.store.set({
                      ...currentStoreData,
                      ...updates,
                      data: resolvedTransaction,
                      lastUpdate: new Date().toISOString(),
                    });
                    console.log("Background input box resolution completed");
                  }
                })
                .catch((error) => {
                  console.warn(
                    "Background input box resolution failed:",
                    error,
                  );
                  // Update with unresolved data if resolution fails
                  const currentStoreData = get(monitoringData.store);
                  if (transactions.has(txId) && currentStoreData.status === "unconfirmed") {
                    monitoringData.store.set({
                      ...currentStoreData,
                      ...updates,
                      data: processedTransaction,
                      lastUpdate: new Date().toISOString(),
                    });
                  }
                });

              return; // Exit early, background resolution will update later
            } else {
              console.log("No input resolution needed for unconfirmed transaction");
            }
          } else if (updates.status === "confirmed") {
            console.log("Transaction confirmed - using data as-is without box resolution");
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

      // Always update the store immediately (especially important for confirmed status)
      monitoringData.store.set(newData);
      console.log(`Transaction ${txId} updated to status: ${newData.status}`);
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
