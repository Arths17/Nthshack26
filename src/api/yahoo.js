import { CACHE } from "../utils/constants";

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
    const response = await fetch(`/api/stock/${normalizedSymbol}?timeframe=${encodeURIComponent(normalizedTimeframe)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Stock not found: ${symbol}`);
      }
      throw new Error(`API error: ${response.statusText}`);
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

