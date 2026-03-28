import { CACHE } from "../utils/constants";

const cache = new Map(); // symbol → { data, expiresAt }

/**
 * Fetch live stock data from backend proxy (which uses yfinance)
 * @param {string} symbol - Stock symbol (e.g., "NVDA")
 * @returns {Promise<object>} Stock data with candles, price, etc.
 * @throws {Error} If symbol is invalid or fetch fails
 */
export const fetchYF = async (symbol) => {
  if (!symbol || typeof symbol !== "string") {
    throw new Error("Invalid symbol");
  }

  // Check cache first
  const cached = cache.get(symbol);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const response = await fetch(`/api/stock/${symbol.toUpperCase()}`, {
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
    cache.set(symbol, { data, expiresAt: Date.now() + CACHE.STOCK_DATA_TTL_MS });

    return data;
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    throw new Error(`Failed to fetch stock data for ${symbol}: ${error.message}`);
  }
};

