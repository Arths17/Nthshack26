import { useState, lazy, Suspense } from "react";
import Glass from "./Glass";
import Chart from "./Chart";
import Spark from "./Spark";
import Pill from "./Pill";
import Stat from "./Stat";
import Counter from "./Counter";
import { Icons } from "./Icons";
import { f2, fB, fV } from "../utils/formatters";
import { COLORS, TYPOGRAPHY, SPACING } from "../utils/designSystem";
// Lazy load pages for code splitting
const ComparePage   = lazy(() => import("../pages/ComparePage"));
const PortfolioPage = lazy(() => import("../pages/PortfolioPage"));
const ScreenerPage  = lazy(() => import("../pages/ScreenerPage"));
const LearnPage     = lazy(() => import("../pages/LearnPage"));
const NewsPage      = lazy(() => import("../pages/NewsPage"));
const AlertsPage    = lazy(() => import("../pages/AlertsPage"));
const StrategyLibrary = lazy(() => import("../pages/StrategyLibrary"));

const PAGES = [
  { id: "market",    label: "Market",     icon: "Market" },
  { id: "compare",   label: "Compare",    icon: "Compare" },
  { id: "portfolio", label: "Portfolio",  icon: "Portfolio" },
  { id: "screener",  label: "Screener",   icon: "Screener" },
  { id: "strategies",label: "Strategies", icon: "Strategies" },
  { id: "news",      label: "News",       icon: "News" },
  { id: "alerts",    label: "Alerts",     icon: "Alerts" },
  { id: "learn",     label: "Learn",      icon: "Learn" },
];

