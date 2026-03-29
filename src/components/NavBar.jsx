import { memo, useMemo, useState, useRef, useEffect } from "react";
import { useStocks } from "../hooks/useStocks";

export default memo(function NavBar({ sym, watch, pnl, cash, onSelect, onSignOut }) {
  const { stocks } = useStocks();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  const navSymbols = useMemo(() => {
    if (!stocks.length) return ["NVDA", "AAPL", "TSLA", "MSFT", "META", "AMZN", "GOOGL", "SPY", "NFLX", "AMD", "INTC", "AVGO", "MU", "QCOM", "ADBE"];
    return stocks.slice(0, 16).map(s => s.symbol);
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks.slice().sort((a, b) => a.symbol.localeCompare(b.symbol));
    const q = searchQuery.toLowerCase();
    return stocks
      .filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [stocks, searchQuery]);

  return (
    <div style={nav}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#4facfe,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: "#fff", letterSpacing: "-.02em" }}>Q</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".08em", color: "#f8fafc" }}>QUANTA</div>
          <div style={{ fontSize: 9, color: "rgba(148,163,184,.4)", letterSpacing: ".08em" }}>TRADING TERMINAL</div>
        </div>
      </div>

      {/* Symbol pills */}
      <div style={{ display: "flex", gap: 2, overflowX: "auto", flex: 1, padding: "0 8px", alignItems: "center" }}>
        {navSymbols.map(s => {
          const d = watch[s];
          const chg = d?.price && d?.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
          const active = s === sym;
          return (
            <button key={s} type="button" onClick={() => onSelect(s)} style={{
              padding: "4px 10px", borderRadius: 5,
              border: `1px solid ${active ? "rgba(255,255,255,.12)" : "transparent"}`,
              background: active ? "rgba(255,255,255,.07)" : "transparent",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
              flexShrink: 0, transition: "all .15s",
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? "#f4f4f5" : "#71717a", letterSpacing: ".02em" }}>{s}</span>
              {chg != null
                ? <span style={{ fontSize: 9, color: chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>{chg >= 0 ? "+" : ""}{chg.toFixed(1)}%</span>
                : <div className="skel" style={{ width: 24, height: 7 }} />}
            </button>
          );
        })}

        {/* More dropdown */}
        <div style={{ position: "relative", marginLeft: "auto", flexShrink: 0 }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: "4px 10px", borderRadius: 5,
              border: "1px solid transparent",
              background: showDropdown ? "rgba(255,255,255,.07)" : "transparent",
              cursor: "pointer", fontSize: 11, fontWeight: 500, color: "#71717a",
              flexShrink: 0, transition: "all .15s", display: "flex", alignItems: "center", gap: 4,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}
            onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = "transparent"; }}
          >
            More ↓
          </button>

          {showDropdown && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 1000,
              background: "#080f20", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,.6)",
              maxHeight: 400, minWidth: 260,
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0 }}>
                <input
                  type="text"
                  placeholder="Search stocks…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && filteredStocks.length > 0) {
                      const q = searchQuery.toLowerCase().trim();
                      const exact = filteredStocks.find(s => s.symbol.toLowerCase() === q);
                      onSelect((exact || filteredStocks[0]).symbol);
                      setShowDropdown(false);
                      setSearchQuery("");
                    }
                  }}
                  onMouseDown={e => e.preventDefault()}
                  autoFocus
                  style={{
                    width: "100%", padding: "7px 10px", fontSize: 12,
                    background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 5, color: "#e4e4e7", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(255,255,255,.18)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,.08)"}
                />
              </div>

              <div style={{ overflowY: "auto", padding: "6px", flex: 1 }}>
                {filteredStocks.length > 0 ? filteredStocks.map(stock => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelect(stock.symbol);
                      setShowDropdown(false);
                      setSearchQuery("");
                    }}
                    style={{
                      width: "100%", padding: "8px 10px", textAlign: "left",
                      background: stock.symbol === sym ? "rgba(255,255,255,.07)" : "transparent",
                      border: "1px solid " + (stock.symbol === sym ? "rgba(255,255,255,.1)" : "transparent"),
                      borderRadius: 5, cursor: "pointer", marginBottom: 2, transition: "all .12s",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                    onMouseEnter={e => { if (stock.symbol !== sym) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                    onMouseLeave={e => { if (stock.symbol !== sym) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: stock.symbol === sym ? "#f4f4f5" : "#a1a1aa" }}>{stock.symbol}</div>
                      <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>{stock.name}</div>
                    </div>
                    <div style={{ fontSize: 9, color: "#3f3f46", textAlign: "right" }}>{stock.sector}</div>
                  </button>
                )) : (
                  <div style={{ padding: "14px", textAlign: "center", color: "#52525b", fontSize: 12 }}>
                    {stocks.length === 0 ? "Loading…" : "No results"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,.06)", paddingLeft: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: "#52525b", letterSpacing: ".06em", marginBottom: 2 }}>P&L</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: pnl >= 0 ? "#4ade80" : "#f87171" }}>
            {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(0)}
          </div>
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.06)" }} />
        <div>
          <div style={{ fontSize: 9, color: "#52525b", letterSpacing: ".06em", marginBottom: 2 }}>CASH</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#a1a1aa" }}>${(cash / 1000).toFixed(1)}k</div>
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.06)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#52525b", letterSpacing: ".06em" }}>LIVE</span>
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.06)" }} />
        <button
          onClick={onSignOut}
          title="Sign out"
          style={{
            padding: "5px 12px",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,.08)",
            background: "transparent",
            color: "#a1a1aa",
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all .15s",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(248,113,113,.1)";
            e.currentTarget.style.borderColor = "rgba(248,113,113,.3)";
            e.currentTarget.style.color = "#f87171";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
            e.currentTarget.style.color = "#a1a1aa";
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
});

const nav = {
  position: "relative", zIndex: 10, height: 54,
  display: "flex", alignItems: "center", padding: "0 20px", gap: 16,
  background: "rgba(6,11,24,.95)",
  backdropFilter: "blur(20px)",
  borderBottom: "1px solid rgba(255,255,255,.06)", flexShrink: 0,
};
