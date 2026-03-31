import { useState, useEffect } from "react";
import Glass from "../components/Glass";
import { f2 } from "../utils/formatters";

const muted = "rgba(148,163,184,.5)";
const dim   = "rgba(148,163,184,.25)";
const green = "#4ade80";
const red   = "#f87171";
const blue  = "#4facfe";

const STARTER_STRATEGIES = [
  {
    id: "starter_ema",
    name: "EMA Crossover",
    desc: "Buy when the fast trend line (12-day) crosses above the slow one (26-day). Sell when it crosses back below.",
    spec: { entry: { type: "ema_cross_above", fast: 12, slow: 26 }, exit: { type: "ema_cross_below", fast: 12, slow: 26 }, stopLoss: null, takeProfit: null },
    tags: ["Trend", "Beginner"],
    starter: true,
  },
  {
    id: "starter_rsi",
    name: "RSI Bounce",
    desc: "Buy when the stock is oversold (RSI drops below 30 — meaning it may have fallen too far). Sell when overbought (RSI above 70).",
    spec: { entry: { type: "rsi_below", threshold: 30 }, exit: { type: "rsi_above", threshold: 70 }, stopLoss: 0.05, takeProfit: null },
    tags: ["Momentum", "Beginner"],
    starter: true,
  },
  {
    id: "starter_sma50",
    name: "SMA50 Breakout",
    desc: "Buy when price climbs above its 50-day average (shows the trend has turned up). Sell with a 7% stop-loss.",
    spec: { entry: { type: "price_above_sma", period: 50 }, exit: { type: "stop_loss" }, stopLoss: 0.07, takeProfit: 0.15 },
    tags: ["Trend", "Breakout"],
    starter: true,
  },
];

function MetricBadge({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || "#e2e8f0" }}>{value}</div>
      <div style={{ fontSize: 9, color: dim, marginTop: 2, letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function StrategyCard({ strategy, onRun, onDelete }) {
  const r = strategy.lastResult;
  const isGood = r && parseFloat(r.totalReturn) > 0;

  return (
    <Glass hoverable style={{ borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{strategy.name}</span>
              {strategy.starter && (
                <span style={{ fontSize: 9, color: blue, background: "rgba(79,172,254,.1)", padding: "1px 7px", borderRadius: 6, fontWeight: 600, letterSpacing: ".04em" }}>STARTER</span>
              )}
            </div>
            <div style={{ fontSize: 11, color: muted, lineHeight: 1.6 }}>{strategy.desc}</div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(strategy.tags || []).map(t => (
            <span key={t} style={{ fontSize: 10, color: "rgba(148,163,184,.45)", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", padding: "2px 8px", borderRadius: 6 }}>{t}</span>
          ))}
          {strategy.sym && <span style={{ fontSize: 10, color: blue, background: "rgba(79,172,254,.08)", padding: "2px 8px", borderRadius: 6 }}>{strategy.sym}</span>}
        </div>

        {/* Last backtest result */}
        {r ? (
          <div style={{ background: isGood ? "rgba(74,222,128,.05)" : "rgba(248,113,113,.05)", border: `1px solid ${isGood ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)"}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: muted, marginBottom: 8, letterSpacing: ".05em" }}>LAST BACKTEST · {strategy.lastSym || "—"}</div>
            <div style={{ display: "flex", gap: 0 }}>
              <MetricBadge label="Return" value={`${r.totalReturn > 0 ? "+" : ""}${r.totalReturn}%`} color={isGood ? green : red} />
              <MetricBadge label="Win Rate" value={`${r.winRate}%`} color={parseFloat(r.winRate) > 50 ? green : muted} />
              <MetricBadge label="Trades" value={r.totalTrades} />
              <MetricBadge label="Drawdown" value={`${r.maxDrawdown}%`} color={parseFloat(r.maxDrawdown) > 20 ? red : muted} />
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, textAlign: "center" }}>
            <span style={{ fontSize: 11, color: dim }}>No backtest run yet — chat with Quanta AI to test this strategy</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onRun(strategy)} style={{
            flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.15))",
            border: "1px solid rgba(79,172,254,.25)", color: blue, transition: "all .2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "linear-gradient(135deg,rgba(79,172,254,.25),rgba(167,139,250,.25))"}
            onMouseLeave={e => e.currentTarget.style.background = "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.15))"}>
            Ask AI to run this
          </button>
          {!strategy.starter && (
            <button onClick={() => onDelete(strategy.id)} style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer", background: "rgba(248,113,113,.06)", border: "1px solid rgba(248,113,113,.15)", color: red, transition: "all .2s" }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </Glass>
  );
}

export default function StrategyLibrary({ onSendToChat }) {
  const [strategies, setStrategies] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("quanta:strategies") || "[]");
      return [...STARTER_STRATEGIES, ...saved];
    } catch {
      return STARTER_STRATEGIES;
    }
  });

  // Listen for new strategies saved from chat
  useEffect(() => {
    function handleSave(e) {
      const strat = e.detail;
      setStrategies(prev => {
        const withoutDupe = prev.filter(s => s.id !== strat.id);
        const updated = [...withoutDupe, strat];
        const userOnly = updated.filter(s => !s.starter);
        localStorage.setItem("quanta:strategies", JSON.stringify(userOnly));
        return updated;
      });
    }
    window.addEventListener("quanta:saveStrategy", handleSave);
    return () => window.removeEventListener("quanta:saveStrategy", handleSave);
  }, []);

  function handleDelete(id) {
    setStrategies(prev => {
      const updated = prev.filter(s => s.id !== id);
      const userOnly = updated.filter(s => !s.starter);
      localStorage.setItem("quanta:strategies", JSON.stringify(userOnly));
      return updated;
    });
  }

  function handleRun(strategy) {
    const prompt = strategy.spec
      ? `Run a backtest on the "${strategy.name}" strategy: ${strategy.desc}`
      : `Tell me about the "${strategy.name}" strategy and run a backtest on it.`;
    onSendToChat?.(prompt);
  }

  const userStrategies = strategies.filter(s => !s.starter);
  const starterStrategies = strategies.filter(s => s.starter);

  return (
    <div className="q-page-scroll q-page-in">

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Strategy library</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
            {userStrategies.length} saved · strategies are tested via the AI chat
          </div>
        </div>
        <div style={{ fontSize: 10, color: dim, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "6px 12px" }}>
          Tip: say "save this strategy" in chat to add it here
        </div>
      </div>

      {/* User strategies */}
      {userStrategies.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: muted, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Your Strategies</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {userStrategies.map(s => (
              <StrategyCard key={s.id} strategy={s} onRun={handleRun} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Starter strategies */}
      <div>
        <div style={{ fontSize: 10, color: muted, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Starter Strategies</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {starterStrategies.map(s => (
            <StrategyCard key={s.id} strategy={s} onRun={handleRun} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}
