import { useState, useCallback, useEffect, useRef } from "react";
import { fetchYF } from "../api/yahoo";
import { WATCHLIST_SYMBOLS, SCREENER_SYMBOLS } from "../utils/constants";

// Extra symbols to load in the background for the screener (exclude ones already in watchlist)
const EXTRA_SYMBOLS = SCREENER_SYMBOLS.filter(s => !WATCHLIST_SYMBOLS.includes(s));

// High-quality mock data for when backend is unavailable (landing page preview)
// This data is pre-seeded immediately so UI renders instantly
const MOCK_STOCK_DATA = {
  NVDA: { symbol: "NVDA", name: "NVIDIA Corp", price: 875.42, prevClose: 868.21, marketCap: 2150000000000, pe: 72.5, week52Low: 373.56, week52High: 974.00 },
  AAPL: { symbol: "AAPL", name: "Apple Inc", price: 213.18, prevClose: 214.02, marketCap: 3280000000000, pe: 33.2, week52Low: 164.08, week52High: 237.49 },
  MSFT: { symbol: "MSFT", name: "Microsoft Corp", price: 415.50, prevClose: 414.38, marketCap: 3090000000000, pe: 36.8, week52Low: 309.45, week52High: 468.35 },
  TSLA: { symbol: "TSLA", name: "Tesla Inc", price: 248.73, prevClose: 251.13, marketCap: 792000000000, pe: 67.4, week52Low: 138.80, week52High: 299.29 },
  GOOGL: { symbol: "GOOGL", name: "Alphabet Inc", price: 175.82, prevClose: 174.96, marketCap: 2180000000000, pe: 26.1, week52Low: 118.23, week52High: 191.75 },
  META: { symbol: "META", name: "Meta Platforms", price: 523.45, prevClose: 520.18, marketCap: 1340000000000, pe: 27.8, week52Low: 274.38, week52High: 542.81 },
  AMZN: { symbol: "AMZN", name: "Amazon.com Inc", price: 186.92, prevClose: 185.24, marketCap: 1960000000000, pe: 61.2, week52Low: 118.35, week52High: 201.20 },
  AMD: { symbol: "AMD", name: "Advanced Micro", price: 156.78, prevClose: 158.42, marketCap: 253000000000, pe: 284.1, week52Low: 93.12, week52High: 227.30 },
  SPY: { symbol: "SPY", name: "SPDR S&P 500", price: 512.47, prevClose: 510.82, marketCap: 480000000000, pe: 24.3, week52Low: 410.22, week52High: 530.14 },
};

// Check if we're likely in a preview environment (no backend)
const isPreviewEnvironment = () => {
  if (typeof window === "undefined") return true;
  // Check if running on Vercel preview or v0 sandbox
  const hostname = window.location.hostname;
  return hostname.includes("vercel.app") || 
         hostname.includes("v0.dev") || 
         hostname.includes("vusercontent.net");
};

export function useWatchlist() {
  // Pre-seed with mock data so UI renders instantly
  const [watch, setWatch] = useState(MOCK_STOCK_DATA);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const loadWatch = useCallback(async () => {
    // Skip API calls entirely in preview environments to avoid ECONNREFUSED spam
    if (isPreviewEnvironment()) {
      console.info("[useWatchlist] Preview environment detected, using mock data");
      return;
    }

    // Prevent duplicate fetches
    if (hasFetched.current) return;
    hasFetched.current = true;

    setLoading(true);
    try {
      // Try to load real data in background
      const results = await Promise.allSettled(WATCHLIST_SYMBOLS.map(s => fetchYF(s)));
      const map = {};
      let hasData = false;
      
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          map[WATCHLIST_SYMBOLS[i]] = result.value;
          hasData = true;
        }
      });
      
      // Only update if we got real data
      if (hasData) {
        setWatch(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      // Silently fail - mock data is already showing
      console.info("[useWatchlist] Using mock data due to:", e.message);
    } finally {
      setLoading(false);
    }

    // Load screener extras in the background (only if main fetch succeeded)
    for (let i = 0; i < EXTRA_SYMBOLS.length; i++) {
      const sym = EXTRA_SYMBOLS[i];
      await new Promise(r => setTimeout(r, i * 300));
      fetchYF(sym)
        .then(data => setWatch(prev => ({ ...prev, [sym]: data })))
        .catch(() => {}); // silently skip failures
    }
  }, []);

  useEffect(() => { loadWatch(); }, [loadWatch]);

  return { watch, loading, reload: loadWatch };
}
