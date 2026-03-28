import { memo, useMemo, useState } from "react";
import Glass from "./Glass";
import { useStocks } from "../hooks/useStocks";

/**
 * Navigation bar with symbol pills and portfolio summary
 * Memoized to prevent unnecessary re-renders
 */
export default memo(function NavBar({ sym, watch, pnl, cash, onSelect }) {
  const { stocks } = useStocks();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get first 8 stocks from popular stocks list for nav bar buttons
  const navSymbols = useMemo(() => {
    if (!stocks.length) return ["NVDA", "AAPL", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "SPY"];
    return stocks.slice(0, 8).map(s => s.symbol);
  }, [stocks]);

  return (
    <div style={nav}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#4facfe 0%,#a78bfa 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(79,172,254,.3)" }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 17, color: "#fff", lineHeight: 1 }}>Q</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: ".12em", color: "#f8fafc" }}>QUANTA</div>
          <div style={{ fontSize: 9, color: "rgba(148,163,184,.5)", letterSpacing: ".1em" }}>AI TRADING TERMINAL</div>
        </div>
      </div>

      {/* Symbol pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, padding: "0 8px", alignItems: "center", position: "relative" }}>
        {navSymbols.map(s => {
          const d = watch[s];
          const chg = d?.price && d?.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
          const active = s === sym;
          return (
            <button key={s} onClick={() => onSelect(s)} style={{
              padding: "5px 14px", borderRadius: 20,
              border: `1px solid ${active ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`,
              background: active ? "rgba(79,172,254,.12)" : "rgba(255,255,255,.02)",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0, transition: "all .2s",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; } }}
            >
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "#4facfe" : "rgba(148,163,184,.8)", letterSpacing: ".03em" }}>{s}</span>
              {chg != null
                ? <span style={{ fontSize: 9, color: chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</span>
                : <div className="skel" style={{ width: 28, height: 8 }} />}
            </button>
          );
        })}

        {/* Stock selector dropdown */}
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: "5px 12px", borderRadius: 20,
              border: "1px solid rgba(255,255,255,.07)",
              background: "rgba(255,255,255,.02)",
              cursor: "pointer", fontSize: 12, fontWeight: 500, color: "rgba(148,163,184,.8)",
              letterSpacing: ".03em", flexShrink: 0, transition: "all .2s",
              display: "flex", alignItems: "center", gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"; }}
          >
            ▼ More
          </button>

          {showDropdown && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 1000,
              background: "rgba(8,14,30,.95)", backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
              boxShadow: "0 20px 40px rgba(0,0,0,.5)",
              maxHeight: 400, overflowY: "auto", width: 280,
              padding: "8px"
            }}>
              {stocks.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => {
                    onSelect(stock.symbol);
                    setShowDropdown(false);
                  }}
                  style={{
                    width: "100%", padding: "10px 12px", textAlign: "left",
                    background: stock.symbol === sym ? "rgba(79,172,254,.15)" : "rgba(255,255,255,.02)",
                    border: "1px solid " + (stock.symbol === sym ? "rgba(79,172,254,.3)" : "rgba(255,255,255,.06)"),
                    borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "all .2s",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    color: stock.symbol === sym ? "#4facfe" : "rgba(148,163,184,.8)",
                  }}
                  onMouseEnter={e => {
                    if (stock.symbol !== sym) {
                      e.currentTarget.style.background = "rgba(255,255,255,.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,.14)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (stock.symbol !== sym) {
                      e.currentTarget.style.background = "rgba(255,255,255,.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,.06)";
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "inherit" }}>{stock.symbol}</div>
                    <div style={{ fontSize: 10, color: "rgba(148,163,184,.5)", marginTop: 2 }}>{stock.name}</div>
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(148,163,184,.4)", textAlign: "right" }}>
                    {stock.sector}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio summary */}
      <Glass style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,.5)", letterSpacing: ".07em", marginBottom: 2 }}>P&L</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
            {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(0)}
          </div>
        </div>
        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,.5)", letterSpacing: ".07em", marginBottom: 2 }}>CASH</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>${(cash / 1000).toFixed(1)}k</div>
        </div>
        <div style={{ width: 1, height: 28, background: "rgba(255,255,255,.08)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite", boxShadow: "0 0 8px #4ade80" }} />
          <span style={{ fontSize: 10, color: "rgba(148,163,184,.6)", letterSpacing: ".07em" }}>LIVE</span>
        </div>
      </Glass>
    </div>
  );
});

const nav = {
  position: "relative", zIndex: 10, height: 58,
  display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
  background: "rgba(8,14,30,.7)", backdropFilter: "blur(24px)",
  borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0,
};
