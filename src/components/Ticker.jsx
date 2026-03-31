import { memo, useMemo } from "react";
import { f2 } from "../utils/formatters";
import { useStocks } from "../hooks/useStocks";

const Ticker = memo(function Ticker({ watch, loading, onSelect }) {
  const { stocks } = useStocks();

  const tickerSymbols = useMemo(() => {
    if (!stocks.length) return ["NVDA", "AAPL", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "SPY"];
    return stocks.slice(0, 12).map(s => s.symbol);
  }, [stocks]);

  if (loading) {
    return (
      <div className="q-ticker">
        <div className="skel" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
      </div>
    );
  }

  return (
    <div className="q-ticker" role="region" aria-label="Live stock ticker">
      <div className="q-ticker__track">
        {[...tickerSymbols, ...tickerSymbols].map((s, i) => {
          const d = watch[s];
          if (!d) return null;
          const chg = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
          const up = chg >= 0;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(s)}
              className="q-ticker__btn"
              aria-label={`${s}: $${f2(d.price)}, ${up ? "up" : "down"} ${Math.abs(chg).toFixed(2)} percent`}
              title={`View ${s}`}
            >
              <span className="q-ticker__sym">{s}</span>
              <span className="q-ticker__price">${f2(d.price)}</span>
              <span className={`q-ticker__pct ${up ? "q-ticker__pct--up" : "q-ticker__pct--down"}`}>
                {up ? "▲" : "▼"}
                {Math.abs(chg).toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Ticker;
