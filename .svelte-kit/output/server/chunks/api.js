import { A as API_ENDPOINTS } from "./constants.js";
function getApiHost() {
  if (typeof window !== "undefined") {
    if (window.location.host === "dev.ergexplorer.com") {
      return "https://devapi.ergexplorer.com/";
    }
  }
  return API_ENDPOINTS.ERGEXPLORER;
}
class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });
    if (!response.ok) {
      throw new ApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        response
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error.message}`, 0, null);
  }
}
async function getBlocks(params = {}) {
  const {
    limit = 20,
    offset = 0,
    sortBy = "height",
    sortDirection = "desc"
  } = params;
  const url = `${API_ENDPOINTS.ERGOPLATFORM}blocks?limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
  return apiRequest(url);
}
async function getMempool(params = {}) {
  const {
    limit = 20,
    offset = 0,
    sortBy = "size",
    sortDirection = "desc"
  } = params;
  const url = `${API_ENDPOINTS.ERGOPLATFORM_BASE}transactions/unconfirmed?limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
  return apiRequest(url);
}
async function getPrices() {
  try {
    const url = `${getApiHost()}tokens/getErgPrice`;
    const data = await apiRequest(url);
    return data.items?.[0] || null;
  } catch (error) {
    console.warn("Failed to fetch prices:", error);
    return null;
  }
}
export {
  API_ENDPOINTS,
  getApiHost,
  getBlocks,
  getMempool,
  getPrices
};
