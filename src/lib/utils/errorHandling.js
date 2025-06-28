/**
 * Utility functions for consistent error handling across the application
 */

/**
 * Create a standardized error state manager
 * @param {string} context - Context for error logging (e.g., 'blocks', 'mempool')
 * @returns {object} Error state manager with reactive properties and methods
 */
export function createErrorState(context = "api") {
  let error = $state(null);
  let isLoading = $state(false);

  return {
    get error() {
      return error;
    },
    get isLoading() {
      return isLoading;
    },

    setLoading(loading) {
      isLoading = loading;
      if (loading) {
        error = null; // Clear error when starting new request
      }
    },

    setError(err) {
      error = err?.message || err || "An unknown error occurred";
      isLoading = false;
      console.error(`[${context}] Error:`, err);
    },

    clearError() {
      error = null;
    },

    async handleAsync(asyncFn, loadingMessage = null) {
      try {
        this.setLoading(true);
        const result = await asyncFn();
        this.setLoading(false);
        return result;
      } catch (err) {
        this.setError(err);
        throw err;
      }
    },
  };
}

/**
 * Standard error handling for API calls
 * @param {Promise} apiCall - The API call promise
 * @param {string} context - Context for error logging
 * @returns {Promise} Resolves with data on success, null on error
 */
export async function handleApiCall(apiCall, context = "api") {
  try {
    const result = await apiCall;
    return result;
  } catch (error) {
    console.warn(`Failed to ${context}:`, error);
    return null;
  }
}

/**
 * Create a safe async function that won't throw
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Safe async function that returns null on error
 */
export function createSafeAsync(asyncFn, context = "api") {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.warn(`Failed to ${context}:`, error);
      return null;
    }
  };
}

/**
 * Standard error types for consistent error handling
 */
export const ERROR_TYPES = {
  NETWORK: "network",
  API: "api",
  VALIDATION: "validation",
  NOT_FOUND: "not_found",
  UNAUTHORIZED: "unauthorized",
  RATE_LIMIT: "rate_limit",
};

/**
 * Create user-friendly error messages
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context for the error
 * @returns {string} User-friendly error message
 */
export function createUserFriendlyError(error, context = "operation") {
  if (typeof error === "string") {
    return error;
  }

  if (error?.status) {
    switch (error.status) {
      case 404:
        return `${context.charAt(0).toUpperCase() + context.slice(1)} not found`;
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return `Failed to load ${context}. Please try again.`;
    }
  }

  return error?.message || `Failed to load ${context}. Please try again.`;
}

/**
 * Retry utility for failed operations
 * @param {Function} operation - The operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise} Promise that resolves with the operation result
 */
export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (i === maxRetries) {
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i)),
      );
    }
  }

  throw lastError;
}
