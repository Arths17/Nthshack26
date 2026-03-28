import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";
import { validateSymbol } from "../utils/validation";

/**
 * Hook for fetching and caching stock data
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Chart timeframe key
 * @returns {object} { data, loading, error, reload }
 */
export function useStockData(symbol, timeframe = "3M") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (sym, tf) => {
    // Validate symbol
    const validation = validateSymbol(sym);
    if (!validation.valid) {
      setError(validation.error);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const stockData = await fetchYF(sym, tf);
      setData(stockData);
      setError(null);
    } catch (e) {
      console.error(`Failed to load data for ${sym}:`, e);
      setError(e.message || `Failed to load data for ${sym}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(symbol, timeframe);
  }, [symbol, timeframe, load]);

  return { data, loading, error, reload: () => load(symbol, timeframe) };
}
