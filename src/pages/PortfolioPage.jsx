import Glass from "../components/Glass";
import Spark from "../components/Spark";
import { f2 } from "../utils/formatters";

const green = "#4ade80", red = "#f87171", muted = "rgba(148,163,184,.5)", dim = "rgba(148,163,184,.25)";

function PnLChart({ log }) {
  if (!log.length) return null;
  // Build running P&L from trades
  let running = 0;
  const points = [0, ...log.slice().reverse().map(t => {
    running += t.type === "BUY" ? -(t.qty * t.price) : (t.qty * t.price);
    return running;
  })];
  const W = 500, H = 60;
  const mn = Math.min(...points), mx = Math.max(...points), rng = mx - mn || 1;
  const pts = points.map((v, i) =>
    `${(i / (points.length - 1)) * W},${H - ((v - mn) / rng) * (H - 6) - 3}`
  ).join(" ");
  const isUp = points.at(-1) >= 0;
  const col = isUp ? green : red;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity=".2" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0 ${H} L ${pts.split(" ").join(" L ")} L ${W} ${H} Z`} fill="url(#pnlGrad)" />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1={0} x2={W} y1={H - ((0 - mn) / rng) * (H - 6) - 3} y2={H - ((0 - mn) / rng) * (H - 6) - 3}
        stroke="rgba(255,255,255,.1)" strokeWidth="1" strokeDasharray="3 4" />
    </svg>
  );
}

export default function PortfolioPage({ pos, log, cash, watch }) {
  const posEntries = Object.entries(pos);
  const portVal = cash + posEntries.reduce((s, [k, v]) => {
    const qty = typeof v === 'object' ? v.quantity : v;
    return s + qty * (watch[k]?.price || 0);
  }, 0);
  const pnl = portVal - 100_000;
  const isUp = pnl >= 0;

  const wins  = log.filter(t => t.type === "SELL");
  const buys  = log.filter(t => t.type === "BUY");

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Portfolio Value", value: `$${f2(portVal)}`, color: "#f1f5f9" },
          { label: "Total P&L", value: `${isUp ? "+" : "−"}$${Math.abs(pnl).toFixed(2)}`, color: isUp ? green : red },
          { label: "Cash Available", value: `$${f2(cash)}`, color: "#e2e8f0" },
          { label: "Invested", value: `$${f2(portVal - cash)}`, color: "#a78bfa" },
        ].map(({ label, value, color }) => (
          <Glass key={label} style={{ padding: "14px 16px", borderRadius: 14 }}>
            <div style={{ fontSize: 9, color: muted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'DM Serif Display',serif" }}>{value}</div>
          </Glass>
        ))}
      </div>

      {/* P&L chart */}
      {log.length > 1 && (
        <Glass style={{ padding: "14px 16px", borderRadius: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 10 }}>
            Trade P&L over time
            <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>cash flow from all your trades</span>
          </div>
          <PnLChart log={log} />
        </Glass>
      )}

      {/* Open positions */}
      <Glass style={{ padding: "14px 16px", borderRadius: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
          Open Positions
          <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>stocks you currently own</span>
        </div>
        {posEntries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: muted, fontSize: 12 }}>
            You don't own any stocks yet — go to the Market page to buy some!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {posEntries.map(([s, v]) => {
              const qty = typeof v === 'object' ? v.quantity : v;
              const d = watch[s];
              const price = d?.price || 0;
              const dayChgPct = d?.price && d?.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
              const up = dayChgPct >= 0;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: up ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${up ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 13, color: up ? green : red }}>{s[0]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{s}</div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{qty} shares · ${f2(price)} each</div>
                  </div>
                  <Spark candles={d?.candles?.slice(-20)} up={up} w={64} h={24} />
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>${f2(qty * price)}</div>
                    <div style={{ fontSize: 11, color: up ? green : red, marginTop: 2 }}>{up ? "+" : ""}{dayChgPct.toFixed(2)}% today</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Glass>

      {/* Trade log */}
      <Glass style={{ padding: "14px 16px", borderRadius: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>
          Trade History
          <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>{log.length} trades · {buys.length} buys · {wins.length} sells</span>
        </div>
        {log.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: muted, fontSize: 12 }}>No trades yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {log.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: t.type === "BUY" ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)", border: `1px solid ${t.type === "BUY" ? "rgba(74,222,128,.25)" : "rgba(248,113,113,.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.type === "BUY" ? green : red }}>{t.type === "BUY" ? "↑" : "↓"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{t.type} {t.sym}</span>
                  <span style={{ fontSize: 11, color: muted, marginLeft: 8 }}>{t.qty} shares @ ${f2(t.price)}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.type === "BUY" ? red : green }}>
                    {t.type === "BUY" ? "−" : "+"}${f2(t.qty * t.price)}
                  </div>
                  <div style={{ fontSize: 9, color: dim }}>{t.at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Glass>
    </div>
  );
}
