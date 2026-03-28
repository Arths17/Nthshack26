import { useState, useRef } from "react";
import Glass from "../components/Glass";
import Spark from "../components/Spark";
import { f2, fB, fV, SYMBOLS } from "../utils/formatters";

const green = "#22c55e", red = "#ef4444", muted = "#52525b", accent = "#a1a1aa";

function bar(pct, color) {
  return (
    <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,.06)", borderRadius: 4, overflow: "hidden", width: "100%" }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 4, transition: "width .6s ease" }} />
    </div>
  );
}

export default function ComparePage({ watch }) {
  const allSymbols = SYMBOLS.filter(s => watch[s]);
  const [selected, setSelected] = useState(new Set(allSymbols));
  const [inputVal, setInputVal] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef(null);

  const query = inputVal.trim().toUpperCase();
  const suggestions = allSymbols.filter(s => !selected.has(s) && s.startsWith(query));

  function toggle(sym) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(sym)) { if (next.size > 1) next.delete(sym); }
      else next.add(sym);
      return next;
    });
  }

  function addSymbol(sym) {
    setSelected(prev => new Set([...prev, sym]));
    setInputVal("");
    setDropOpen(false);
    inputRef.current?.focus();
  }

  const stocks = SYMBOLS.map(s => watch[s]).filter(s => s && selected.has(s.symbol));
  if (!stocks.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: muted, fontSize: 13 }}>
      Loading market data…
    </div>
  );

  const minPct  = Math.min(...stocks.map(s => s.price && s.prevClose ? (s.price - s.prevClose) / s.prevClose * 100 : 0));
  const maxPct  = Math.max(...stocks.map(s => s.price && s.prevClose ? (s.price - s.prevClose) / s.prevClose * 100 : 0));
  const range   = maxPct - minPct || 1;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 0", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Company selector */}
      <Glass style={{ padding: "12px 16px", borderRadius: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Compare Companies</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {allSymbols.map(sym => {
            const on = selected.has(sym);
            return (
              <button key={sym} onClick={() => toggle(sym)} style={{
                padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${on ? accent : "rgba(255,255,255,.1)"}`,
                background: on ? "rgba(79,172,254,.12)" : "rgba(255,255,255,.03)",
                color: on ? accent : muted,
                transition: "all .15s",
              }}>
                {sym}
              </button>
            );
          })}
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => { setInputVal(e.target.value.toUpperCase()); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
              onBlur={() => setTimeout(() => setDropOpen(false), 150)}
              placeholder="Add symbol…"
              style={{
                background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#e2e8f0",
                outline: "none", width: 110,
              }}
            />
            {dropOpen && suggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#0d1424",
                border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, overflow: "hidden", zIndex: 50, minWidth: 110,
              }}>
                {suggestions.map(sym => (
                  <div key={sym} onMouseDown={() => addSymbol(sym)} style={{
                    padding: "7px 12px", fontSize: 11, fontWeight: 600, color: "#e2e8f0",
                    cursor: "pointer", transition: "background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(79,172,254,.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {sym}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Glass>

      {/* Cards row */}
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, minWidth: "min-content" }}>
          {stocks.map(d => {
          const chgPct = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
          const up = chgPct >= 0;
          return (
            <Glass key={d.symbol} style={{ padding: "14px 16px", borderRadius: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", fontWeight: 600, letterSpacing: "-.01em" }}>{d.symbol}</div>
                  <div style={{ fontSize: 9, color: muted, marginTop: 1 }}>{d.sector}</div>
                </div>
                {chgPct != null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: up ? green : red, background: up ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", padding: "2px 8px", borderRadius: 6 }}>
                    {up ? "▲" : "▼"} {Math.abs(chgPct).toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>${f2(d.price)}</div>
              <Spark candles={d.candles?.slice(-30)} up={up} w={120} h={30} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 10 }}>
                <div><div style={{ color: muted }}>Mkt Cap</div><div style={{ color: "#e2e8f0" }}>{fB(d.marketCap)}</div></div>
                <div><div style={{ color: muted }}>P/E</div><div style={{ color: "#e2e8f0" }}>{d.pe?.toFixed(1) ?? "—"}</div></div>
                <div><div style={{ color: muted }}>52W High</div><div style={{ color: green }}>${f2(d.w52h)}</div></div>
                <div><div style={{ color: muted }}>52W Low</div><div style={{ color: red }}>${f2(d.w52l)}</div></div>
              </div>
            </Glass>
          );
        })}
        </div>
      </div>

      {/* Today's performance bar chart */}
      <Glass style={{ padding: "16px 20px", borderRadius: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>Today's Performance</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...stocks].sort((a, b) => {
            const ac = a.price && a.prevClose ? (a.price - a.prevClose) / a.prevClose * 100 : 0;
            const bc = b.price && b.prevClose ? (b.price - b.prevClose) / b.prevClose * 100 : 0;
            return bc - ac;
          }).map(d => {
            const chgPct = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
            const up = chgPct >= 0;
            const barPct = ((chgPct - minPct) / range) * 100;
            return (
              <div key={d.symbol} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", width: 44, flexShrink: 0 }}>{d.symbol}</span>
                <div style={{ flex: 1 }}>{bar(barPct, up ? green : red)}</div>
                <span style={{ fontSize: 11, fontWeight: 600, color: up ? green : red, width: 54, textAlign: "right", flexShrink: 0 }}>
                  {up ? "+" : ""}{chgPct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </Glass>

      {/* Comparison table */}
      <Glass style={{ padding: "16px 20px", borderRadius: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 14 }}>Full Comparison Table</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ color: muted, fontSize: 10, letterSpacing: ".06em" }}>
                {["Stock", "Price", "Today", "Mkt Cap", "P/E Ratio", "Volume", "52W High", "52W Low", "52W Position"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "0 12px 10px 0", fontWeight: 500, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((d, i) => {
                const chgPct = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
                const up = chgPct >= 0;
                const w52pos = d.w52h && d.w52l ? ((d.price - d.w52l) / (d.w52h - d.w52l) * 100) : null;
                return (
                  <tr key={d.symbol} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                    <td style={{ padding: "10px 12px 10px 0", fontWeight: 700, color: "#f1f5f9", fontWeight: 600, letterSpacing: "-.01em" }}>{d.symbol}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0", fontWeight: 500 }}>${f2(d.price)}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: up ? green : red, fontWeight: 600 }}>{chgPct != null ? `${up ? "+" : ""}${chgPct.toFixed(2)}%` : "—"}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0" }}>{fB(d.marketCap)}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0" }}>{d.pe?.toFixed(1) ?? "—"}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#e2e8f0" }}>{fV(d.volume)}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: green }}>${f2(d.w52h)}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: red }}>${f2(d.w52l)}</td>
                    <td style={{ padding: "10px 12px 10px 0", minWidth: 100 }}>
                      {w52pos != null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {bar(w52pos, w52pos > 50 ? green : red)}
                          <span style={{ fontSize: 10, color: muted, flexShrink: 0 }}>{w52pos.toFixed(0)}%</span>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>
    </div>
  );
}
