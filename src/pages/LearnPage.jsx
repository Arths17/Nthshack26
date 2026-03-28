import { useState } from "react";

/* ─── Persistence ────────────────────────────────────────────── */
const STORAGE_KEY = "quanta:learn";

function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { completed: new Set(d.completed || []), xp: d.xp || 0, streak: d.streak || 0, lastDate: d.lastDate || null };
  } catch { return { completed: new Set(), xp: 0, streak: 0, lastDate: null }; }
}

function persist({ completed, xp, streak, lastDate }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: [...completed], xp, streak, lastDate }));
}

function lessonKey(sec, item) { return `${sec.title}::${item.term}`; }

/* ─── Curriculum data ────────────────────────────────────────── */
const SECTIONS = [
  {
    title: "Stock Basics",
    tagline: "The building blocks of investing",
    color: "#4facfe",
    glow: "rgba(79,172,254,.12)",
    icon: "◈",
    items: [
      {
        term: "Stock / Share",
        icon: "◈",
        short: "A tiny piece of ownership in a company",
        explain: "When you buy one share of Apple, you literally own a small fraction of Apple Inc. If the company grows and becomes more valuable, your share is worth more. You're not lending them money — you own part of the business.",
        example: "If Apple is worth $3 trillion and has 15 billion shares, each share = $200.",
      },
      {
        term: "Market Cap",
        icon: "⊞",
        short: "How much the whole company is worth",
        explain: "Market Cap = share price × total number of shares. It tells you the total size of the company. 'Large-cap' companies (Apple, NVDA) are safer but slower growing. 'Small-cap' companies are riskier but can grow faster.",
        example: "NVDA at $167 × 24.4B shares = ~$4T market cap.",
      },
      {
        term: "Volume",
        icon: "≋",
        short: "How many shares were traded today",
        explain: "High volume means lots of people are buying and selling — the stock is active. Low volume means it's quiet. A big price move on high volume is more meaningful than the same move on low volume.",
        example: "NVDA trading 194M shares on a down day = strong selling pressure, not just noise.",
      },
      {
        term: "52-Week Range",
        icon: "◫",
        short: "The highest and lowest price over the past year",
        explain: "This gives you context. If a stock is trading near its 52-week low, it might be cheap. Near its high, it might be expensive — or it might be on a strong run. It's a quick sanity check.",
        example: "NVDA 52W range: $86–$153. At $167, it's above the yearly range — that's a strong stock.",
      },
      {
        term: "P/E Ratio",
        icon: "◉",
        short: "How expensive the stock is vs. its profits",
        explain: "P/E = stock price ÷ earnings per share. A high P/E (50+) means investors expect big future growth. A low P/E (12) means the stock might be cheap — or the company is struggling. There's no 'right' P/E — it depends on the industry.",
        example: "Apple P/E of 28 = you're paying $28 for every $1 of annual profit.",
      },
    ],
  },
  {
    title: "Reading Charts",
    tagline: "Decode what price movement means",
    color: "#a78bfa",
    glow: "rgba(167,139,250,.12)",
    icon: "◎",
    items: [
      {
        term: "Candlestick",
        icon: "▦",
        short: "A bar showing open, close, high & low for one period",
        explain: "Each candle shows 4 prices: where the stock opened, where it closed, and the highest/lowest it reached. A green candle = price went UP that period. A red candle = price went DOWN. They stack together to paint the full picture.",
        example: "Open $100, High $108, Low $98, Close $105 → green candle.",
      },
      {
        term: "SMA (Simple Moving Average)",
        icon: "≈",
        short: "The average price over the last N days",
        explain: "SMA20 = the average of the last 20 closing prices. It smooths out daily noise so you can see the real trend. When price is above the SMA, the trend is up. Below it, the trend is down. Think of it as the baseline.",
        example: "If NVDA closed at different prices each day for 20 days, the SMA20 is just the average of those 20 closes.",
      },
      {
        term: "EMA (Exponential Moving Average)",
        icon: "≋",
        short: "Like SMA but reacts faster to recent prices",
        explain: "EMA weighs recent days more heavily than older ones. This means it reacts faster to price changes than SMA. Traders use it to spot trend changes earlier. EMA(12) and EMA(26) together form the popular MACD indicator.",
        example: "If NVDA drops sharply today, the EMA moves down faster than the SMA would.",
      },
      {
        term: "Support & Resistance",
        icon: "⊡",
        short: "Price levels where stocks tend to bounce or get stuck",
        explain: "Support is a price floor — the stock keeps bouncing off it when it falls. Resistance is a ceiling — the stock keeps stalling when it rises there. When a stock breaks through resistance, it often keeps going up.",
        example: "NVDA keeps bouncing around $160 → $160 is a support level to watch.",
      },
    ],
  },
  {
    title: "Indicators",
    tagline: "Tools that reveal hidden signals",
    color: "#4ade80",
    glow: "rgba(74,222,128,.12)",
    icon: "◆",
    items: [
      {
        term: "RSI",
        icon: "◆",
        short: "A score 0–100 showing if a stock is overbought or oversold",
        explain: "RSI measures how fast and how much the price has moved recently. Above 70 = overbought (might be due for a pullback). Below 30 = oversold (might be due for a bounce). It's a guide, not a guarantee — use it with other signals.",
        example: "RSI of 25 on NVDA after a big drop → stock might be oversold, possible bounce coming.",
      },
      {
        term: "EMA Crossover",
        icon: "≈",
        short: "When a fast trend line crosses a slow trend line",
        explain: "When the fast EMA (e.g. 12-day) crosses above the slow EMA (e.g. 26-day), that's a buy signal — the short-term trend is turning bullish. When it crosses back below, it's a sell signal. One of the most widely used strategies.",
        example: "EMA(12) crosses above EMA(26) on MSFT → strategy triggers a buy signal.",
      },
      {
        term: "Volume Spike",
        icon: "⊕",
        short: "A sudden jump in how many shares are being traded",
        explain: "When price moves a lot AND volume spikes, it's a more significant move. A big price drop on huge volume = strong selling. A big price jump on huge volume = strong buying. Low volume moves are less reliable.",
        example: "NVDA drops 12% on 194M volume (vs normal ~50M) → very significant move, not just noise.",
      },
    ],
  },
  {
    title: "Trading Concepts",
    tagline: "Risk, strategy, and how to win",
    color: "#f472b6",
    glow: "rgba(244,114,182,.12)",
    icon: "▣",
    items: [
      {
        term: "Stop-Loss",
        icon: "⊗",
        short: "An automatic exit to limit how much you can lose",
        explain: "You set a price below your buy price. If the stock falls to that price, it automatically sells — limiting your loss. It protects you from holding a sinking stock and watching losses compound.",
        example: "Buy NVDA at $167, set stop-loss at $158 (5% below). If it drops to $158, you're out automatically.",
      },
      {
        term: "Take-Profit",
        icon: "◎",
        short: "An automatic exit to lock in your gains",
        explain: "The opposite of a stop-loss. You set a target price above your buy price. When the stock hits it, you automatically sell and pocket the profit. Prevents greed from making you hold too long.",
        example: "Buy at $167, take-profit at $185. Stock hits $185, you sell and lock in the ~10% gain.",
      },
      {
        term: "Paper Trading",
        icon: "▣",
        short: "Practice trading with fake money — zero risk",
        explain: "Paper trading lets you test strategies and build confidence without risking real money. Quanta gives you $100,000 of virtual cash to trade with. It behaves like real trading — you just can't lose actual money.",
        example: "You practice buying NVDA, holding for a week, and selling. If it works, great. If not, you learned without losing a cent.",
      },
      {
        term: "Backtest",
        icon: "◉",
        short: "Testing a strategy on historical data",
        explain: "Before using a strategy with real money, check if it worked in the past. A backtest simulates all the trades the strategy would have made and shows total return, win rate, worst losing streak, and more.",
        example: "Backtest EMA crossover on NVDA for 3 months → 37% win rate, -15% total return → risky strategy right now.",
      },
      {
        term: "Sharpe Ratio",
        icon: "◈",
        short: "How much return you got per unit of risk",
        explain: "A Sharpe ratio above 1 is good — solid returns without crazy risk. Below 0 means you'd have been better off in a savings account. It accounts for how bumpy the ride was, not just the final return.",
        example: "Two strategies both return +10%, but one was rocky. The smoother one has a higher Sharpe ratio.",
      },
    ],
  },
];

