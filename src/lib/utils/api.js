import axios from "axios";
import { API_ENDPOINTS, getApiHost } from "./constants.js";

// Re-export for backwards compatibility
export { API_ENDPOINTS, getApiHost };

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
    const response = await axios({
      url,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      data: options.body,
      ...options,
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new ApiError(
        `API request failed: ${error.response.statusText || error.message}`,
        error.response.status,
        error.response,
      );
    }
    throw new ApiError(`Network error: ${error.message}`, 0, null);
  }
}

export async function getBlocks(params = {}) {
  const {
    limit = 20,
    offset = 0,
    sortBy = "height",
    sortDirection = "desc",
  } = params;

  const url = `${API_ENDPOINTS.ERGOPLATFORM}blocks?limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
  return apiRequest(url);
}

export async function getBlock(id) {
  const url = `${API_ENDPOINTS.ERGOPLATFORM}blocks/${id}`;
  return apiRequest(url);
}

export async function getMempool(params = {}) {
  const {
    limit = 20,
    offset = 0,
    sortBy = "size",
    sortDirection = "desc",
  } = params;
  const url = `${API_ENDPOINTS.ERGOPLATFORM_BASE}transactions/unconfirmed?limit=${limit}&offset=${offset}&sortBy=${sortBy}&sortDirection=${sortDirection}`;
  return apiRequest(url);
}

export async function getTransaction(id) {
  const url = `${API_ENDPOINTS.ERGOPLATFORM}transactions/${id}`;
  return apiRequest(url);
}

export async function getAddress(address, params = {}) {
  const { limit = 20, offset = 0 } = params;
  const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}?limit=${limit}&offset=${offset}`;
  return apiRequest(url);
}

export async function getAddressTransactions(address, params = {}) {
  const { limit = 20, offset = 0 } = params;
  const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}/transactions?limit=${limit}&offset=${offset}`;
  return apiRequest(url);
}

export async function getTokens(params = {}) {
  const { limit = 50, offset = 0 } = params;
  const url = `${API_ENDPOINTS.ERGEXPLORER}tokens?limit=${limit}&offset=${offset}`;
  return apiRequest(url);
}

export async function getToken(tokenId) {
  const url = `${API_ENDPOINTS.ERGEXPLORER}tokens/${tokenId}`;
  return apiRequest(url);
}

export async function getBox(boxId) {
  const url = `${API_ENDPOINTS.ERGOPLATFORM}boxes/${boxId}`;
  return apiRequest(url);
}

export async function getPrices() {
  try {
    const url = `${getApiHost()}tokens/getErgPrice`;
    const data = await apiRequest(url);
    return data.items?.[0] || null;
  } catch (error) {
    console.warn("Failed to fetch prices:", error);
    return null;
  }
}

export async function getNetworkStats() {
  try {
    const url = `${API_ENDPOINTS.ERGOPLATFORM}networkState`;
    return apiRequest(url);
  } catch (error) {
    console.warn("Failed to fetch network stats:", error);
    return null;
  }
}

export async function getProtocolInfo() {
  try {
    const url = `${API_ENDPOINTS.ERGOPLATFORM_BASE}info`;
    return apiRequest(url);
  } catch (error) {
    console.warn("Failed to fetch protocol info:", error);
    return null;
  }
}

export async function getStats() {
  try {
    const url = `${API_ENDPOINTS.ERGOPLATFORM_BASE}stats`;
    return apiRequest(url);
  } catch (error) {
    console.warn("Failed to fetch stats:", error);
    return null;
  }
}

export async function getTopVolumeTokens() {
  try {
    const url = `${API_ENDPOINTS.MEWFINANCE2}dex/getTop10Volume`;
    return apiRequest(url);
  } catch (error) {
    console.warn("Failed to fetch top volume tokens:", error);
    return null;
  }
}

export async function getPriceHistory() {
  try {
    const url = `${getApiHost(2)}tokens/getPriceHistory?cache`;
    const nowTime = Date.now();
    const response = await axios.post(url, {
      from: nowTime,
      milestones: "true",
      period: "30d",
    });

    return response.data;
  } catch (error) {
    console.warn("Failed to fetch price history:", error);
    return null;
  }
}

export async function getWhaleTxs() {
  try {
    const url = `${getApiHost()}transactions/getWhaleTxs`;
    return apiRequest(url);
  } catch (error) {
    console.warn("Failed to fetch whale transactions:", error);
    return null;
  }
}

export async function getTokensByIds(tokenIds) {
  try {
    const url = `${getApiHost()}tokens/byId`;
    const response = await axios.post(url, {
      ids: tokenIds,
    });

    return response.data;
  } catch (error) {
    console.warn("Failed to fetch tokens by IDs:", error);
    return null;
  }
}

export async function getAddressBalance(address) {
  try {
    const url = `${API_ENDPOINTS.ERGOPLATFORM}addresses/${address}/balance/total`;
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.warn("Failed to fetch address balance:", error);
    return null;
  }
}

export function getBlockUrl(blockId) {
  return `/blocks/${blockId}`;
}

export function getTransactionUrl(txId) {
  return `/transactions/${txId}`;
}

export function getAddressUrl(address) {
  return `/addresses/${address}`;
}

export function getTokenUrl(tokenId) {
  return `/tokens/${tokenId}`;
}

export function getBoxUrl(boxId) {
  return `/boxes/${boxId}`;
}
