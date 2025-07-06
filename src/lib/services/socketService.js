import { writable } from "svelte/store";
import { io } from "socket.io-client";
import { API_ENDPOINTS } from "$lib/utils/constants.js";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventListeners = new Map();

    // Reactive stores
    this.connectionStatus = writable(false);
    this.mempoolTransactions = writable([]);
    this.nodeInfo = writable(null);
    this.lastUpdate = writable(null);
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io(API_ENDPOINTS.SOCKET, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("Failed to connect to socket:", error);
      this.connectionStatus.set(false);
    }
  }

  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("Connected to socket server");
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.connectionStatus.set(true);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket server:", reason);
      this.isConnected = false;
      this.connectionStatus.set(false);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnected = false;
      this.connectionStatus.set(false);
    });

    this.socket.on("info", (info) => {
      console.log("Socket info:", info);
      this.nodeInfo.set(info);
    });

    // Listen for mempool updates
    this.socket.on("mempoolTxs", (transactions) => {
      this.mempoolTransactions.set(transactions);
      this.lastUpdate.set(new Date().toISOString());

      // Emit to custom listeners
      this.emit("mempoolTxs", transactions);
    });
  }

  // Subscribe to specific events
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  // Emit events to custom listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Error in socket event callback:", error);
        }
      });
    }
  }

  // Find specific transaction in mempool
  findTransaction(txId) {
    let transaction = null;
    const unsubscribe = this.mempoolTransactions.subscribe((transactions) => {
      transaction = transactions.find((tx) => tx.id === txId);
    });
    // Immediately unsubscribe since we only want current value
    unsubscribe();
    return transaction;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionStatus.set(false);
    }
  }

  // Get connection status store
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Get mempool transactions store
  getMempoolTransactions() {
    return this.mempoolTransactions;
  }

  // Get last update time store
  getLastUpdate() {
    return this.lastUpdate;
  }

  getNodeInfo() {
    return this.nodeInfo;
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Auto-connect on import (browser only)
if (typeof window !== "undefined") {
  socketService.connect();
}
