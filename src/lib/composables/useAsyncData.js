import { writable } from "svelte/store";

/**
 * Composable for managing async data loading with loading and error states
 * @returns {object} Data store, loading state, error state, and fetch function
 */
export function useAsyncData() {
  const data = writable(null);
  const loading = writable(false);
  const error = writable(null);

  async function fetchData(apiCall, errorMessage = "Failed to load data") {
    try {
      loading.set(true);
      error.set(null);

      const result = await apiCall();
      data.set(result);
      return result;
    } catch (err) {
      const message = err.message || errorMessage;
      error.set(message);
      console.error(errorMessage + ":", err);
      throw err;
    } finally {
      loading.set(false);
    }
  }

  function reset() {
    data.set(null);
    loading.set(false);
    error.set(null);
  }

  return {
    data: { subscribe: data.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    fetchData,
    reset,
  };
}

/**
 * Specialized composable for ERG price data
 * @returns {object} Price-specific data management
 */
export function usePrices() {
  const { data: ergPrice, loading, error, fetchData } = useAsyncData();

  async function loadPrices() {
    const { getPrices } = await import("$lib/utils/api.js");
    return fetchData(async () => {
      const priceData = await getPrices();
      return priceData?.price || null;
    }, "Failed to load prices");
  }

  return {
    ergPrice: { subscribe: ergPrice.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    loadPrices,
  };
}
