import { useState, lazy, Suspense } from "react";
import Glass from "./Glass";
import Chart from "./Chart";
import Spark from "./Spark";
import Pill from "./Pill";
import Stat from "./Stat";
import Counter from "./Counter";
import { f2, fB, fV } from "../utils/formatters";
// Lazy load pages for code splitting
const ComparePage   = lazy(() => import("../pages/ComparePage"));
const PortfolioPage = lazy(() => import("../pages/PortfolioPage"));
const ScreenerPage  = lazy(() => import("../pages/ScreenerPage"));
const LearnPage     = lazy(() => import("../pages/LearnPage"));
const NewsPage      = lazy(() => import("../pages/NewsPage"));
const AlertsPage    = lazy(() => import("../pages/AlertsPage"));
const StrategyLibrary = lazy(() => import("../pages/StrategyLibrary"));

const PAGES = [
  { id: "market",     label: "Market" },
  { id: "compare",    label: "Compare" },
  { id: "portfolio",  label: "Portfolio" },
  { id: "screener",   label: "Screener" },
  { id: "strategies", label: "Strategies" },
  { id: "news",       label: "News" },
  { id: "alerts",     label: "Alerts" },
  { id: "learn",      label: "Learn" },
];

const TIMEFRAMES = [
  { id: "1D", label: "Hourly" },
  { id: "1W", label: "Weekly" },
  { id: "1M", label: "Monthly" },
  { id: "3M", label: "3M" },
  { id: "6M", label: "6M" },
  { id: "1Y", label: "1Y" },
  { id: "5Y", label: "5Y" },
];

// Fallback loader for lazy pages
function PageLoader() {
  return (
    <div className="q-page-loader" role="status" aria-live="polite">
      <div className="q-page-loader__ring" aria-hidden />
      <span className="q-page-loader__text">Loading</span>
    </div>
  );
}

