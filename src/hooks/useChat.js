import { useState, useCallback, useRef } from "react";
import { askClaude } from "../api/gemini";
import { fetchYF } from "../api/yahoo";
import { f2, fB, fV, sma } from "../utils/formatters";
import { runBacktest } from "../utils/backtest";
import { getApiBase } from "../utils/apiBase";
import { API_ROUTE_PREFIX } from "../utils/constants";
import { devWarn } from "../utils/logger";

const WELCOME = "Hi, I'm Quanta — your AI trading assistant powered by live Yahoo Finance data.\n\nAsk me to analyze any stock, explain a price move, give a buy/sell verdict, or build a strategy.";

// Detect if the user is describing a tradeable strategy
const STRATEGY_KEYWORDS = /\b(when|ema|sma|rsi|cross|crosses|above|below|buy when|sell when|strategy|backtest|moving average|oversold|overbought)\b/i;
const isStrategyRequest = (text) => STRATEGY_KEYWORDS.test(text) &&
  /\b(buy|sell|entry|exit|long|short)\b/i.test(text);

const TICKER_STOP_WORDS = new Set([
  "A", "I", "THE", "AND", "OR", "IF", "IS", "ON", "TO", "UP", "BY", "AT", "BE", "IT", "AS",
  "THIS", "THAT", "WITH", "FOR", "YOU", "NOT", "BUT", "FROM", "CAN", "DO", "GET", "GO", "HAS",
  "HE", "IN", "NO", "SO", "US", "WE", "MY", "ME", "VS", "WHAT", "WHO", "WHY", "HOW", "WHEN",
  "WHERE", "WHICH", "AM", "AN", "ARE", "OF", "THAN", "THEN", "THEY", "THEM", "THEIR", "THESE",
  "THOSE", "ABOUT", "AFTER", "BEFORE", "BETWEEN", "DURING", "UNTIL", "SINCE", "THROUGH", "INTO",
  "OVER", "UNDER", "ABOVE", "BELOW", "OUT", "SUCH", "OUR", "ALL", "EACH", "EVERY", "FEW", "MORE",
  "MOST", "OTHER", "SOME", "ANY", "BEEN", "HAVE", "DOES", "DID", "WILL", "WOULD", "COULD", "SHOULD",
  "MUST", "MAY", "MIGHT", "SHALL", "BUY", "SELL", "LONG", "SHORT", "CALL", "PUT", "BULL", "BEAR",
  "RISK", "GAIN", "LOSS", "STOP", "TAKE", "PROFIT", "MARGIN", "PRICE", "RATE", "TERM", "YEAR",
  "MONTH", "WEEK", "DAY", "OPEN", "CLOSE", "HIGH", "LOW", "VOLUME", "TRADE", "ORDER", "FILL", "CHART",
]);

function extractRequestedTickers(text, currentSym) {
  const upper = String(text || "").toUpperCase();
  const matches = [...upper.matchAll(/\$?([A-Z]{1,5})\b/g)].map((m) => m[1]);
  const unique = [];
  for (const token of matches) {
    if (TICKER_STOP_WORDS.has(token)) continue;
    if (!unique.includes(token)) unique.push(token);
    if (unique.length >= 8) break;
  }
  if (currentSym && !unique.includes(currentSym)) unique.unshift(currentSym);
  return unique.slice(0, 8);
}

/**
 * Chat hook for AI trading assistant
 * @param {string} sym - Current stock symbol
 * @param {object} data - Stock data from useStockData
 * @param {object} watch - Watchlist data from useWatchlist
 * @param {number} cash - Available cash from usePortfolio
 * @param {object} pos - Positions from usePortfolio
 * @returns {object} { msgs, input, setInput, busy, send }
 */