// Fallback loader for lazy pages
function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 200 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: COLORS.text.muted }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${COLORS.primary}20`, borderTop: `2px solid ${COLORS.primary}`, animation: "spin .8s linear infinite" }} />
        <span style={{ fontSize: TYPOGRAPHY.sizes.xs }}>Loading page…</span>
      </div>
    </div>
  );
}

export default function MainContent({ sym, data, loading, error, watch, pos, log, cash, buy, sell, onReload, send }) {
  const [page, setPage] = useState("market");
  const [tab,  setTab]  = useState("chart");
  const [qty,  setQty]  = useState("10");

  const price    = data?.price;
  const prev     = data?.prevClose;
  const dayChg   = price && prev ? price - prev : null;
  const dayChgPct = dayChg && prev ? (dayChg / prev * 100) : null;
  const isUp     = dayChg >= 0;
  const curPos   = pos[sym] || 0;

  const pnl = cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0) - 100_000;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", padding: "20px 24px 16px", gap: 12 }}>

      {/* ── TOP PAGE NAV ── */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0, overflowX: "auto", paddingBottom: 2 }}>
        {PAGES.map(p => {
          const IconComp = Icons[p.icon];
          return (
            <Pill key={p.id} active={page === p.id} onClick={() => setPage(p.id)}>
              <span style={{ marginRight: SPACING.sm, display: "flex", alignItems: "center", justifyContent: "center", opacity: page === p.id ? 1 : 0.6 }}>
                <IconComp style={{ width: 16, height: 16 }} />
              </span>
              {p.label}
            </Pill>
          );
        })}
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
      {page === "market" && <>

      {/* Price hero */}
      <Glass style={{ padding: "18px 22px", flexShrink: 0 }}>
        {error ? (
          <div style={{ color: COLORS.danger, fontSize: TYPOGRAPHY.sizes.base, padding: "8px 0" }}>{error}</div>
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
              <div style={{ fontSize: TYPOGRAPHY.sizes["3xl"], fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.text.primary, letterSpacing: "-.02em", lineHeight: 1, fontFamily: TYPOGRAPHY.families.heading }}>{sym}</div>
              <div style={{ fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted, marginTop: 3 }}>{data.name}</div>
            </div>
            <div>
              <div style={{ fontSize: TYPOGRAPHY.sizes["4xl"], fontWeight: TYPOGRAPHY.weights.semibold, color: COLORS.text.primary, letterSpacing: "-.02em", lineHeight: 1 }}>
                <Counter to={price} prefix="$" />
              </div>
              <div style={{ fontSize: TYPOGRAPHY.sizes.base, marginTop: 4, color: isUp ? COLORS.success : COLORS.danger, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ background: isUp ? COLORS.accentMuted : "rgba(239,68,68,.1)", padding: "2px 7px", borderRadius: 4, fontWeight: TYPOGRAPHY.weights.medium }}>
                  {isUp ? "+" : ""}{dayChgPct?.toFixed(2)}%
                </span>
                <span style={{ fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.text.muted }}>today</span>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: "Market Cap", value: fB(data.marketCap) },
                { label: "P/E Ratio",  value: data.pe?.toFixed(1) ?? "—" },
                { label: "Volume",     value: fV(data.volume) },
                { label: "52W High",   value: `$${f2(data.w52h)}`, accent: COLORS.success },
                { label: "52W Low",    value: `$${f2(data.w52l)}`, accent: COLORS.danger },
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
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12, paddingBottom: SPACING.md, borderBottom: `1px solid ${COLORS.border.light}` }}>
          {[["chart", "Chart"], ["positions", "Positions"], ["log", "Trade Log"]].map(([id, label]) => (
            <Pill key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Pill>
          ))}
          <button onClick={onReload} style={{ marginLeft: "auto", padding: `${SPACING.sm}px ${SPACING.md}px`, borderRadius: 5, border: `1px solid ${COLORS.border.light}`, background: "transparent", color: COLORS.text.muted, fontSize: TYPOGRAPHY.sizes.xs, cursor: "pointer", display: "flex", alignItems: "center", gap: SPACING.sm, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.bg.cardHover; e.currentTarget.style.color = COLORS.text.secondary; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = COLORS.text.muted; }}>
            ↺ Refresh
          </button>
        </div>

        {/* ── CHART TAB ── */}
        {tab === "chart" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, animation: "fadeIn .3s ease" }}>
            <Glass style={{ flex: 1, padding: "4px 8px 0", minHeight: 0, overflow: "hidden" }}>
              <Chart candles={data?.candles} />
            </Glass>
            <Glass style={{ padding: "16px 20px", flexShrink: 0, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#52525b", display: "flex", gap: 20 }}>
                <span>Position <strong style={{ color: "#a1a1aa", marginLeft: 6 }}>{curPos} shares</strong></span>
                <span>Value <strong style={{ color: "#a1a1aa", marginLeft: 6 }}>${f2(curPos * (price || 0))}</strong></span>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Qty</span>
                <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 5, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                    style={{ width: 56, padding: "6px 10px", fontSize: 13, fontWeight: 500, textAlign: "center" }} />
                </div>
                {[
                  { label: "Buy",  color: "#22c55e", bg: "rgba(34,197,94,.1)",   border: "rgba(34,197,94,.25)",  action: () => buy(sym, parseInt(qty) || 0, price),  off: !price || (parseInt(qty) || 0) * price > cash },
                  { label: "Sell", color: "#ef4444", bg: "rgba(239,68,68,.1)",   border: "rgba(239,68,68,.25)",  action: () => sell(sym, parseInt(qty) || 0, price), off: (pos[sym] || 0) < (parseInt(qty) || 0) },
                ].map(b => (
                  <button key={b.label} onClick={b.action} disabled={b.off} style={{
                    padding: "6px 20px", borderRadius: 5,
                    border: `1px solid ${b.off ? "rgba(255,255,255,.06)" : b.border}`,
                    background: b.off ? "transparent" : b.bg,
                    color: b.off ? "#3f3f46" : b.color,
                    fontSize: 12, fontWeight: 600, cursor: b.off ? "not-allowed" : "pointer", transition: "all .15s",
                  }}>
                    {b.label}
                  </button>
                ))}
                <span style={{ fontSize: 11, color: "#3f3f46" }}>≈ ${f2((parseInt(qty) || 0) * (price || 0))}</span>
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
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: up ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)", border: `1px solid ${up ? "rgba(34,197,94,.18)" : "rgba(239,68,68,.18)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: up ? "#22c55e" : "#ef4444" }}>{s[0]}</span>
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
      </>}
    </div>
  );
}