/* ─── Zig-zag offsets (px, from center) ─────────────────────── */
const ZIGZAG = [0, 72, 0, -72, 0, 72, 0, -72, 0, 72];

/* ─── Sub-components ─────────────────────────────────────────── */

function StatBadge({ icon, value, label, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
      borderRadius: 24, padding: "8px 16px",
    }}>
      <span style={{ fontSize: 16, color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f4ff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", fontWeight: 500, letterSpacing: ".06em", marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

function SectionBanner({ sec, sIdx, doneCount, totalCount, unlocked, onContinue, nextItem }) {
  const pct = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;
  return (
    <div style={{
      margin: sIdx === 0 ? "0 0 32px" : "48px 0 32px",
      borderRadius: 20, overflow: "hidden",
      background: unlocked ? `linear-gradient(135deg,${sec.glow},rgba(255,255,255,.02))` : "rgba(255,255,255,.02)",
      border: `1px solid ${unlocked ? sec.color + "28" : "rgba(255,255,255,.06)"}`,
    }}>
      {/* Top strip */}
      <div style={{
        height: 4, width: "100%",
        background: unlocked
          ? `linear-gradient(90deg,${sec.color} ${pct}%,rgba(255,255,255,.06) ${pct}%)`
          : "rgba(255,255,255,.04)",
      }} />
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: unlocked ? sec.glow : "rgba(255,255,255,.04)",
            border: `1px solid ${unlocked ? sec.color + "28" : "rgba(255,255,255,.06)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 22, color: unlocked ? sec.color : "rgba(148,163,184,.25)" }}>{sec.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: unlocked ? "#f0f4ff" : "rgba(148,163,184,.35)", marginBottom: 3 }}>{sec.title}</div>
            <div style={{ fontSize: 12, color: unlocked ? "rgba(148,163,184,.55)" : "rgba(148,163,184,.25)", marginBottom: 12 }}>
              {unlocked ? sec.tagline : "Complete the previous section to unlock"}
            </div>
            {unlocked && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 10, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 10, background: sec.color, transition: "width .4s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(148,163,184,.5)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{doneCount}/{totalCount}</span>
                </div>
                {doneCount < totalCount && nextItem && (
                  <button onClick={onContinue} style={{
                    padding: "10px 22px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: sec.color, border: "none", color: "#fff", cursor: "pointer",
                    boxShadow: `0 4px 16px ${sec.color}44`, letterSpacing: ".02em",
                    transition: "all .18s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${sec.color}55`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 16px ${sec.color}44`; }}
                    onMouseDown={e => { e.currentTarget.style.transform = "translateY(1px) scale(.97)"; }}
                    onMouseUp={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}>
                    {doneCount === 0 ? `Start ${sec.title}` : "Continue"}
                  </button>
                )}
                {doneCount === totalCount && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, background: `${sec.color}18`, border: `1px solid ${sec.color}28` }}>
                    <span style={{ color: sec.color, fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 12, color: sec.color, fontWeight: 600 }}>Section Complete!</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonNode({ item, sec, iIdx, done, current, unlocked, onClick, celebrate }) {
  const offset = ZIGZAG[iIdx % ZIGZAG.length];
  const color  = sec.color;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {/* Connector line */}
      {iIdx > 0 && (
        <div style={{
          width: 3, height: 36, borderRadius: 2,
          background: done ? `${color}55` : "rgba(255,255,255,.07)",
          marginBottom: 0,
        }} />
      )}

      {/* "START" tooltip above current node */}
      {current && (
        <div style={{
          transform: `translateX(${offset}px)`,
          background: color, borderRadius: 10, padding: "6px 16px",
          marginBottom: 8, position: "relative",
          animation: "tooltipBounce 1.2s ease-in-out infinite",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: ".06em" }}>START</span>
          {/* Triangle pointer */}
          <div style={{
            position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${color}`,
          }} />
        </div>
      )}

      {/* Circle node */}
      <div
        onClick={unlocked ? onClick : undefined}
        style={{
          transform: `translateX(${offset}px)`,
          width: 72, height: 72, borderRadius: "50%",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: unlocked ? "pointer" : "not-allowed",
          userSelect: "none",
          position: "relative",
          transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s",
          // Visual state
          background: done
            ? `linear-gradient(145deg,${color},${color}cc)`
            : unlocked
              ? `linear-gradient(145deg,${color}20,${color}10)`
              : "rgba(255,255,255,.04)",
          border: `3px solid ${done ? color : unlocked ? color + "44" : "rgba(255,255,255,.1)"}`,
          boxShadow: done
            ? `0 0 0 4px ${color}22, 0 8px 24px ${color}44`
            : unlocked
              ? `0 0 0 0px ${color}00, 0 4px 12px rgba(0,0,0,.3)`
              : "0 4px 12px rgba(0,0,0,.2)",
          animation: celebrate ? "completePop .5s cubic-bezier(.34,1.56,.64,1)" : current ? "nodePulse 2s ease-in-out infinite" : "none",
        }}
        onMouseEnter={e => { if (unlocked) { e.currentTarget.style.transform = `translateX(${offset}px) scale(1.08)`; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = `translateX(${offset}px) scale(1)`; }}
        onMouseDown={e => { if (unlocked) { e.currentTarget.style.transform = `translateX(${offset}px) scale(0.93)`; } }}
        onMouseUp={e => { if (unlocked) { e.currentTarget.style.transform = `translateX(${offset}px) scale(1.08)`; } }}
      >
        {done ? (
          <span style={{ fontSize: 30, color: "#fff", fontWeight: 700 }}>✓</span>
        ) : unlocked ? (
          <span style={{ fontSize: 24, color }}>{item.icon}</span>
        ) : (
          <span style={{ fontSize: 22, color: "rgba(148,163,184,.2)" }}>⊠</span>
        )}
      </div>

      {/* Term label */}
      <div style={{
        transform: `translateX(${offset}px)`,
        marginTop: 10, marginBottom: 4,
        maxWidth: 100, textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, lineHeight: 1.35,
          color: done ? color : unlocked ? "rgba(148,163,184,.8)" : "rgba(148,163,184,.25)",
        }}>
          {item.term}
        </div>
        {done && <div style={{ fontSize: 9, color: color + "88", marginTop: 2, letterSpacing: ".06em" }}>DONE</div>}
      </div>
    </div>
  );
}

