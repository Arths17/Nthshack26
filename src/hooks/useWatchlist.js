import { useState, useCallback, useEffect } from "react";
import { fetchYF } from "../api/yahoo";
import { SYMBOLS } from "../utils/formatters";

export function useWatchlist() {
  const [watch, setWatch] = useState({});
  const [loading, setLoading] = useState(true);

  const loadWatch = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled(SYMBOLS.map(fetchYF));
    const map = {};
    results.forEach((r, i) => {
      if (r.status === "fulfilled") map[SYMBOLS[i]] = r.value;
    });
    setWatch(map);
    setLoading(false);
  }, []);

  useEffect(() => { loadWatch(); }, [loadWatch]);

  return { watch, loading, reload: loadWatch };
}
