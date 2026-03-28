import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";
import { WATCHLIST_SYMBOLS } from "../utils/constants";

/**
 * Hook for loading watchlist stock data with error handling
 * @returns {object} { watch, loading, reload }
 */
export function useWatchlist() {
  const [watch, setWatch] = useState({});
  const [loading, setLoading] = useState(true);

  const loadWatch = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(WATCHLIST_SYMBOLS.map(symbol => fetchYF(symbol)));
      const map = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          map[WATCHLIST_SYMBOLS[i]] = result.value;
        } else {
          console.error(`Failed to load ${WATCHLIST_SYMBOLS[i]}:`, result.reason);
        }
      });
      setWatch(map);
    } catch (e) {
      console.error("Error loading watchlist:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatch();
  }, [loadWatch]);

  return { watch, loading, reload: loadWatch };
}
