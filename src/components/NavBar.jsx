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
    <header className="q-nav" role="banner">
      <div className="q-nav__brand">
        <div className="q-nav__brand-mark" aria-hidden>
          <span className="q-nav__brand-letter">Q</span>
        </div>
        <div>
          <div className="q-nav__brand-text-title">QUANTA</div>
          <div className="q-nav__brand-text-sub">TRADING TERMINAL</div>
        </div>
      </div>

      <div className="q-nav__scroll" role="navigation" aria-label="Quick symbols">
        {navSymbols.map(s => {
          const d = watch[s];
          const chg = d?.price && d?.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
          const active = s === sym;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onSelect(s)}
              className={`q-nav-symbol ${active ? "q-nav-symbol--active" : ""}`}
            >
              <span className="q-nav-symbol__ticker">{s}</span>
              {chg != null ? (
                <span className={`q-nav-symbol__chg ${chg >= 0 ? "q-nav-symbol__chg--up" : "q-nav-symbol__chg--down"}`}>
                  {chg >= 0 ? "+" : ""}
                  {chg.toFixed(1)}%
                </span>
              ) : (
                <div className="skel" style={{ width: 24, height: 7 }} />
              )}
            </button>
          );
        })}

        <div className="q-nav__more-wrap" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="q-nav__more-btn"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-controls="stock-search-dropdown"
          >
            More ↓
          </button>

          {showDropdown && (
            <div
              id="stock-search-dropdown"
              className="q-nav-dropdown"
              role="listbox"
              aria-label="Search all stocks"
            >
              <div className="q-nav-dropdown__search">
                <input
                  type="text"
                  className="q-nav-input"
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
                />
              </div>

              <div className="q-nav-dropdown__list">
                {filteredStocks.length > 0 ? (
                  filteredStocks.map(stock => (
                    <button
                      key={stock.symbol}
                      type="button"
                      role="option"
                      aria-selected={stock.symbol === sym}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSelect(stock.symbol);
                        setShowDropdown(false);
                        setSearchQuery("");
                      }}
                      className={`q-nav-stock-row ${stock.symbol === sym ? "q-nav-stock-row--active" : ""}`}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: stock.symbol === sym ? "#f4f4f5" : "#a1a1aa" }}>{stock.symbol}</div>
                        <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>{stock.name}</div>
                      </div>
                      <div style={{ fontSize: 9, color: "#3f3f46", textAlign: "right" }}>{stock.sector}</div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "14px", textAlign: "center", color: "#52525b", fontSize: 12 }}>
                    {stocks.length === 0 ? "Loading…" : "No results"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="q-nav__stats">
        <div>
          <div className="q-nav__stat-label">P&L</div>
          <div className={`q-nav__stat-value ${pnl >= 0 ? "q-nav__stat-value--pnl-pos" : "q-nav__stat-value--pnl-neg"}`}>
            {pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(0)}
          </div>
        </div>
        <div className="q-nav__divider" aria-hidden />
        <div className="q-nav__stat-block q-nav__stat-block--cash">
          <div className="q-nav__stat-label">CASH</div>
          <div className="q-nav__stat-value q-nav__stat-value--neutral">
            ${(cash / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="q-nav__divider" aria-hidden />
        <div className="q-nav__live">
          <span className="q-nav__live-dot" aria-hidden />
          <span className="q-nav__live-label">LIVE</span>
        </div>
        <div className="q-nav__divider" aria-hidden />
        <button type="button" onClick={onSignOut} className="q-nav__signout" title="Sign out">
          Sign Out
        </button>
      </div>
    </header>
  );
});
