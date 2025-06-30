import { error } from "@sveltejs/kit";
import { API_ENDPOINTS } from "$lib/utils/constants.js";

/**
 * Try to fetch transaction from unconfirmed API
 */
async function fetchUnconfirmedTransaction(txId, fetch) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.ERGOPLATFORM_BASE}transactions/unconfirmed/${txId}`,
    );
    if (response.ok) {
      const transaction = await response.json();
      return { ...transaction, isUnconfirmed: true };
    }
  } catch (err) {
    console.warn("Failed to fetch unconfirmed transaction:", err);
  }
  return null;
}

/**
 * Try to fetch transaction from confirmed API
 */
async function fetchConfirmedTransaction(txId, fetch) {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.ERGOPLATFORM}transactions/${txId}`,
    );
    if (response.ok) {
      const transaction = await response.json();
      return { ...transaction, isUnconfirmed: false };
    }
  } catch (err) {
    console.warn("Failed to fetch confirmed transaction:", err);
  }
  return null;
}

export async function load({ params, fetch }) {
  const { txId } = params;

  try {
    // Try unconfirmed first (faster for recent transactions)
    let transaction = await fetchUnconfirmedTransaction(txId, fetch);

    // If not found in unconfirmed, try confirmed
    if (!transaction) {
      transaction = await fetchConfirmedTransaction(txId, fetch);
    }

    // Don't throw 404 here - let client-side monitoring handle it
    // This allows socket/real-time data to be checked first
    return {
      transaction: transaction || null,
      txId,
      initialStatus: transaction
        ? transaction.isUnconfirmed
          ? "unconfirmed"
          : "confirmed"
        : "not_found",
    };
  } catch (err) {
    // Only throw errors for actual server errors, not 404s
    console.error("Failed to load transaction:", err);

    // Return null transaction and let client handle it
    return {
      transaction: null,
      txId,
      initialStatus: "not_found",
    };
  }
}