function LessonModal({ lesson, onComplete, onClose, alreadyDone }) {
  const { section: sec, item } = lesson;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(4,7,15,.88)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
      animation: "fadeIn .2s ease",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "rgba(10,16,32,.98)",
        border: `1px solid ${sec.color}28`,
        borderRadius: 24, width: "100%", maxWidth: 440, maxHeight: "85vh",
        overflowY: "auto", position: "relative",
        boxShadow: `0 48px 96px rgba(0,0,0,.8), 0 0 80px ${sec.color}10, inset 0 1px 0 rgba(255,255,255,.06)`,
        animation: "slideUp .25s cubic-bezier(.34,1.4,.64,1)",
      }}>
        {/* Colored top strip */}
        <div style={{ height: 4, background: sec.color, borderRadius: "24px 24px 0 0" }} />

        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: sec.glow, border: `1px solid ${sec.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: sec.color, fontSize: 16 }}>{sec.icon}</span>
            </div>
            <span style={{ fontSize: 12, color: sec.color, fontWeight: 600, letterSpacing: ".08em" }}>{sec.title.toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(148,163,184,.6)",
            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "#f0f4ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(148,163,184,.6)"; }}>
            ✕
          </button>
        </div>

        {/* Big icon + term */}
        <div style={{ padding: "24px 24px 0", textAlign: "center" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 18px",
            background: sec.glow, border: `2px solid ${sec.color}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 32px ${sec.color}20`,
          }}>
            <span style={{ fontSize: 36, color: sec.color }}>{item.icon}</span>
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: 26, fontWeight: 400, color: "#f0f4ff",
            margin: "0 0 6px", letterSpacing: "-.01em",
          }}>{item.term}</h2>
          <p style={{ fontSize: 14, color: "rgba(148,163,184,.6)", margin: 0, fontStyle: "italic" }}>{item.short}</p>
        </div>

        {/* Divider */}
        <div style={{ margin: "22px 24px", height: 1, background: "rgba(255,255,255,.06)" }} />

        {/* Explanation */}
        <div style={{ padding: "0 24px" }}>
          <div style={{ fontSize: 10, color: sec.color, fontWeight: 700, letterSpacing: ".12em", marginBottom: 10 }}>WHAT IT MEANS</div>
          <p style={{ fontSize: 14, color: "rgba(148,163,184,.85)", lineHeight: 1.8, margin: 0 }}>
            {item.explain}
          </p>
        </div>

        {/* Example card */}
        <div style={{
          margin: "20px 24px",
          background: sec.glow, border: `1px solid ${sec.color}20`,
          borderRadius: 14, padding: "16px 18px",
        }}>
          <div style={{ fontSize: 10, color: sec.color, fontWeight: 700, letterSpacing: ".12em", marginBottom: 8 }}>EXAMPLE</div>
          <p style={{ fontSize: 13, color: "rgba(148,163,184,.75)", lineHeight: 1.7, margin: 0, fontFamily: "monospace" }}>
            {item.example}
          </p>
        </div>

        {/* CTA */}
        <div style={{ padding: "4px 24px 24px" }}>
          <button onClick={onComplete} style={{
            width: "100%", padding: "15px 0", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: ".03em",
            background: alreadyDone
              ? "rgba(255,255,255,.06)"
              : sec.color,
            border: alreadyDone ? "1px solid rgba(255,255,255,.1)" : "none",
            color: alreadyDone ? "rgba(148,163,184,.6)" : "#fff",
            boxShadow: alreadyDone ? "none" : `0 8px 24px ${sec.color}44`,
            transition: "all .18s cubic-bezier(.34,1.56,.64,1)",
          }}
            onMouseEnter={e => { if (!alreadyDone) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 14px 32px ${sec.color}55`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = alreadyDone ? "none" : `0 8px 24px ${sec.color}44`; }}
            onMouseDown={e => { if (!alreadyDone) e.currentTarget.style.transform = "translateY(1px) scale(.98)"; }}
            onMouseUp={e => { if (!alreadyDone) { e.currentTarget.style.transform = "translateY(-1px)"; } }}>
            {alreadyDone ? "Already completed · Close" : "Got it!  +20 XP ✦"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function LearnPage() {
  const [prog, setProg]   = useState(loadProgress);
  const [lesson, setLesson] = useState(null);
  const [popXp, setPopXp]   = useState(false);
  const [celebKey, setCelebKey] = useState(null);

  const { completed, xp, streak } = prog;
  const total = SECTIONS.reduce((a, s) => a + s.items.length, 0);

  const isDone = (sec, item) => completed.has(lessonKey(sec, item));

  // Calculate if a specific lesson is unlocked (only if it's next in the global sequence)
  const isLessonUnlocked = (sec, item) => {
    if (completed.has(lessonKey(sec, item))) return true; // Already done
    // Check if this is the next lesson globally
    let isNext = false;
    outer: for (const s of SECTIONS) {
      for (const i of s.items) {
        if (!completed.has(lessonKey(s, i))) {
          if (s.title === sec.title && i.term === item.term) {
            isNext = true;
          }
          break outer;
        }
      }
    }
    return isNext;
  };

  const isSectionUnlocked = idx => {
    if (idx === 0) return true;
    // Section is unlocked only if ALL lessons in previous section are complete
    const prev = SECTIONS[idx - 1];
    const prevDone = prev.items.filter(i => completed.has(lessonKey(prev, i))).length;
    return prevDone === prev.items.length;
  };

  // First uncompleted item across ALL sections
  let globalNext = null;
  outer: for (const sec of SECTIONS) {
    for (const item of sec.items) {
      if (!completed.has(lessonKey(sec, item))) { globalNext = { sec, item }; break outer; }
    }
  }

  function openLesson(sec, item) { setLesson({ section: sec, item }); }

  function completeLesson() {
    if (!lesson) return;
    const k = lessonKey(lesson.section, lesson.item);
    const alreadyDone = completed.has(k);
    if (alreadyDone) { setLesson(null); return; }

    const newC = new Set([...completed, k]);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = prog.lastDate === today ? streak : prog.lastDate === yesterday ? streak + 1 : 1;
    const newProg = { completed: newC, xp: xp + 20, streak: newStreak, lastDate: today };
    setProg(newProg);
    persist(newProg);
    setCelebKey(k);
    setPopXp(true);
    setLesson(null);
    setTimeout(() => { setCelebKey(null); setPopXp(false); }, 1600);
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", minHeight: 0 }}>

      {/* ── STATS HEADER ─────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(4,7,15,.95)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        padding: "12px 0 10px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <StatBadge icon="◆" value={streak > 0 ? `${streak}` : "0"} label="Day Streak" color="#f472b6" />
          <StatBadge icon="✦" value={xp.toLocaleString()} label="Total XP" color="#a78bfa" />
          <StatBadge icon="◈" value={`${completed.size}/${total}`} label="Completed" color="#4facfe" />
        </div>
        {/* Overall progress bar */}
        <div style={{ margin: "10px 24px 0", height: 4, borderRadius: 4, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(completed.size / total) * 100}%`, background: "linear-gradient(90deg,#4facfe,#a78bfa)", borderRadius: 4, transition: "width .4s ease" }} />
        </div>
      </div>

      {/* ── PATH ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0", minHeight: 0 }}>
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "24px 20px 120px" }}>
          {SECTIONS.map((sec, sIdx) => {
            const unlocked = isSectionUnlocked(sIdx);
            const secDone  = sec.items.filter(i => isDone(sec, i)).length;
            // First uncompleted item in this section
            const nextInSec = unlocked ? sec.items.find(i => !isDone(sec, i)) : null;

            return (
              <div key={sec.title}>
                {/* Section banner */}
                <SectionBanner
                  sec={sec} sIdx={sIdx} unlocked={unlocked}
                  doneCount={secDone} totalCount={sec.items.length}
                  nextItem={nextInSec}
                  onContinue={() => nextInSec && openLesson(sec, nextInSec)}
                />

                {/* Lesson nodes */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 16 }}>
                  {sec.items.map((item, iIdx) => {
                    const done      = isDone(sec, item);
                    const itemUnlocked = isLessonUnlocked(sec, item);
                    const current   = globalNext?.sec.title === sec.title && globalNext?.item.term === item.term;
                    const celebrate = celebKey === lessonKey(sec, item);
                    return (
                      <LessonNode
                        key={item.term}
                        item={item} sec={sec}
                        iIdx={iIdx}
                        done={done}
                        current={current && itemUnlocked}
                        unlocked={itemUnlocked}
                        celebrate={celebrate}
                        onClick={() => openLesson(sec, item)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* All done state */}
          {completed.size === total && (
            <div style={{
              textAlign: "center", padding: "40px 24px",
              background: "rgba(79,172,254,.05)", border: "1px solid rgba(79,172,254,.14)",
              borderRadius: 20,
            }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✦</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f4ff", marginBottom: 8 }}>Trading 101 Complete!</div>
              <div style={{ fontSize: 13, color: "rgba(148,163,184,.55)", lineHeight: 1.7 }}>
                You've mastered all {total} concepts. Head to the terminal and put your knowledge to work.
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#4facfe", fontWeight: 600 }}>{xp} XP earned ✦</div>
            </div>
          )}
        </div>
      </div>

      {/* ── LESSON MODAL ─────────────────────────────────────── */}
      {lesson && (
        <LessonModal
          lesson={lesson}
          alreadyDone={isDone(lesson.section, lesson.item)}
          onComplete={completeLesson}
          onClose={() => setLesson(null)}
        />
      )}

      {/* ── XP POP ───────────────────────────────────────────── */}
      {popXp && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 2000, background: "#a78bfa",
          borderRadius: 40, padding: "12px 28px",
          fontSize: 15, fontWeight: 700, color: "#fff",
          boxShadow: "0 8px 32px rgba(167,139,250,.5)",
          animation: "floatUp 1.5s ease forwards",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
          ✦ +20 XP
        </div>
      )}

      {/* ── CSS KEYFRAMES ─────────────────────────────────────── */}
      <style>{`
        @keyframes nodePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(79,172,254,.4), 0 4px 12px rgba(0,0,0,.3); }
          50%      { box-shadow: 0 0 0 10px rgba(79,172,254,.0), 0 4px 12px rgba(0,0,0,.3); }
        }
        @keyframes tooltipBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes completePop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.22); }
          70%  { transform: scale(0.93); }
          100% { transform: scale(1); }
        }
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
          60%  { opacity: 1; transform: translateX(-50%) translateY(-20px); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-44px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
