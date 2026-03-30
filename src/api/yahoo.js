import { CACHE } from "../utils/constants";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const cache = new Map(); // symbol → { data, expiresAt }

/**
 * Fetch live stock data from backend proxy (which uses yfinance)
 * @param {string} symbol - Stock symbol (e.g., "NVDA")
 * @param {string} timeframe - Chart timeframe key (e.g., "1D", "1M")
 * @returns {Promise<object>} Stock data with candles, price, etc.
 * @throws {Error} If symbol is invalid or fetch fails
 */
export const fetchYF = async (symbol, timeframe = "3M") => {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Invalid symbol");
  }

  if (!timeframe || typeof timeframe !== "string") {
    throw new Error("Invalid timeframe");
  }

  const normalizedSymbol = symbol.toUpperCase();
  const normalizedTimeframe = timeframe.toUpperCase();
  const cacheKey = `${normalizedSymbol}:${normalizedTimeframe}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const url = `${API_BASE}/api/stock/${normalizedSymbol}?timeframe=${encodeURIComponent(normalizedTimeframe)}`;
    // Debug: log the full API URL so frontend network issues are easier to trace
    // (temporary - remove after debugging)
    // eslint-disable-next-line no-console
    console.log('[fetchYF] Fetching URL:', url);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        // Try to read JSON error body (FastAPI returns {detail: ...})
        const err = await response.json();
        if (err && err.detail) detail = err.detail;
      } catch (e) {
        try {
          const txt = await response.text();
          if (txt) detail = txt;
        } catch (e) {}
      }

      if (response.status === 404) {
        throw new Error(`Stock not found: ${symbol}`);
      }
      throw new Error(`API error: ${detail}`);
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE.STOCK_DATA_TTL_MS });

    return data;
  } catch (error) {
    console.error(`Failed to fetch ${normalizedSymbol} (${normalizedTimeframe}):`, error);
    throw new Error(`Failed to fetch stock data for ${normalizedSymbol}: ${error.message}`);
  }
};

