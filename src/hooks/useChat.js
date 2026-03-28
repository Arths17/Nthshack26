import { useState, useCallback, useRef } from "react";
import { askClaude } from "../api/gemini";
import { f2, fB, fV, sma } from "../utils/formatters";

const WELCOME = "Hi, I'm Quanta — your AI trading assistant powered by live Yahoo Finance data.\n\nAsk me to analyze any stock, explain a price move, give a buy/sell verdict, or build a strategy.";

export function useChat(sym, data, cash, pos) {
  const [msgs,  setMsgs] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy,  setBusy]  = useState(false);
  // Keep a ref to latest msgs so send() never has a stale closure
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

    // Compute moving averages for context
    const sma20arr = sma(candles, 20);
    const sma50arr = sma(candles, 50);
    const sma20    = sma20arr.at(-1)?.toFixed(2) ?? "N/A";
    const sma50    = sma50arr.at(-1)?.toFixed(2) ?? "N/A";
    const aboveSma20 = sma20arr.at(-1) ? price > sma20arr.at(-1) : null;
    const aboveSma50 = sma50arr.at(-1) ? price > sma50arr.at(-1) : null;

    // Volatility: avg daily range over last 14 days
    const last14 = candles.slice(-14);
    const avgRange = last14.length
      ? (last14.reduce((s, c) => s + (c.high - c.low), 0) / last14.length).toFixed(2)
      : "N/A";

    const userShares = pos[sym] || 0;
    const posValue   = userShares * price;

    return `You are Quanta AI, a sharp professional trading analyst. You have LIVE market data below. Be concise, specific, and cite exact numbers. No fluff.

═══ LIVE DATA: ${sym} (${name}) ═══
Sector: ${sector}
Price: $${f2(price)} | Change today: ${chg >= 0 ? "+" : ""}${f2(chg)} (${chgPct}%)
Day range: $${f2(dayLow)} – $${f2(dayHigh)} | Avg daily range (14d): $${avgRange}
52-week: $${f2(w52l)} – $${f2(w52h)} | Position in 52w range: ${(((price - w52l) / (w52h - w52l)) * 100).toFixed(0)}%
Market cap: ${fB(marketCap)} | P/E: ${pe?.toFixed(1) ?? "N/A"} | Volume: ${fV(volume)}

Performance: 7d ${t7}% | 30d ${t30}% | 60d ${t90}%
SMA20: $${sma20} (price is ${aboveSma20 === null ? "unknown" : aboveSma20 ? "ABOVE ▲" : "BELOW ▼"})
SMA50: $${sma50} (price is ${aboveSma50 === null ? "unknown" : aboveSma50 ? "ABOVE ▲" : "BELOW ▼"})

Recent 20 closes: ${recent}

═══ USER PORTFOLIO ═══
Cash available: $${f2(cash)}
${sym} position: ${userShares} shares ($${f2(posValue)})
${userShares > 0 ? `Can sell up to ${userShares} shares` : "No position in this stock"}

═══ RESPONSE RULES ═══
- Start every response with **VERDICT: BUY** / **VERDICT: HOLD** / **VERDICT: SELL**
- For strategy requests: include **Entry:** **Target:** **Stop-loss:** **Time horizon:** **Position size:**
- Cite the exact numbers from the data above — never be vague or generic
- Use **bold** for key numbers and verdicts. Keep it to 3 short paragraphs max
- This is educational paper trading — be direct and specific`;
  }, [data, cash, pos, sym]);

  const send = useCallback(async (text) => {
    // text can be: a suggestion string (from button), or undefined (from input box)
    const txt = (typeof text === "string" ? text : input).trim();
    if (!txt || busy) return;

    setInput("");
    setMsgs(m => [...m, { role: "user", content: txt }]);
    setBusy(true);

    try {
      const history = msgsRef.current
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await askClaude(
        [...history, { role: "user", content: txt }],
        buildSystemPrompt()
      );
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      setMsgs(m => [...m, { role: "assistant", content: "Connection error — check that the backend server is running on port 8000." }]);
    }

    setBusy(false);
  }, [input, busy, buildSystemPrompt]);

  return { msgs, input, setInput, busy, send };
}
