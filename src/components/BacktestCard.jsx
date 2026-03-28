import Glass from "./Glass";

const green  = "#4ade80";
const red    = "#f87171";
const muted  = "rgba(148,163,184,.5)";
const dim    = "rgba(148,163,184,.25)";

function MetricBox({ label, value, color, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 16px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,.06)" }}>
      <span style={{ fontSize: 9, color: muted, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: color || "#f1f5f9", fontFamily: "'DM Serif Display',serif" }}>{value}</span>
      {sub && <span style={{ fontSize: 10, color: dim }}>{sub}</span>}
    </div>
  );
}

function MiniEquityCurve({ equity }) {
  if (!equity || equity.length < 2) return null;
  const W = 300, H = 48;
  const mn = Math.min(...equity), mx = Math.max(...equity), rng = mx - mn || 1;
  const pts = equity.map((v, i) =>
    `${(i / (equity.length - 1)) * W},${H - ((v - mn) / rng) * (H - 4) - 2}`
  ).join(" ");
  const isUp = equity.at(-1) >= equity[0];
  const col  = isUp ? green : red;
  const areaPath = `M ${pts.split(" ").join(" L ")} L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H }}>
      <defs>
        <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity=".25" />
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

  const { totalReturn, sharpe, winRate, maxDrawdown, totalTrades, profitFactor, avgWin, avgLoss, equity, trades } = result;
  const isUp = totalReturn >= 0;

  const stratLabel = () => {
    const { entry, exit } = spec;
    const entryStr = {
      ema_cross_above: `EMA(${entry.fast}) crosses above EMA(${entry.slow})`,
      sma_cross_above: `SMA(${entry.fast}) crosses above SMA(${entry.slow})`,
      rsi_below:       `RSI(${entry.period ?? 14}) drops below ${entry.threshold ?? 30}`,
      price_above_ema: `Price crosses above EMA(${entry.period})`,
      price_above_sma: `Price crosses above SMA(${entry.period})`,
    }[entry.type] || entry.type;
    const exitStr = {
      ema_cross_below: `EMA(${exit.fast}) crosses below EMA(${exit.slow})`,
      sma_cross_below: `SMA(${exit.fast}) crosses below SMA(${exit.slow})`,
      rsi_above:       `RSI(${exit.period ?? 14}) rises above ${exit.threshold ?? 70}`,
      price_below_ema: `Price crosses below EMA(${exit.period})`,
      price_below_sma: `Price crosses below SMA(${exit.period})`,
      stop_loss:       `Stop-loss ${((spec.stopLoss || 0) * 100).toFixed(0)}%`,
      take_profit:     `Take-profit ${((spec.takeProfit || 0) * 100).toFixed(0)}%`,
    }[exit.type] || exit.type;
    return { entryStr, exitStr };
  };

  const { entryStr, exitStr } = stratLabel();

  return (
    <Glass style={{ borderRadius: 16, overflow: "hidden", marginTop: 4 }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>{spec.name || "Strategy Backtest"} — {sym}</div>
          <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>3-month backtest · {result.bars} daily candles</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: isUp ? green : red, fontFamily: "'DM Serif Display',serif" }}>
          {isUp ? "+" : ""}{totalReturn}%
        </div>
      </div>

      {/* Equity curve */}
      <div style={{ padding: "8px 16px 4px" }}>
        <MiniEquityCurve equity={equity} />
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "8px 12px 12px" }}>
        <MetricBox label="Total Return" value={`${isUp ? "+" : ""}${totalReturn}%`} color={isUp ? green : red} />
        <MetricBox label="Sharpe Ratio" value={sharpe} color={sharpe >= 1 ? green : sharpe >= 0 ? "#fbbf24" : red} />
        <MetricBox label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? green : red} sub={`${totalTrades} trades`} />
        <MetricBox label="Max Drawdown" value={`${maxDrawdown}%`} color={maxDrawdown < 10 ? green : maxDrawdown < 20 ? "#fbbf24" : red} />
        <MetricBox label="Avg Win" value={`+${avgWin}%`} color={green} />
        <MetricBox label="Avg Loss" value={`${avgLoss}%`} color={red} />
      </div>

      {/* Strategy summary */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "10px 16px" }}>
        <div style={{ fontSize: 10, color: muted, letterSpacing: ".07em", marginBottom: 8, textTransform: "uppercase" }}>Strategy Rules</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[
            ["Entry", entryStr, green],
            ["Exit",  exitStr, red],
            ...(spec.stopLoss   ? [["Stop-loss",    `${(spec.stopLoss * 100).toFixed(0)}%`, "#fbbf24"]] : []),
            ...(spec.takeProfit ? [["Take-profit",  `${(spec.takeProfit * 100).toFixed(0)}%`, green]] : []),
          ].map(([label, val, col]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: muted }}>{label}</span>
              <span style={{ color: col, fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last 3 trades */}
      {trades.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: "10px 16px" }}>
          <div style={{ fontSize: 10, color: muted, letterSpacing: ".07em", marginBottom: 8, textTransform: "uppercase" }}>Recent Trades</div>
          {trades.slice(-3).reverse().map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: dim }}>{t.entryDate} → {t.exitDate}</span>
              <span style={{ color: t.pnl >= 0 ? green : red, fontWeight: 600 }}>
                {t.pnl >= 0 ? "+" : ""}{t.pnlPct.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "8px 16px", fontSize: 9, color: dim, borderTop: "1px solid rgba(255,255,255,.04)" }}>
        Educational paper trading only · Past performance does not guarantee future results
      </div>
    </Glass>
  );
}
