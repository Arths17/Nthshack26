import { useState, useCallback, useRef } from "react";
import { askClaude } from "../api/gemini";
import { f2, fB, fV, sma } from "../utils/formatters";
import { runBacktest } from "../utils/backtest";

const WELCOME = "Hi, I'm Quanta — your AI trading assistant powered by live Yahoo Finance data.\n\nAsk me to analyze any stock, explain a price move, give a buy/sell verdict, or build a strategy.";

// Detect if the user is describing a tradeable strategy
const STRATEGY_KEYWORDS = /\b(when|ema|sma|rsi|cross|crosses|above|below|buy when|sell when|strategy|backtest|moving average|oversold|overbought)\b/i;
const isStrategyRequest = (text) => STRATEGY_KEYWORDS.test(text) &&
  /\b(buy|sell|entry|exit|long|short)\b/i.test(text);

export function useChat(sym, data, cash, pos) {
  const [msgs,  setMsgs] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy,  setBusy]  = useState(false);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const buildSystemPrompt = useCallback(() => {
    if (!data) return "You are Quanta AI, a professional trading assistant.";

    const { price, prevClose, dayHigh, dayLow, volume, marketCap, pe, w52h, w52l, name, sector, candles } = data;
    const chg     = price - prevClose;
    const chgPct  = ((chg / prevClose) * 100).toFixed(2);
    const t7      = candles.length >= 7  ? ((price - candles.at(-7).close)  / candles.at(-7).close  * 100).toFixed(1) : "N/A";
    const t30     = candles.length >= 30 ? ((price - candles.at(-30).close) / candles.at(-30).close * 100).toFixed(1) : "N/A";
    const t90     = candles.length >= 60 ? ((price - candles.at(-60).close) / candles.at(-60).close * 100).toFixed(1) : "N/A";
    const recent  = candles.slice(-20).map(c => `${c.date}:$${f2(c.close)}`).join(", ");

    const sma20arr = sma(candles, 20);
    const sma50arr = sma(candles, 50);
    const sma20    = sma20arr.at(-1)?.toFixed(2) ?? "N/A";
    const sma50    = sma50arr.at(-1)?.toFixed(2) ?? "N/A";
    const aboveSma20 = sma20arr.at(-1) != null ? price > sma20arr.at(-1) : null;
    const aboveSma50 = sma50arr.at(-1) != null ? price > sma50arr.at(-1) : null;

    const last14   = candles.slice(-14);
    const avgRange = last14.length ? (last14.reduce((s, c) => s + (c.high - c.low), 0) / last14.length).toFixed(2) : "N/A";
    const userShares = pos[sym] || 0;

    return `You are Quanta AI, a sharp professional trading analyst. You have LIVE market data. Be concise, specific, cite exact numbers. No fluff.

═══ LIVE DATA: ${sym} (${name}) ═══
Sector: ${sector}
Price: $${f2(price)} | Change today: ${chg >= 0 ? "+" : ""}${f2(chg)} (${chgPct}%)
Day range: $${f2(dayLow)} – $${f2(dayHigh)} | Avg daily range (14d): $${avgRange}
52-week: $${f2(w52l)} – $${f2(w52h)} | Position in 52w range: ${(((price - w52l) / (w52h - w52l)) * 100).toFixed(0)}%
Market cap: ${fB(marketCap)} | P/E: ${pe?.toFixed(1) ?? "N/A"} | Volume: ${fV(volume)}
Performance: 7d ${t7}% | 30d ${t30}% | 60d ${t90}%
SMA20: $${sma20} (price ${aboveSma20 === null ? "unknown" : aboveSma20 ? "ABOVE ▲" : "BELOW ▼"})
SMA50: $${sma50} (price ${aboveSma50 === null ? "unknown" : aboveSma50 ? "ABOVE ▲" : "BELOW ▼"})
Recent closes: ${recent}

═══ PORTFOLIO ═══
Cash: $${f2(cash)} | ${sym} position: ${userShares} shares ($${f2(userShares * price)})

═══ RULES ═══
- Your audience is BEGINNERS who do not know finance. Write like you're texting a smart friend, not writing a report.
- NEVER use jargon without immediately explaining it in plain English in parentheses. Example: "The EMA (a line that smooths out price changes to show the trend)"
- Start with **VERDICT: BUY** / **VERDICT: HOLD** / **VERDICT: SELL** then explain WHY in plain English.
- For strategies: include **Entry:** **Target:** **Stop-loss (the price where you'd cut your loss):** **Time horizon:** **Risk (how much of your cash to use):**
- Avoid: "bullish momentum", "bearish divergence", "consolidation", "resistance levels" — use plain equivalents like "price is going up", "price keeps falling", "price is stuck sideways", "price keeps bouncing off $X"
- Use **bold** for the most important numbers. 3 short paragraphs max. Conversational tone.
- This is educational paper trading — be encouraging and clear.`;
  }, [data, cash, pos, sym]);

  const send = useCallback(async (text) => {
    const txt = (typeof text === "string" ? text : input).trim();
    if (!txt || busy) return;

    setInput("");
    setMsgs(m => [...m, { role: "user", content: txt }]);
    setBusy(true);

    try {
      // If it looks like a strategy, also run the backtester
      if (isStrategyRequest(txt) && data?.candles?.length) {
        // 1. Ask Gemini to parse the strategy into JSON
        let strategySpec = null;
        let backtestResult = null;

        try {
          const parseRes = await fetch("/api/strategy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: txt }),
          });
          if (parseRes.ok) {
            strategySpec = await parseRes.json();
            backtestResult = runBacktest(data.candles, strategySpec);
          }
        } catch (e) {
          console.warn("Strategy parse failed:", e);
        }

        // 2. Get the AI commentary
        const history = msgsRef.current.slice(-6).map(m => ({ role: m.role, content: m.content }));
        const backtestContext = backtestResult
          ? `\n\nA backtest was run on this strategy using ${backtestResult.bars} daily candles of ${sym}:
Total Return: ${backtestResult.totalReturn}% | Sharpe: ${backtestResult.sharpe} | Win Rate: ${backtestResult.winRate}% | Max Drawdown: ${backtestResult.maxDrawdown}% | Trades: ${backtestResult.totalTrades}
Comment on these results and whether to use this strategy on ${sym} given current market conditions.`
          : "";

        const reply = await askClaude(
          [...history, { role: "user", content: txt + backtestContext }],
          buildSystemPrompt()
        );

        setMsgs(m => [...m, {
          role: "assistant",
          content: reply,
          backtestResult,
          strategySpec,
          sym,
        }]);
      } else {
        // Normal analysis / Q&A
        const history = msgsRef.current.slice(-8).map(m => ({ role: m.role, content: m.content }));
        const reply = await askClaude(
          [...history, { role: "user", content: txt }],
          buildSystemPrompt()
        );
        setMsgs(m => [...m, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      console.error(e);
      setMsgs(m => [...m, { role: "assistant", content: "Connection error — check that the backend server is running on port 8000." }]);
    }

    setBusy(false);
  }, [input, busy, buildSystemPrompt, data, sym]);

  return { msgs, input, setInput, busy, send };
}