export function useChat(sym, data, watch, cash, pos) {
  const [msgs, setMsgs] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  const buildSystemPrompt = useCallback(() => {
    if (!data) return "You are Quanta AI, a professional trading assistant.";

    const { price, prevClose, dayHigh, dayLow, volume, marketCap, pe, w52h, w52l, name, sector, candles } = data;
    const chg     = price - prevClose;
    const chgPct  = ((chg / prevClose) * 100).toFixed(2);
    const t7      = candles.length >= 7  ? ((price - candles.at(-7).close)  / candles.at(-7).close  * 100).toFixed(1) : "N/A";
    const t30     = candles.length >= 30 ? ((price - candles.at(-30).close) / candles.at(-30).close * 100).toFixed(1) : "N/A";
    const t90     = candles.length >= 90 ? ((price - candles.at(-90).close) / candles.at(-90).close * 100).toFixed(1) : "N/A";
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
    const userValue  = userShares * price;
    const allPositions = Object.entries(pos).filter(([, q]) => q > 0);
    const totalInvested = allPositions.reduce((s, [k, q]) => s + q * (watch[k]?.price || 0), 0);
    const portfolioTotal = cash + totalInvested;
    const portfolioPnl = portfolioTotal - 100_000;

    // Build a plain-English description of what the user owns
    const positionContext = allPositions.length === 0
      ? "No open positions yet — still holding all $100,000 in cash."
      : allPositions.map(([k, q]) => {
          const p = watch[k]?.price || 0;
          const val = q * p;
          const pct = (val / portfolioTotal * 100).toFixed(0);
          return `${k}: ${q} shares @ $${f2(p)} = $${f2(val)} (${pct}% of portfolio)`;
        }).join("\n");

    const symPositionAdvice = userShares > 0
      ? `⚠️ USER ALREADY OWNS ${userShares} shares of ${sym} worth $${f2(userValue)}. When giving advice, acknowledge this position. If suggesting to buy more, say "you already own X shares — adding more increases your risk." If suggesting to sell, be specific: "you could sell all ${userShares} shares" or "consider selling half (${Math.floor(userShares/2)} shares)."`
      : `User has NO position in ${sym} yet. They can afford ${Math.floor(cash / price)} shares at current price.`;

    return `You are Quanta AI, a sharp professional trading analyst. You have LIVE market data AND the user's full portfolio. Be concise, specific, cite exact numbers. No fluff.

═══ LIVE DATA: ${sym} (${name}) ═══
Sector: ${sector}
Price: $${f2(price)} | Change today: ${chg >= 0 ? "+" : ""}${f2(chg)} (${chgPct}%)
Day range: $${f2(dayLow)} – $${f2(dayHigh)} | Avg daily range (14d): $${avgRange}
52-week: $${f2(w52l)} – $${f2(w52h)} | Position in 52w range: ${(((price - w52l) / (w52h - w52l)) * 100).toFixed(0)}%
Market cap: ${fB(marketCap)} | P/E: ${pe?.toFixed(1) ?? "N/A"} | Volume: ${fV(volume)}
Performance: 7d ${t7}% | 30d ${t30}% | 90d ${t90}%
SMA20: $${sma20} (price ${aboveSma20 === null ? "unknown" : aboveSma20 ? "ABOVE ▲" : "BELOW ▼"})
SMA50: $${sma50} (price ${aboveSma50 === null ? "unknown" : aboveSma50 ? "ABOVE ▲" : "BELOW ▼"})
Recent closes: ${recent}

═══ USER'S PORTFOLIO (CRITICAL — use this to personalize advice) ═══
Cash available: $${f2(cash)} | Total portfolio: $${f2(portfolioTotal)} | P&L: ${portfolioPnl >= 0 ? "+" : ""}$${f2(Math.abs(portfolioPnl))}
${symPositionAdvice}

All open positions:
${positionContext}

═══ ALL WATCHLIST STOCKS ═══
${Object.entries(watch).map(([s, d]) => {
  const chg = d.price && d.prevClose ? ((d.price - d.prevClose) / d.prevClose * 100).toFixed(2) : "N/A";
  return `${s}: $${f2(d.price)} (${chg}% today) | MCap: ${fB(d.marketCap)} | P/E: ${d.pe?.toFixed(1) ?? "N/A"}`;
}).join("\n")}

═══ RULES ═══
- Your audience is BEGINNERS. Write like you're texting a smart friend, not writing a report.
- ALWAYS personalize to their portfolio. If they own the stock, say so and what it means for them. If they don't, tell them how many shares they could afford.
- NEVER use jargon without explaining it. Example: "The SMA (the average price over 20 days — it shows the trend)"
- Start with **VERDICT: BUY** / **VERDICT: HOLD** / **VERDICT: SELL** then explain WHY in plain English.
- For buy/sell advice: always give a specific share count based on their cash, e.g. "you could buy 10 shares for $1,670"
- For strategies: include **Entry:** **Target:** **Stop-loss:** **Time horizon:** **Risk:**
- Use **bold** for the most important numbers. 3 short paragraphs max. Conversational tone.
- This is educational paper trading — be encouraging and clear.`;
  }, [data, cash, pos, sym]);

  const buildRequestedStockContext = useCallback(async (text) => {
    const tickers = extractRequestedTickers(text, sym);
    if (!tickers.length) return "";

    const rows = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const d = watch?.[ticker] || (await fetchYF(ticker, "3M"));
          if (!d) return null;
          const chg = d.price && d.prevClose ? ((d.price - d.prevClose) / d.prevClose) * 100 : null;
          return `${ticker}: $${f2(d.price)} (${chg == null ? "N/A" : `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`} today) | MCap: ${fB(d.marketCap)} | P/E: ${d.pe?.toFixed(1) ?? "N/A"} | Sector: ${d.sector || "N/A"}`;
        } catch {
          return null;
        }
      })
    );

    const valid = rows.filter(Boolean);
    if (!valid.length) return "";

    return `\n\nREQUESTED STOCK CONTEXT (use this for comparisons even if symbols are not in watchlist):\n${valid.join("\n")}`;
  }, [sym, watch]);

  const send = useCallback(async (text) => {
    const txt = (typeof text === "string" ? text : input).trim();
    if (!txt || busy) return;

    setInput("");
    setMsgs(m => [...m, { role: "user", content: txt }]);
    setBusy(true);

    try {
      // If it looks like a strategy, also run the backtester
      if (isStrategyRequest(txt) && data?.candles?.length) {
        const requestedContext = await buildRequestedStockContext(txt);
        // 1. Ask Gemini to parse the strategy into JSON
        let strategySpec = null;
        let backtestResult = null;

        try {
          const parseRes = await fetch(`${getApiBase()}${API_ROUTE_PREFIX}/strategy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: txt }),
          });
          if (parseRes.ok) {
            strategySpec = await parseRes.json();
            backtestResult = runBacktest(data.candles, strategySpec);
          }
        } catch (e) {
          devWarn("Strategy parse failed:", e);
        }

        // 2. Get the AI commentary
        const history = msgsRef.current.slice(-4).map(m => ({ role: m.role, content: m.content }));
        const backtestContext = backtestResult
          ? `\n\nA backtest was run on this strategy using ${backtestResult.bars} daily candles of ${sym}:
Total Return: ${backtestResult.totalReturn}% | Sharpe: ${backtestResult.sharpe} | Win Rate: ${backtestResult.winRate}% | Max Drawdown: ${backtestResult.maxDrawdown}% | Trades: ${backtestResult.totalTrades}
Comment on these results and whether to use this strategy on ${sym} given current market conditions.`
          : "";

        const reply = await askClaude(
          [...history, { role: "user", content: txt + requestedContext + backtestContext }],
          buildSystemPrompt(),
          sym
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
        const requestedContext = await buildRequestedStockContext(txt);
        const history = msgsRef.current.slice(-4).map(m => ({ role: m.role, content: m.content }));
        const reply = await askClaude(
          [...history, { role: "user", content: txt + requestedContext }],
          buildSystemPrompt(),
          sym
        );
        setMsgs(m => [...m, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      console.error("Chat error:", e);
      let errorMsg;
      if (e.message?.includes("fetch") || e.message?.includes("Failed to fetch") || e.message?.includes("NetworkError")) {
        errorMsg = "Connection error — make sure the backend server is running on port 8000.";
      } else if (e.message?.includes("GEMINI_API_KEY") || e.message?.includes("API_KEY")) {
        errorMsg = "API key not configured. Set GEMINI_API_KEY in your .env file and restart the server.";
      } else if (e.message) {
        errorMsg = `AI error: ${e.message}`;
      } else {
        errorMsg = "Failed to get response from AI. Try again in a moment.";
      }
      setMsgs(m => [...m, { role: "assistant", content: errorMsg }]);
    }

    setBusy(false);
  }, [input, busy, buildSystemPrompt, data, sym, buildRequestedStockContext]);

  return { msgs, input, setInput, busy, send };
}
