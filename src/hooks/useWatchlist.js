import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";
import { WATCHLIST_SYMBOLS, SCREENER_SYMBOLS } from "../utils/constants";

// Extra symbols to load in the background for the screener (exclude ones already in watchlist)
const EXTRA_SYMBOLS = SCREENER_SYMBOLS.filter(s => !WATCHLIST_SYMBOLS.includes(s));

export function useWatchlist() {
  const [watch, setWatch] = useState({});
  const [loading, setLoading] = useState(true);

  const loadWatch = useCallback(async () => {
    setLoading(true);
    try {
      // Load nav watchlist immediately
      const results = await Promise.allSettled(WATCHLIST_SYMBOLS.map(s => fetchYF(s)));
      const map = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") map[WATCHLIST_SYMBOLS[i]] = result.value;
        else console.error(`Failed to load ${WATCHLIST_SYMBOLS[i]}:`, result.reason);
      });
      setWatch(map);
    } catch (e) {
      console.error("Error loading watchlist:", e);
    } finally {
      setLoading(false);
    }

    // Load screener extras in the background — staggered to avoid rate limits
    for (let i = 0; i < EXTRA_SYMBOLS.length; i++) {
      const sym = EXTRA_SYMBOLS[i];
      // Small delay between each to avoid overwhelming the backend
      await new Promise(r => setTimeout(r, i * 300));
      fetchYF(sym)
        .then(data => setWatch(prev => ({ ...prev, [sym]: data })))
        .catch(() => {}); // silently skip failures
    }
  }, []);

  useEffect(() => { loadWatch(); }, [loadWatch]);

  return { watch, loading, reload: loadWatch };
}
