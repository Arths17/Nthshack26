import { memo, useMemo } from "react";
import { f2 } from "../utils/formatters";
import { useStocks } from "../hooks/useStocks";

/**
 * Scrolling ticker bar showing live prices for all watchlist symbols
 * Memoized to prevent unnecessary animations/reflows
 */
const Ticker = memo(function Ticker({ watch, loading, onSelect }) {
  const { stocks } = useStocks();
  
  // Get top 12 stocks from the popular stocks list (sorted by sector)
  const tickerSymbols = useMemo(() => {
    if (!stocks.length) return ["NVDA", "AAPL", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "SPY"];
    return stocks.slice(0, 12).map(s => s.symbol);
  }, [stocks]);

  if (loading) {
    return (
      <div style={bar}>
        <div className="skel" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
      </div>
    );
  }

  return (
    <div style={bar} role="region" aria-label="Live Stock Ticker">
      <div style={{ display: "flex", animation: "ticker 55s linear infinite", whiteSpace: "nowrap" }}>
        {[...tickerSymbols, ...tickerSymbols].map((s, i) => {
          const d = watch[s];
          if (!d) return null;
          const chg = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
          return (
            <button 
              key={i} 
              onClick={() => onSelect(s)}
              aria-label={`${s}: $${f2(d.price)}, ${chg >= 0 ? "up" : "down"} ${Math.abs(chg).toFixed(2)}%`}
              title={`Click to view ${s}`}
              style={{ padding: "0 22px", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, transition: "opacity .2s", background: "none", border: "none", color: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".5"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <span style={{ color: "#3f3f46", fontWeight: 500 }}>{s}</span>
              <span style={{ color: "#a1a1aa", fontWeight: 500 }}>${f2(d.price)}</span>
              <span style={{ fontSize: 10, color: chg >= 0 ? "#22c55e" : "#ef4444", fontWeight: 500 }}>
                {chg >= 0 ? "▲" : "▼"}{Math.abs(chg).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Ticker;

const bar = {
  position: "relative", zIndex: 10, height: 28,
  borderBottom: "1px solid rgba(255,255,255,.06)",
  overflow: "hidden", display: "flex", alignItems: "center",
  background: "#0a0a0a", flexShrink: 0,
};
