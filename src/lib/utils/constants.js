// Blockchain constants
export const FEE_ADDRESS =
  "2iHkR7CWvD1R4j1yZg5bkeDRQavjAaVPeTDFGGLZduHyfWMuYpmhHocX8GJoaieTx78FntzJbCBVL6rf96ocJoZdmWBL2fci7NqWgAirppPQmZ7fN9V6z13Ay6brPriBKYqLp1bT2Fk4FkFLCfdPpe";
export const DONATION_ADDRESS =
  "9hiaAS3pCydq12CS7xrTBBn2YTfdfSRCsXyQn9KZHVpVyEPk9zk";

// Fee ergotree for transaction fee detection
export const FEE_ERGOTREE =
  "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304";

// Ergo blockchain constants
export const ERG_DECIMALS = 9;
export const NANOERG_TO_ERG = 1000000000;

// API endpoints
export const API_ENDPOINTS = {
  ERGEXPLORER: "https://api.ergexplorer.com/",
  ERGOPLATFORM: "https://api.ergoplatform.com/api/v1/",
  ERGOPLATFORM_BASE: "https://api.ergoplatform.com/",
  SPECTRUM: "https://api.spectrum.fi/v1/",
  MEWFINANCE: "https://api.mewfinance.com/",
  SOCKET: "https://socket.ergexplorer.com",
};

// Get API host with dev environment support
export function getApiHost() {
  if (typeof window !== "undefined") {
    if (window.location.host === "dev.ergexplorer.com") {
      return "https://devapi.ergexplorer.com/";
    }
  }
  return API_ENDPOINTS.ERGEXPLORER;
}