export default function MainContent({ sym, data, loading, error, watch, pos, log, cash, buy, sell, onReload, send, timeframe, onTimeframeChange, onSelectSymbol }) {
  const [page, setPage] = useState("market");
  const [tab,  setTab]  = useState("chart");
  const [qty,  setQty]  = useState("10");
  const [trading, setTrading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState(null);

  const price    = data?.price;
  const prev     = data?.prevClose;
  const dayChg   = price && prev ? price - prev : null;
  const dayChgPct = dayChg && prev ? (dayChg / prev * 100) : null;
  const isUp     = dayChg >= 0;
  const curPos   = typeof pos[sym] === 'object' ? (pos[sym]?.quantity || 0) : (pos[sym] || 0);

  const pnl = cash + Object.entries(pos).reduce((s, [k, v]) => {
    const qty = typeof v === 'object' ? v.quantity : v;
    return s + qty * (watch[k]?.price || 0);
  }, 0) - 100_000;

  // Handle buy/sell with async support
  const handleBuy = async () => {
    if (trading) return;
    setTrading(true);
    setTradeMsg(null);
    const qtyNum = parseInt(qty) || 0;
    const result = await buy(sym, qtyNum, price);
    setTrading(false);
    if (result?.success) {
      setTradeMsg({ type: "success", text: `Bought ${qtyNum} shares of ${sym}` });
      setQty("10");
      setTimeout(() => setTradeMsg(null), 3000);
    } else {
      setTradeMsg({ type: "error", text: result?.error || "Failed to buy. Check your inputs." });
    }
  };

  const handleSell = async () => {
    if (trading) return;
    setTrading(true);
    setTradeMsg(null);
    const qtyNum = parseInt(qty) || 0;
    const result = await sell(sym, qtyNum, price);
    setTrading(false);
    if (result?.success) {
      setTradeMsg({ type: "success", text: `Sold ${qtyNum} shares of ${sym}` });
      setQty("10");
      setTimeout(() => setTradeMsg(null), 3000);
    } else {
      setTradeMsg({ type: "error", text: result?.error || "Failed to sell. Check your inputs." });
    }
  };

  return (
    <div className="q-main">

      {/* ── TOP PAGE NAV ── */}
      <div className="q-main__subnav">
        {PAGES.map(p => (
          <Pill key={p.id} active={page === p.id} onClick={() => setPage(p.id)}>
            {p.label}
          </Pill>
        ))}
      </div>

      {/* ── NON-MARKET PAGES ── */}
      {page === "compare"   && <Suspense fallback={<PageLoader />}><ComparePage   watch={watch} /></Suspense>}
      {page === "portfolio" && <Suspense fallback={<PageLoader />}><PortfolioPage pos={pos} log={log} cash={cash} watch={watch} /></Suspense>}
      {page === "screener"  && <Suspense fallback={<PageLoader />}><ScreenerPage  watch={watch} /></Suspense>}
      {page === "strategies" && <Suspense fallback={<PageLoader />}><StrategyLibrary onSendToChat={send} /></Suspense>}
      {page === "news"      && <Suspense fallback={<PageLoader />}><NewsPage      sym={sym} /></Suspense>}
      {page === "alerts"    && <Suspense fallback={<PageLoader />}><AlertsPage    watch={watch} /></Suspense>}
      {page === "learn"     && <Suspense fallback={<PageLoader />}><LearnPage /></Suspense>}

      {/* ── MARKET PAGE ── */}
      {page === "market" && (
      <div className="q-market-stack">

      {/* Price hero */}
      <Glass style={{ padding: "18px 22px", flexShrink: 0 }}>
        {error ? (
          <div className="q-data-error" role="alert">
            <p className="q-data-error__title">Market data unavailable</p>
            <p className="q-data-error__body">{error}</p>
            <button type="button" className="q-data-error__retry" onClick={onReload}>
              Retry
            </button>
          </div>
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
              <div style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", letterSpacing: "-.02em", lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>{sym}</div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,.5)", marginTop: 3 }}>{data.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#f8fafc", letterSpacing: "-.02em", lineHeight: 1 }}>
                <Counter to={price} prefix="$" />
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: isUp ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: isUp ? "rgba(79,172,254,.1)" : "rgba(248,113,113,.1)", padding: "2px 7px", borderRadius: 4, fontWeight: 500 }}>
                  {isUp ? "+" : ""}{dayChgPct?.toFixed(2)}%
                </span>
                <span style={{ fontSize: 11, color: "rgba(148,163,184,.5)" }}>today</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 24, flexWrap: "wrap" }}>
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
        <div className="q-main__section-tabs">
          {[["chart", "Chart"], ["positions", "Positions"], ["log", "Trade Log"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
          <button type="button" onClick={onReload} className="q-btn-ghost">
            ↺ Refresh
          </button>
        </div>

        {/* ── CHART TAB ── */}
        {tab === "chart" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, animation: "fadeIn .3s ease" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TIMEFRAMES.map(tf => (
                <Pill key={tf.id} active={timeframe === tf.id} onClick={() => onTimeframeChange(tf.id)} style={{ padding: "4px 10px", fontSize: 11 }}>
                  {tf.label}
                </Pill>
              ))}
            </div>
            <Glass style={{ flex: 1, padding: "4px 8px 0", minHeight: 0, overflow: "hidden" }}>
              <Chart candles={data?.candles} loading={loading} errorMessage={error} />
            </Glass>
            <Glass style={{ padding: "16px 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#52525b", display: "flex", gap: 20 }}>
                <span>Position <strong style={{ color: "#a1a1aa", marginLeft: 6 }}>{curPos} shares</strong></span>
                <span>Value <strong style={{ color: "#a1a1aa", marginLeft: 6 }}>${f2(curPos * (price || 0))}</strong></span>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Qty</span>
                <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 5, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)} disabled={trading}
                    style={{ width: 56, padding: "6px 10px", fontSize: 13, fontWeight: 500, textAlign: "center", opacity: trading ? 0.6 : 1 }} />
                </div>
                {[
                  { label: "Buy",  color: "#4ade80", bg: "rgba(74,222,128,.1)",   border: "rgba(74,222,128,.25)",  action: handleBuy,  off: trading || !price || (parseInt(qty) || 0) * price > cash },
                  { label: "Sell", color: "#f87171", bg: "rgba(248,113,113,.1)",  border: "rgba(248,113,113,.25)", action: handleSell, off: trading || (pos[sym] || 0) < (parseInt(qty) || 0) },
                ].map(b => (
                  <button key={b.label} onClick={b.action} disabled={b.off} style={{
                    padding: "6px 20px", borderRadius: 5,
                    border: `1px solid ${b.off ? "rgba(255,255,255,.06)" : b.border}`,
                    background: b.off ? "transparent" : b.bg,
                    color: b.off ? "#3f3f46" : b.color,
                    fontSize: 12, fontWeight: 600, cursor: b.off ? "not-allowed" : "pointer", transition: "all .15s",
                    opacity: trading && !b.off ? 0.7 : 1,
                  }}>
                    {trading && (b.label === "Buy" || b.label === "Sell") ? "..." : b.label}
                  </button>
                ))}
                <span style={{ fontSize: 11, color: "#3f3f46" }}>≈ ${f2((parseInt(qty) || 0) * (price || 0))}</span>
              </div>
              {tradeMsg && (
                <div style={{ marginTop: -8, width: "100%", padding: "8px 12px", borderRadius: 6, fontSize: 11, background: tradeMsg.type === "success" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", color: tradeMsg.type === "success" ? "#4ade80" : "#f87171", border: `1px solid ${tradeMsg.type === "success" ? "rgba(74,222,128,.3)" : "rgba(248,113,113,.3)"}` }}>
                  {tradeMsg.text}
                </div>
              )}
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
                {Object.entries(pos).map(([s, v], i) => {
                  const q = typeof v === 'object' ? v.quantity : v;
                  const d = watch[s], p = d?.price || 0;
                  const pnlPct = d?.prevClose ? ((p - d.prevClose) / d.prevClose * 100) : 0;
                  const up = pnlPct >= 0;
                  return (
                    <Glass key={s} hoverable style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, animation: `fadeUp .3s ${i * .05}s ease both`, cursor: "default" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: up ? "rgba(74,222,128,.08)" : "rgba(248,113,113,.08)", border: `1px solid ${up ? "rgba(74,222,128,.18)" : "rgba(248,113,113,.18)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: up ? "#4ade80" : "#f87171" }}>{s[0]}</span>
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
      )}
    </div>
  );
}
