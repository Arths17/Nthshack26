import Glass from "./Glass";

const green = "#4ade80";
const red   = "#f87171";
const muted = "rgba(148,163,184,.5)";
const dim   = "rgba(148,163,184,.25)";

// Plain-English explanation for each entry/exit type
const ENTRY_PLAIN = {
  ema_cross_above: (e) => `Trend line (${e.fast}-day fast) rises above trend line (${e.slow}-day slow)`,
  sma_cross_above: (e) => `Short avg (${e.fast} days) rises above long avg (${e.slow} days)`,
  rsi_below:       (e) => `Stock looks oversold — momentum score drops below ${e.threshold ?? 30}/100`,
  price_above_ema: (e) => `Price jumps above the ${e.period}-day trend line`,
  price_above_sma: (e) => `Price jumps above the ${e.period}-day average`,
};
const EXIT_PLAIN = {
  ema_cross_below: (e) => `Trend line (${e.fast}-day) drops back below trend line (${e.slow}-day)`,
  sma_cross_below: (e) => `Short avg (${e.fast} days) drops below long avg (${e.slow} days)`,
  rsi_above:       (e) => `Stock looks overbought — momentum score rises above ${e.threshold ?? 70}/100`,
  price_below_ema: (e) => `Price drops below the ${e.period}-day trend line`,
  price_below_sma: (e) => `Price drops below the ${e.period}-day average`,
  stop_loss:       ()  => `Automatic exit to limit your loss`,
  take_profit:     ()  => `Automatic exit to lock in your profit`,
};

function MetricBox({ label, hint, value, color, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "10px 14px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: color || "#f1f5f9", fontFamily: "'DM Serif Display',serif" }}>{value}</span>
      <span style={{ fontSize: 9, color: "#e2e8f0", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 9, color: dim, lineHeight: 1.4 }}>{hint}</span>
      {sub && <span style={{ fontSize: 9, color: muted }}>{sub}</span>}
    </div>
  );
}

function MiniEquityCurve({ equity }) {
  if (!equity || equity.length < 2) return null;
  const W = 300, H = 52;
  const mn = Math.min(...equity), mx = Math.max(...equity), rng = mx - mn || 1;
  const pts = equity.map((v, i) =>
    `${(i / (equity.length - 1)) * W},${H - ((v - mn) / rng) * (H - 6) - 3}`
  ).join(" ");
  const isUp = equity.at(-1) >= equity[0];
  const col  = isUp ? green : red;
  const areaPath = `M 0 ${H} L ${pts.split(" ").join(" L ")} L ${W} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity=".2" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#btGrad)" />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function BacktestCard({ spec, result, sym }) {
  if (!result) return null;

  const { totalReturn, sharpe, winRate, maxDrawdown, totalTrades, avgWin, avgLoss, equity, trades } = result;
  const isUp = totalReturn >= 0;

  const entryPlain = (ENTRY_PLAIN[spec.entry?.type] || (() => spec.entry?.type))(spec.entry || {});
  const exitPlain  = (EXIT_PLAIN[spec.exit?.type]  || (() => spec.exit?.type))(spec.exit  || {});

  // Simple plain-English summary sentence
  const summary = totalTrades === 0
    ? "No signals fired on this data — try different settings."
    : isUp
    ? `This strategy would have turned $100,000 into $${Math.round(result.finalCapital / 1000)}k over 3 months.`
    : `This strategy would have lost $${Math.round(Math.abs(result.finalCapital - 100000) / 1000)}k on a $100k account over 3 months.`;

  return (
    <Glass style={{ borderRadius: 16, overflow: "hidden", marginTop: 8 }}>

      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>
            Backtest Complete · {sym}
          </div>
          <div style={{ fontSize: 10, color: muted, marginTop: 3 }}>{summary}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: isUp ? green : red, fontFamily: "'DM Serif Display',serif" }}>
            {isUp ? "+" : ""}{totalReturn}%
          </div>
          <div style={{ fontSize: 9, color: muted }}>total return</div>
        </div>
      </div>

      {/* Equity curve — "how your money moved over time" */}
      <div style={{ padding: "10px 16px 4px" }}>
        <div style={{ fontSize: 9, color: dim, marginBottom: 4 }}>How your $100k would have moved over time</div>
        <MiniEquityCurve equity={equity} />
      </div>

      {/* Metrics — plain English labels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "8px 12px 12px" }}>
        <MetricBox
          label="Money made/lost"
          hint="vs your starting $100k"
          value={`${isUp ? "+" : ""}${totalReturn}%`}
          color={isUp ? green : red}
        />
        <MetricBox
          label="Trades that won"
          hint={`out of ${totalTrades} total trades`}
          value={`${winRate}%`}
          color={winRate >= 50 ? green : red}
        />
        <MetricBox
          label="Biggest losing streak"
          hint="max drop from peak before recovering"
          value={`−${maxDrawdown}%`}
          color={maxDrawdown < 10 ? green : maxDrawdown < 20 ? "#fbbf24" : red}
        />
        <MetricBox
          label="Avg winning trade"
          hint="when it worked, you gained"
          value={`+${avgWin}%`}
          color={green}
        />
        <MetricBox
          label="Avg losing trade"
          hint="when it didn't work, you lost"
          value={`${avgLoss}%`}
          color={red}
        />
        <MetricBox
          label="Risk-adjusted score"
          hint="above 1 = good, below 0 = risky"
          value={sharpe}
          color={sharpe >= 1 ? green : sharpe >= 0 ? "#fbbf24" : red}
        />
      </div>

      {/* Strategy rules in plain English */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "12px 16px" }}>
        <div style={{ fontSize: 10, color: muted, letterSpacing: ".07em", marginBottom: 10, textTransform: "uppercase" }}>What the strategy does</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, color: green, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>BUY when</span>
            <span style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.5 }}>{entryPlain}</span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 10, color: red, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>SELL when</span>
            <span style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.5 }}>{exitPlain}</span>
          </div>
          {spec.stopLoss && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>PROTECT</span>
              <span style={{ fontSize: 11, color: "#e2e8f0" }}>Auto-sell if price drops {(spec.stopLoss * 100).toFixed(0)}% from your buy price (to limit losses)</span>
            </div>
          )}
          {spec.takeProfit && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10, color: green, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>LOCK IN</span>
              <span style={{ fontSize: 11, color: "#e2e8f0" }}>Auto-sell if price rises {(spec.takeProfit * 100).toFixed(0)}% (to lock in profit)</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      {trades.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "10px 16px" }}>
          <div style={{ fontSize: 10, color: muted, letterSpacing: ".07em", marginBottom: 8, textTransform: "uppercase" }}>Last 3 trades</div>
          {trades.slice(-3).reverse().map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: dim }}>{t.entryDate} → {t.exitDate}</span>
              <span style={{ color: t.pnl >= 0 ? green : red, fontWeight: 600 }}>
                {t.pnl >= 0 ? "Won " : "Lost "}{Math.abs(t.pnlPct).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "8px 16px", fontSize: 9, color: dim, borderTop: "1px solid rgba(255,255,255,.04)" }}>
        Paper trading only · Past results don't guarantee future profits
      </div>
    </Glass>
  );
}
