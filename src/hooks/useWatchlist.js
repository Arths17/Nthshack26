import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";
import { WATCHLIST_SYMBOLS, SCREENER_SYMBOLS } from "../utils/constants";

// Extra symbols to load in the background for the screener (exclude ones already in watchlist)
const EXTRA_SYMBOLS = SCREENER_SYMBOLS.filter(s => !WATCHLIST_SYMBOLS.includes(s));

// Mock data for when backend is unavailable (landing page preview)
const MOCK_STOCK_DATA = {
  NVDA: { symbol: "NVDA", name: "NVIDIA Corp", price: 875.42, prevClose: 868.21, marketCap: 2150000000000, pe: 72.5, week52Low: 373.56, week52High: 974.00 },
  AAPL: { symbol: "AAPL", name: "Apple Inc", price: 213.18, prevClose: 214.02, marketCap: 3280000000000, pe: 33.2, week52Low: 164.08, week52High: 237.49 },
  MSFT: { symbol: "MSFT", name: "Microsoft Corp", price: 415.50, prevClose: 414.38, marketCap: 3090000000000, pe: 36.8, week52Low: 309.45, week52High: 468.35 },
  TSLA: { symbol: "TSLA", name: "Tesla Inc", price: 248.73, prevClose: 251.13, marketCap: 792000000000, pe: 67.4, week52Low: 138.80, week52High: 299.29 },
  GOOGL: { symbol: "GOOGL", name: "Alphabet Inc", price: 175.82, prevClose: 174.96, marketCap: 2180000000000, pe: 26.1, week52Low: 118.23, week52High: 191.75 },
  META: { symbol: "META", name: "Meta Platforms", price: 523.45, prevClose: 520.18, marketCap: 1340000000000, pe: 27.8, week52Low: 274.38, week52High: 542.81 },
  AMZN: { symbol: "AMZN", name: "Amazon.com Inc", price: 186.92, prevClose: 185.24, marketCap: 1960000000000, pe: 61.2, week52Low: 118.35, week52High: 201.20 },
  AMD: { symbol: "AMD", name: "Advanced Micro", price: 156.78, prevClose: 158.42, marketCap: 253000000000, pe: 284.1, week52Low: 93.12, week52High: 227.30 },
};

export function useWatchlist() {
  const [watch, setWatch] = useState({});
  const [loading, setLoading] = useState(true);

  const loadWatch = useCallback(async () => {
    setLoading(true);
    try {
      // Load nav watchlist immediately
      const results = await Promise.allSettled(WATCHLIST_SYMBOLS.map(s => fetchYF(s)));
      const map = {};
      let hasData = false;
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          map[WATCHLIST_SYMBOLS[i]] = result.value;
          hasData = true;
        } else {
          console.error(`Failed to load ${WATCHLIST_SYMBOLS[i]}:`, result.reason);
        }
      });
      
      // If no data loaded (backend unavailable), use mock data
      if (!hasData) {
        console.info("[useWatchlist] Backend unavailable, using mock data for preview");
        setWatch(MOCK_STOCK_DATA);
        setLoading(false);
        return;
      }
      
      setWatch(map);
    } catch (e) {
      console.error("Error loading watchlist:", e);
      // Fallback to mock data on error
      setWatch(MOCK_STOCK_DATA);
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
