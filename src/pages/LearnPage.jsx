import { useState } from "react";
import Glass from "../components/Glass";

const muted = "rgba(148,163,184,.5)";
const dim   = "rgba(148,163,184,.25)";

const SECTIONS = [
  {
    title: "Stock Basics",
    color: "#4facfe",
    items: [
      {
        term: "Stock / Share",
        short: "A tiny piece of ownership in a company",
        explain: "When you buy one share of Apple, you literally own a small fraction of Apple Inc. If the company grows and becomes more valuable, your share is worth more.",
        example: "If Apple is worth $3 trillion and has 15 billion shares, each share = $200.",
      },
      {
        term: "Market Cap",
        short: "How much the whole company is worth",
        explain: "Market Cap = share price × total number of shares. It tells you the total size of the company. 'Large-cap' companies like Apple ($3T+) are safer but slower growing. 'Small-cap' companies are riskier but can grow faster.",
        example: "NVDA at $167 × 24.4B shares = ~$4T market cap.",
      },
      {
        term: "Volume",
        short: "How many shares were traded today",
        explain: "High volume means lots of people are buying and selling — the stock is 'active'. Low volume means it's quiet. A big price move on high volume is more meaningful than the same move on low volume.",
        example: "NVDA trading 194M shares on a down day = strong selling pressure, not just a blip.",
      },
      {
        term: "52-Week Range",
        short: "The highest and lowest price over the past year",
        explain: "This gives you context. If a stock is trading near its 52-week low, it might be cheap. Near its high, it might be expensive — or it might be on a strong run.",
        example: "NVDA 52W range: $86 – $153. At $167, it's above the yearly range — that's a strong stock.",
      },
      {
        term: "P/E Ratio",
        short: "How expensive the stock is vs. its profits",
        explain: "P/E = stock price ÷ earnings per share. A high P/E (e.g. 50+) means investors expect big future growth. A low P/E (e.g. 12) means the stock might be cheap — or the company is struggling. There's no 'right' P/E — it depends on the industry.",
        example: "Apple P/E of 28 = you're paying $28 for every $1 of annual profit.",
      },
    ],
  },
  {
    title: "Reading Charts",
    color: "#a78bfa",
    items: [
      {
        term: "Candlestick",
        short: "A bar that shows open, close, high and low for one time period",
        explain: "Each candle shows 4 prices: where the stock opened, where it closed, and the highest/lowest it reached. A green candle = price went UP that period. A red candle = price went DOWN.",
        example: "Open $100, High $108, Low $98, Close $105 → green candle.",
      },
      {
        term: "SMA (Simple Moving Average)",
        short: "The average price over the last N days",
        explain: "SMA20 = the average of the last 20 closing prices. It smooths out daily noise so you can see the trend. When price is above the SMA, the trend is up. Below it, the trend is down.",
        example: "If NVDA closed at different prices each day for 20 days, the SMA20 is just the average of those 20 closes.",
      },
      {
        term: "EMA (Exponential Moving Average)",
        short: "Like SMA but gives more weight to recent prices",
        explain: "EMA reacts faster to price changes than SMA because it weighs recent days more heavily. Traders use it to spot trend changes earlier. EMA(12) and EMA(26) together form the basis of the popular MACD indicator.",
        example: "If NVDA drops sharply today, the EMA moves down faster than the SMA.",
      },
      {
        term: "Support & Resistance",
        short: "Price levels where the stock tends to bounce or get stuck",
        explain: "Support is a price floor — the stock keeps bouncing off it when it falls. Resistance is a ceiling — the stock keeps stalling when it rises to that level. When a stock breaks through resistance, it often keeps going up.",
        example: "NVDA keeps bouncing around $160 → $160 is a support level.",
      },
    ],
  },
  {
    title: "Indicators",
    color: "#4ade80",
    items: [
      {
        term: "RSI (Relative Strength Index)",
        short: "A score from 0–100 showing if a stock is overbought or oversold",
        explain: "RSI measures how fast and how much the price has moved recently. Above 70 = overbought (might be due for a pullback). Below 30 = oversold (might be due for a bounce). It's a guide, not a guarantee.",
        example: "RSI of 25 on NVDA after a big drop → stock might be oversold, possible bounce coming.",
      },
      {
        term: "EMA Crossover",
        short: "When a fast trend line crosses a slow trend line",
        explain: "When the fast EMA (e.g. 12-day) crosses above the slow EMA (e.g. 26-day), it's a buy signal — the short-term trend is turning bullish. When it crosses back below, it's a sell signal. This is one of the most common strategies.",
        example: "EMA(12) crosses above EMA(26) on MSFT → strategy says buy.",
      },
      {
        term: "Volume Spike",
        short: "A sudden jump in how many shares are being traded",
        explain: "When price moves a lot AND volume spikes, it's a more significant move. A big price drop on huge volume = strong selling. A big price jump on huge volume = strong buying. Low volume moves are less reliable.",
        example: "NVDA drops 12% on 194M volume (vs normal ~50M) → very significant move, not just noise.",
      },
    ],
  },
  {
    title: "Trading Concepts",
    color: "#fbbf24",
    items: [
      {
        term: "Stop-Loss",
        short: "An automatic exit to limit how much you can lose",
        explain: "You set a price below your buy price. If the stock falls to that price, it automatically sells — limiting your loss. For example, if you buy at $100 and set a 5% stop-loss, you auto-sell at $95. It protects you from holding a sinking stock.",
        example: "Buy NVDA at $167, set stop-loss at $158 (5% below). If it drops to $158, you're out automatically.",
      },
      {
        term: "Take-Profit",
        short: "An automatic exit to lock in your gains",
        explain: "The opposite of a stop-loss. You set a target price above your buy price. When the stock hits it, you automatically sell and pocket the profit. Prevents greed from making you hold too long.",
        example: "Buy at $167, take-profit at $185. Stock hits $185, you sell and lock in the 10% gain.",
      },
      {
        term: "Paper Trading",
        short: "Practice trading with fake money — no real risk",
        explain: "Paper trading lets you test strategies and build confidence without risking real money. Quanta gives you $100,000 of virtual cash to trade with. It behaves like real trading — you just can't lose actual money.",
        example: "You practice buying NVDA, holding it for a week, and selling. If it works, great — if not, you learn without losing a cent.",
      },
      {
        term: "Backtest",
        short: "Testing a strategy on historical data to see if it would have worked",
        explain: "Before using a strategy with real money, you can check if it worked in the past. A backtest simulates all the trades the strategy would have made and shows you the results — total return, win rate, worst losing streak, etc.",
        example: "Backtest EMA crossover on NVDA for 3 months → 37% win rate, -15% total return → bad strategy for NVDA right now.",
      },
      {
        term: "Sharpe Ratio",
        short: "How much return you got per unit of risk",
        explain: "A Sharpe ratio above 1 is good — you're getting solid returns without taking crazy risks. Below 0 means you'd have been better off in a savings account. It accounts for how bumpy the ride was, not just the final return.",
        example: "Two strategies both return +10%, but one had a very rocky journey. The smoother one has a higher Sharpe ratio.",
      },
    ],
  },
];

