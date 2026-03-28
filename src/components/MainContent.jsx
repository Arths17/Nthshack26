import { useState } from "react";
import Glass from "./Glass";
import Chart from "./Chart";
import Spark from "./Spark";
import Pill from "./Pill";
import Stat from "./Stat";
import Counter from "./Counter";
import { f2, fB, fV } from "../utils/formatters";

export default function MainContent({ sym, data, loading, error, watch, pos, log, cash, buy, sell, onReload }) {
  const [tab, setTab] = useState("chart");
  const [qty, setQty] = useState("10");

  const price    = data?.price;
  const prev     = data?.prevClose;
  const dayChg   = price && prev ? price - prev : null;
  const dayChgPct = dayChg && prev ? (dayChg / prev * 100) : null;
  const isUp     = dayChg >= 0;
  const curPos   = pos[sym] || 0;

  const pnl = cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0) - 100_000;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: "20px 24px 16px", gap: 16 }}>

      {/* Price hero */}
      <Glass style={{ padding: "20px 24px", borderRadius: 20, flexShrink: 0 }}>
        {error ? (
          <div style={{ color: "#f87171", fontSize: 13, padding: "8px 0" }}>{error}</div>
        ) : loading ? (
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div className="skel" style={{ width: 120, height: 36 }} />
            <div className="skel" style={{ width: 80, height: 24 }} />
            <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
              {[80, 60, 70, 60, 60].map((w, i) => <div key={i} className="skel" style={{ width: w, height: 32 }} />)}
            </div>
          </div>
        ) : data ? (
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", animation: "fadeIn .4s ease" }}>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 32, fontWeight: 400, color: "#f8fafc", lineHeight: 1 }}>{sym}</div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", marginTop: 4, letterSpacing: ".04em" }}>{data.name}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, fontWeight: 400, color: "#f8fafc", lineHeight: 1 }}>
                <Counter to={price} prefix="$" />
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: isUp ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: isUp ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)", padding: "2px 8px", borderRadius: 6, fontWeight: 500 }}>
                  {isUp ? "▲" : "▼"} ${f2(Math.abs(dayChg))} ({dayChgPct >= 0 ? "+" : ""}{dayChgPct?.toFixed(2)}%)
                </span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,.4)" }}>today</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 28, flexWrap: "wrap" }}>
              {[
                { label: "Market Cap", value: fB(data.marketCap) },
                { label: "P/E Ratio",  value: data.pe?.toFixed(1) ?? "—" },
                { label: "Volume",     value: fV(data.volume) },
                { label: "52W High",   value: `$${f2(data.w52h)}`, accent: "#4ade80" },
                { label: "52W Low",    value: `$${f2(data.w52l)}`, accent: "#f87171" },
              ].map((s, i) => (
                <div key={s.label} style={{ animation: `fadeUp .4s ${.06 + i * .04}s ease both` }}>
                  <Stat label={s.label} value={s.value} accent={s.accent} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Glass>

      {/* Tabs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          {[["chart", "Chart"], ["positions", "Positions"], ["log", "Trade Log"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
          <button onClick={onReload} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.07)", background: "rgba(255,255,255,.02)", color: "rgba(148,163,184,.5)", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.color = "rgba(148,163,184,.5)"; }}>
            <span style={{ fontSize: 13 }}>↺</span> Refresh
          </button>
        </div>

        {/* ── CHART TAB ── */}
        {tab === "chart" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, animation: "fadeIn .3s ease" }}>
            <Glass style={{ flex: 1, padding: "4px 8px 0", minHeight: 0, overflow: "hidden" }}>
              <Chart candles={data?.candles} />
            </Glass>
            <Glass style={{ padding: "16px 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "rgba(148,163,184,.6)", display: "flex", gap: 20 }}>
                <span>Position <strong style={{ color: "#e2e8f0", marginLeft: 6 }}>{curPos} shares</strong></span>
                <span>Value <strong style={{ color: "#e2e8f0", marginLeft: 6 }}>${f2(curPos * (price || 0))}</strong></span>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,.4)" }}>Qty</span>
                <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                    style={{ width: 60, padding: "7px 12px", fontSize: 13, fontWeight: 500, textAlign: "center" }} />
                </div>
                {[
                  { label: "Buy",  color: "#4ade80", bg: "rgba(74,222,128,.12)",  border: "rgba(74,222,128,.3)",  action: () => buy(sym, parseInt(qty) || 0, price),  off: !price || (parseInt(qty) || 0) * price > cash },
                  { label: "Sell", color: "#f87171", bg: "rgba(248,113,113,.12)", border: "rgba(248,113,113,.3)", action: () => sell(sym, parseInt(qty) || 0, price), off: (pos[sym] || 0) < (parseInt(qty) || 0) },
                ].map(b => (
                  <button key={b.label} onClick={b.action} disabled={b.off} style={{
                    padding: "7px 24px", borderRadius: 10,
                    border: `1px solid ${b.off ? "rgba(255,255,255,.07)" : b.border}`,
                    background: b.off ? "rgba(255,255,255,.02)" : b.bg,
                    color: b.off ? "rgba(148,163,184,.25)" : b.color,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s", letterSpacing: ".02em",
                  }}
                    onMouseEnter={e => { if (!b.off) e.currentTarget.style.boxShadow = `0 0 16px ${b.bg}`; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    {b.label}
                  </button>
                ))}
                <span style={{ fontSize: 11, color: "rgba(148,163,184,.3)" }}>≈ ${f2((parseInt(qty) || 0) * (price || 0))}</span>
              </div>
            </Glass>
          </div>
        )}

        {/* ── POSITIONS TAB ── */}
        {tab === "positions" && (
          <div style={{ flex: 1, overflowY: "auto", animation: "fadeIn .3s ease" }}>
            {Object.keys(pos).length === 0 ? (
              <Glass style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>◎</div>
                <div style={{ color: "rgba(148,163,184,.4)", fontSize: 13 }}>No open positions yet</div>
                <div style={{ color: "rgba(148,163,184,.25)", fontSize: 11, marginTop: 6 }}>Buy some stocks to get started</div>
              </Glass>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(pos).map(([s, q], i) => {
                  const d = watch[s], p = d?.price || 0;
                  const pnlPct = d?.prevClose ? ((p - d.prevClose) / d.prevClose * 100) : 0;
                  const up = pnlPct >= 0;
                  return (
                    <Glass key={s} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, animation: `fadeUp .3s ${i * .05}s ease both`, cursor: "pointer", transition: "border-color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,.07)"}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: up ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${up ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: 14, fontStyle: "italic", color: up ? "#4ade80" : "#f87171" }}>{s[0]}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc" }}>{s}</div>
                        <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", marginTop: 2 }}>{q} shares · ${f2(p)}</div>
                      </div>
                      <Spark candles={watch[s]?.candles?.slice(-30)} up={up} w={80} h={32} />
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc" }}>${f2(q * p)}</div>
                        <div style={{ fontSize: 12, color: up ? "#4ade80" : "#f87171", marginTop: 2 }}>{up ? "+" : ""}{pnlPct.toFixed(2)}% today</div>
                      </div>
                    </Glass>
                  );
                })}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Glass style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)", marginBottom: 6, letterSpacing: ".06em" }}>CASH REMAINING</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0" }}>${f2(cash)}</div>
                  </Glass>
                  <Glass style={{ padding: "16px 20px", border: `1px solid ${pnl >= 0 ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)"}`, background: pnl >= 0 ? "rgba(74,222,128,.04)" : "rgba(248,113,113,.04)" }}>
                    <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)", marginBottom: 6, letterSpacing: ".06em" }}>TOTAL P&L</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: pnl >= 0 ? "#4ade80" : "#f87171" }}>{pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}</div>
                  </Glass>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRADE LOG TAB ── */}
        {tab === "log" && (
          <div style={{ flex: 1, overflowY: "auto", animation: "fadeIn .3s ease" }}>
            {log.length === 0 ? (
              <Glass style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: .3 }}>◈</div>
                <div style={{ color: "rgba(148,163,184,.4)", fontSize: 13 }}>No trades executed yet</div>
              </Glass>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {log.map((t, i) => (
                  <Glass key={i} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, animation: `fadeUp .2s ${i * .03}s ease both` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: t.type === "BUY" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${t.type === "BUY" ? "rgba(74,222,128,.25)" : "rgba(248,113,113,.25)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.type === "BUY" ? "#4ade80" : "#f87171" }}>{t.type === "BUY" ? "↑" : "↓"}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{t.type} {t.sym}</div>
                      <div style={{ fontSize: 11, color: "rgba(148,163,184,.4)", marginTop: 2 }}>{t.qty} shares @ ${f2(t.price)}</div>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>${f2(t.qty * t.price)}</div>
                      <div style={{ fontSize: 10, color: "rgba(148,163,184,.3)", marginTop: 2 }}>{t.at}</div>
                    </div>
                  </Glass>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
