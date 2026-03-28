import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";

export function useStockData(symbol) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async (sym) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchYF(sym));
    } catch (e) {
      setError("Failed to load data for " + sym + ". Check your connection and try again.");
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(symbol); }, [symbol, load]);

  return { data, loading, error, reload: () => load(symbol) };
}
