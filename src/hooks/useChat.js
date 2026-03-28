import { useState, useCallback } from "react";
import { askClaude } from "../api/gemini";
import { f2, fB, fV } from "../utils/formatters";

const WELCOME = "Hi, I'm Quanta — your AI trading assistant powered by live Yahoo Finance data.\n\nAsk me to analyze any stock, explain a price move, give a buy/sell verdict, or build a strategy.";

export function useChat(sym, data, cash, pos) {
  const [msgs,  setMsgs] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy,  setBusy]  = useState(false);

  const buildSystemPrompt = useCallback(() => {
    if (!data) return "You are Quanta AI, a professional trading assistant.";
    const { price, prevClose, dayHigh, dayLow, volume, marketCap, pe, w52h, w52l, name, sector, candles } = data;
    const chg    = price - prevClose;
    const chgPct = ((chg / prevClose) * 100).toFixed(2);
    const t30    = candles.length >= 30
      ? ((price - candles.at(-30).close) / candles.at(-30).close * 100).toFixed(1)
      : "N/A";
    const recent = candles.slice(-14).map(c => `${c.date}:$${f2(c.close)}`).join(", ");
    return `You are Quanta AI, a sharp trading intelligence assistant with LIVE Yahoo Finance data.

LIVE DATA — ${sym} (${name}, ${sector}):
• Price: $${f2(price)} | Change: ${chg >= 0 ? "+" : ""}${f2(chg)} (${chgPct}%)
• Day range: $${f2(dayLow)} – $${f2(dayHigh)}
• 52-week range: $${f2(w52l)} – $${f2(w52h)}
• Market cap: ${fB(marketCap)} | P/E: ${pe?.toFixed(1) ?? "N/A"} | Volume: ${fV(volume)}
• 30-day performance: ${t30}%
• Recent closes: ${recent}
• User holds: ${pos[sym] || 0} shares of ${sym} | Cash: $${f2(cash)}

Be direct, cite SPECIFIC NUMBERS. Max 3 short paragraphs. Give clear BUY / HOLD / SELL verdicts. Plain text, no markdown. This is educational paper trading.`;
  }, [data, cash, pos, sym]);

  const send = useCallback(async (text) => {
    const txt = text ?? input;
    if (!txt.trim() || busy) return;
    setInput("");
    setMsgs(m => [...m, { role: "user", content: txt }]);
    setBusy(true);
    try {
      const hist  = msgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const reply = await askClaude([...hist, { role: "user", content: txt }], buildSystemPrompt());
      setMsgs(m => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Network error. Please retry." }]);
    }
    setBusy(false);
  }, [input, busy, msgs, buildSystemPrompt]);

  return { msgs, input, setInput, busy, send };
}