export default function LearnPage() {
  const [open, setOpen] = useState({});
  const [search, setSearch] = useState("");

  const toggle = key => setOpen(o => ({ ...o, [key]: !o[key] }));
  const q = search.toLowerCase();
  const filtered = SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(i =>
      !q || i.term.toLowerCase().includes(q) || i.short.toLowerCase().includes(q) || i.explain.toLowerCase().includes(q)
    ),
  })).filter(s => s.items.length > 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#f1f5f9", fontFamily: "'DM Serif Display',serif", fontStyle: "italic" }}>Trading 101</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Everything explained in plain English — no finance degree needed</div>
        </div>
        <div style={{ position: "relative" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search terms…"
            style={{ padding: "8px 14px 8px 36px", borderRadius: 20, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.04)", color: "#e2e8f0", fontSize: 12, width: 200, outline: "none" }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 13 }}>↺</span>
        </div>
      </div>

      {/* Sections */}
      {filtered.map(section => (
        <div key={section.title}>
          <div style={{ fontSize: 11, fontWeight: 600, color: section.color, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
            {section.title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {section.items.map(item => {
              const key = section.title + item.term;
              const isOpen = open[key];
              return (
                <Glass key={item.term} style={{ borderRadius: 14, overflow: "hidden", cursor: "pointer" }} onClick={() => toggle(key)}>
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{item.term}</div>
                      <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{item.short}</div>
                    </div>
                    <span style={{ fontSize: 14, color: muted, flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▾</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 14 }}>
                      <p style={{ fontSize: 12, color: "rgba(148,163,184,.85)", lineHeight: 1.75, margin: "0 0 12px" }}>
                        {item.explain}
                      </p>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: section.color, letterSpacing: ".08em", textTransform: "uppercase", flexShrink: 0, marginTop: 2 }}>Example</span>
                        <p style={{ fontSize: 11, color: dim, lineHeight: 1.6, margin: 0 }}>{item.example}</p>
                      </div>
                    </div>
                  )}
                </Glass>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Glass style={{ padding: "40px", textAlign: "center", borderRadius: 16 }}>
          <div style={{ fontSize: 13, color: muted }}>No results for "{search}"</div>
        </Glass>
      )}
    </div>
  );
}
