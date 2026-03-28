import { useState } from "react";
import Glass from "../components/Glass";
import Spark from "../components/Spark";
import { f2, fB, fV, SYMBOLS } from "../utils/formatters";

const green = "#4ade80", red = "#f87171", muted = "rgba(148,163,184,.5)";

const SORTS = [
  { key: "today",   label: "Today's Move",   hint: "which moved most today",      fn: d => (d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0) },
  { key: "mcap",    label: "Market Cap",      hint: "biggest companies first",     fn: d => d.marketCap || 0 },
  { key: "pe",      label: "P/E Ratio",       hint: "lowest = possibly cheaper",   fn: d => d.pe || 9999 },
  { key: "volume",  label: "Volume",          hint: "most traded today",           fn: d => d.volume || 0 },
  { key: "w52pos",  label: "52W Position",    hint: "closest to yearly high",      fn: d => d.w52h && d.w52l ? (d.price - d.w52l) / (d.w52h - d.w52l) : 0 },
  { key: "price",   label: "Price",           hint: "highest price first",         fn: d => d.price || 0 },
];

function Badge({ color, children }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 600, color, background: color === green ? "rgba(74,222,128,.1)" : color === red ? "rgba(248,113,113,.1)" : "rgba(167,139,250,.1)", padding: "2px 7px", borderRadius: 6, letterSpacing: ".04em" }}>
      {children}
    </span>
  );
}

export default function ScreenerPage({ watch }) {
  const [sortKey, setSortKey] = useState("today");
  const [asc, setAsc] = useState(false);

  const sort = SORTS.find(s => s.key === sortKey);
  const stocks = SYMBOLS.map(s => watch[s]).filter(Boolean).sort((a, b) =>
    asc ? sort.fn(a) - sort.fn(b) : sort.fn(b) - sort.fn(a)
  );

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Sort controls */}
      <Glass style={{ padding: "12px 16px", borderRadius: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: muted, marginRight: 4 }}>Sort by</span>
        {SORTS.map(s => (
          <button key={s.key} onClick={() => { if (sortKey === s.key) setAsc(a => !a); else { setSortKey(s.key); setAsc(false); } }} style={{
            padding: "5px 13px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all .2s",
            border: `1px solid ${sortKey === s.key ? "rgba(79,172,254,.4)" : "rgba(255,255,255,.07)"}`,
            background: sortKey === s.key ? "rgba(79,172,254,.12)" : "transparent",
            color: sortKey === s.key ? "#4facfe" : muted,
            display: "flex", alignItems: "center", gap: 5,
          }}>
            {s.label}
            {sortKey === s.key && <span style={{ fontSize: 9 }}>{asc ? "▲" : "▼"}</span>}
          </button>
        ))}
        <span style={{ fontSize: 10, color: muted, marginLeft: "auto" }}>{sort.hint}</span>
      </Glass>

      {/* Stock rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stocks.map((d, rank) => {
          const chgPct = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : null;
          const up = chgPct >= 0;
          const w52pos = d.w52h && d.w52l ? ((d.price - d.w52l) / (d.w52h - d.w52l) * 100) : null;
          const peSignal = d.pe ? (d.pe < 15 ? "low P/E" : d.pe > 40 ? "high P/E" : null) : null;

          return (
            <Glass key={d.symbol} style={{ padding: "14px 18px", borderRadius: 14, display: "flex", alignItems: "center", gap: 16, transition: "border-color .2s", cursor: "default" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"}>

              {/* Rank */}
              <div style={{ fontSize: 12, fontWeight: 700, color: muted, width: 20, flexShrink: 0, textAlign: "center" }}>#{rank + 1}</div>

              {/* Symbol */}
              <div style={{ width: 60, flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", fontFamily: "'DM Serif Display',serif", fontStyle: "italic" }}>{d.symbol}</div>
                <div style={{ fontSize: 9, color: muted, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.sector}</div>
              </div>

              {/* Spark */}
              <Spark candles={d.candles?.slice(-30)} up={up} w={72} h={28} />

              {/* Price */}
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>${f2(d.price)}</div>
                {chgPct != null && (
                  <div style={{ fontSize: 11, color: up ? green : red, fontWeight: 500 }}>{up ? "+" : ""}{chgPct.toFixed(2)}% today</div>
                )}
              </div>

              {/* Metrics */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Mkt Cap</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{fB(d.marketCap)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>P/E Ratio</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{d.pe?.toFixed(1) ?? "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Volume</div>
                  <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{fV(d.volume)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>52W Position</div>
                  <div style={{ fontSize: 12, color: w52pos > 70 ? green : w52pos < 30 ? red : "#e2e8f0", marginTop: 2 }}>
                    {w52pos != null ? `${w52pos.toFixed(0)}% of range` : "—"}
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                {chgPct != null && Math.abs(chgPct) > 3 && (
                  <Badge color={up ? green : red}>{up ? "HOT" : "DUMP"}</Badge>
                )}
                {w52pos != null && w52pos >= 90 && <Badge color={green}>52W HIGH</Badge>}
                {w52pos != null && w52pos <= 10 && <Badge color={red}>52W LOW</Badge>}
                {peSignal && <Badge color="#a78bfa">{peSignal.toUpperCase()}</Badge>}
              </div>
            </Glass>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: muted, textAlign: "center", padding: "4px 0 8px" }}>
        Click any sort button twice to reverse the order · Data refreshes every 60 seconds
      </div>
    </div>
  );
}
