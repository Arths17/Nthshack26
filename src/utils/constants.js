/**
 * Global constants for the trading terminal
 */

export const PORTFOLIO = {
  STARTING_CASH: 100_000,
  MAX_TRADE_LOG_ENTRIES: 20,
};

export const CACHE = {
  STOCK_DATA_TTL_MS: 60_000, // 60 seconds
  DEBOUNCE_DELAY_MS: 300,
  CHAT_DEBOUNCE_MS: 500,
};

export const API = {
  BACKEND_URL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  TIMEOUT_MS: 10_000,
};

export const TRADING = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 100_000,
  DECIMAL_PLACES: 2,
};

export const UI = {
  SIDEBAR_WIDTH: 300,
  BREAKPOINT_MOBILE: 768,
  BREAKPOINT_TABLET: 1024,
};

// Nav bar + ticker symbols (fast-load, always visible)
export const WATCHLIST_SYMBOLS = ["NVDA", "AAPL", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "SPY"];

// Expanded screener symbols — 40 stocks across 8 sectors
export const SCREENER_SYMBOLS = [
  // Tech
  "NVDA", "AAPL", "MSFT", "GOOGL", "META", "AMZN", "TSLA", "INTC", "AMD", "CRM",
  // Finance
  "JPM", "BAC", "GS", "V", "MA",
  // Healthcare
  "JNJ", "UNH", "PFE", "ABBV", "MRK",
  // Energy
  "XOM", "CVX", "OXY", "SLB",
  // Consumer
  "WMT", "COST", "HD", "MCD", "NKE",
  // ETFs / Indices
  "SPY", "QQQ", "DIA", "IWM",
  // Industrials
  "CAT", "BA", "GE", "LMT",
  // Semis / Chips
  "QCOM", "AVGO", "MU", "TXN",
];

export const STORAGE_KEYS = {
  PORTFOLIO_CASH: "quanta:cash",
  PORTFOLIO_POSITIONS: "quanta:positions",
  PORTFOLIO_TRADE_LOG: "quanta:tradeLog",
};
