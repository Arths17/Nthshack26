import { CACHE } from "../utils/constants";
import { devLog } from "../utils/logger";
import { getApiBase } from "../utils/apiBase";

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
    const base = getApiBase();
    const url = `${base}/api/stock/${normalizedSymbol}?timeframe=${encodeURIComponent(normalizedTimeframe)}`;
    devLog("[fetchYF]", url);
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
        const localHint =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "::1" ||
            window.location.hostname === "[::1]")
            ? " Run the API: cd backend && uvicorn server:app --reload --port 8000. In local dev, Next proxies /api to that server (unset NEXT_PUBLIC_API_URL unless the API is on another host)."
            : "";
        const looksLikeNextFallback = !detail || /^not found$/i.test(String(detail).trim());
        throw new Error(
          looksLikeNextFallback
            ? `Market data endpoint not reachable (404).${localHint ? " " + localHint : ""}`
            : `${detail}${localHint ? " " + localHint : ""}`
        );
      }
      throw new Error(`API error: ${detail}`);
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE.STOCK_DATA_TTL_MS });

    return data;
  } catch (error) {
    console.error(`Failed to fetch ${normalizedSymbol} (${normalizedTimeframe}):`, error);
    const msg = error?.message || String(error);
    const isNetwork =
      /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
    const loopback =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname === "::1" ||
        window.location.hostname === "[::1]");
    const hint =
      isNetwork && loopback
        ? " Start the Python API (port 8000): cd backend && uvicorn server:app --reload --port 8000. Clear NEXT_PUBLIC_API_URL in .env.local for same-origin /api proxy, unless your API runs elsewhere."
        : "";
    throw new Error(`Failed to fetch stock data for ${normalizedSymbol}: ${msg}${hint ? " — " + hint : ""}`);
  }
};

