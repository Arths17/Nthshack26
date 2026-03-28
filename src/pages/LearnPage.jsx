import { useMemo, useState } from "react";

const STORAGE_KEY = "quanta:learn:v2";

function lessonKey(sectionId, lessonId) {
  return `${sectionId}::${lessonId}`;
}

function testKey(sectionId) {
  return `${sectionId}::checkpoint`;
}

function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      completedLessons: new Set(raw.completedLessons || []),
      completedTests: new Set(raw.completedTests || []),
      xp: raw.xp || 0,
      streak: raw.streak || 0,
      lives: typeof raw.lives === "number" ? raw.lives : 5,
      lastDate: raw.lastDate || null,
    };
  } catch {
    return {
      completedLessons: new Set(),
      completedTests: new Set(),
      xp: 0,
      streak: 0,
      lives: 5,
      lastDate: null,
    };
  }
}

function persistProgress(prog) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      completedLessons: [...prog.completedLessons],
      completedTests: [...prog.completedTests],
      xp: prog.xp,
      streak: prog.streak,
      lives: prog.lives,
      lastDate: prog.lastDate,
    })
  );
}

function buildDailyStreak(previousDate, currentStreak) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (previousDate === today) return currentStreak;
  if (previousDate === yesterday) return currentStreak + 1;
  return 1;
}

const SECTIONS = [
  {
    id: "stock-basics",
    title: "Stock Basics",
    tagline: "Foundations you must know before placing trades",
    color: "#4facfe",
    glow: "rgba(79,172,254,.14)",
    icon: "◈",
    lessons: [
      {
        id: "stock-share",
        term: "Stock / Share",
        icon: "◈",
        summary: "A stock share is a slice of ownership in a company.",
        learn: [
          "Owning a share means you own part of the business, not a loan.",
          "Your return comes from price appreciation and sometimes dividends.",
          "Company performance and investor expectations both affect price.",
        ],
        example: "If a company is valued at $500B and has 10B shares, each share is worth about $50.",
        quiz: {
          question: "What does buying one share of a company mean?",
          options: [
            "You loan money with guaranteed interest",
            "You own a small part of the company",
            "You lock your money for one year",
            "You buy the right to set company prices",
          ],
          answer: 1,
          explain: "A share represents partial ownership in the business.",
        },
      },
      {
        id: "market-cap",
        term: "Market Cap",
        icon: "⊞",
        summary: "Market cap shows the total equity value of a company.",
        learn: [
          "Formula: market cap = share price x shares outstanding.",
          "Large-cap stocks are usually more stable than small-cap stocks.",
          "Market cap helps compare company size across industries.",
        ],
        example: "$120 stock price x 5 billion shares = $600 billion market cap.",
        quiz: {
          question: "Which formula calculates market cap?",
          options: [
            "Net income / shares outstanding",
            "Share price x shares outstanding",
            "Revenue - expenses",
            "Share price x daily volume",
          ],
          answer: 1,
          explain: "Market cap multiplies current share price by total shares.",
        },
      },
      {
        id: "volume",
        term: "Volume",
        icon: "≋",
        summary: "Volume is how many shares traded in a period.",
        learn: [
          "High volume confirms conviction behind a move.",
          "Low volume moves are often less reliable and can reverse.",
          "Compare current volume to average volume for context.",
        ],
        example: "A 5% breakout on 3x average volume is stronger than the same move on thin volume.",
        quiz: {
          question: "Why does rising volume during a breakout matter?",
          options: [
            "It proves a guaranteed future gain",
            "It signals stronger market participation",
            "It means volatility is zero",
            "It always lowers risk",
          ],
          answer: 1,
          explain: "Higher participation usually makes the price move more credible.",
        },
      },
      {
        id: "pe-ratio",
        term: "P/E Ratio",
        icon: "◉",
        summary: "P/E compares stock price to earnings per share.",
        learn: [
          "Formula: P/E = price per share / earnings per share.",
          "Higher P/E often means higher growth expectations.",
          "P/E should be compared to peers in the same sector.",
        ],
        example: "A $90 stock with $3 EPS has a P/E of 30.",
        quiz: {
          question: "A stock is $80 and EPS is $4. What is the P/E?",
          options: ["4", "16", "20", "32"],
          answer: 2,
          explain: "80 / 4 = 20.",
        },
      },
    ],
    test: [
      {
        question: "A stock rises on very low volume. Best interpretation?",
        options: [
          "Move may be less reliable",
          "Move is definitely institutional",
          "Trend is guaranteed to continue",
          "Market cap has increased sharply",
        ],
        answer: 0,
      },
      {
        question: "Company has 2B shares and trades at $35. Market cap is:",
        options: ["$70M", "$70B", "$17.5B", "$35B"],
        answer: 1,
      },
      {
        question: "Owning shares gives you:",
        options: ["Debt priority", "Partial ownership", "Guaranteed dividends", "Fixed coupon"],
        answer: 1,
      },
    ],
  },
  {
    id: "chart-reading",
    title: "Reading Charts",
    tagline: "Use structure and trend to avoid random entries",
    color: "#a78bfa",
    glow: "rgba(167,139,250,.14)",
    icon: "◎",
    lessons: [
      {
        id: "candlesticks",
        term: "Candlestick",
        icon: "▦",
        summary: "Candles show open, high, low, close for a period.",
        learn: [
          "Body shows open-to-close range.",
          "Wicks show extreme prices reached during that period.",
          "Consecutive candles reveal momentum and rejection.",
        ],
        example: "Open 100, high 106, low 98, close 104 = bullish candle with both wicks.",
        quiz: {
          question: "What does the wick on a candle represent?",
          options: ["Only open and close", "Highest and lowest prices", "Average price", "Volume traded"],
          answer: 1,
          explain: "Wicks capture the intraperiod extremes.",
        },
      },
      {
        id: "sma",
        term: "SMA",
        icon: "≈",
        summary: "SMA smooths price by averaging a fixed window.",
        learn: [
          "SMA(20) averages the last 20 closes.",
          "Longer SMA reacts slower but filters more noise.",
          "Price above rising SMA suggests bullish structure.",
        ],
        example: "A rising SMA50 often acts as dynamic support in uptrends.",
        quiz: {
          question: "Why do traders use moving averages?",
          options: [
            "To remove all risk",
            "To smooth noise and identify trend",
            "To predict exact highs",
            "To replace stop losses",
          ],
          answer: 1,
          explain: "Moving averages simplify trend reading by smoothing short-term noise.",
        },
      },
      {
        id: "ema",
        term: "EMA",
        icon: "≋",
        summary: "EMA weights recent prices more heavily than SMA.",
        learn: [
          "EMA reacts faster to sudden price changes.",
          "Useful for short-term momentum systems.",
          "Crossovers between fast and slow EMAs can be signals.",
        ],
        example: "After a sharp drop, EMA20 turns down before SMA20.",
        quiz: {
          question: "Compared to SMA, EMA is generally:",
          options: ["Slower", "Faster to react", "Always more accurate", "Unusable intraday"],
          answer: 1,
          explain: "EMA gives more weight to recent bars, so it responds quicker.",
        },
      },
      {
        id: "support-resistance",
        term: "Support & Resistance",
        icon: "⊡",
        summary: "Support is a floor, resistance is a ceiling.",
        learn: [
          "Support is where buyers repeatedly defend price.",
          "Resistance is where sellers repeatedly appear.",
          "A breakout through resistance can become new support.",
        ],
        example: "Price repeatedly rejects near 210, then breaks above on high volume: possible regime shift.",
        quiz: {
          question: "After a clean breakout above resistance, what often happens?",
          options: [
            "Resistance can become support",
            "Volume disappears permanently",
            "Trend always ends immediately",
            "P/E ratio resets",
          ],
          answer: 0,
          explain: "Old resistance often flips into support if the breakout holds.",
        },
      },
    ],
    test: [
      {
        question: "Which moving average reacts faster to new prices?",
        options: ["SMA", "EMA", "VWAP", "RSI"],
        answer: 1,
      },
      {
        question: "A candle wick mainly indicates:",
        options: ["Dividend yield", "Intraperiod extremes", "Earnings growth", "Order type"],
        answer: 1,
      },
      {
        question: "Support is best described as:",
        options: ["A guaranteed bottom", "Repeated selling area", "Repeated buying area", "A valuation metric"],
        answer: 2,
      },
    ],
  },
  {
    id: "indicators",
    title: "Indicators",
    tagline: "Read momentum and quality of moves",
    color: "#4ade80",
    glow: "rgba(74,222,128,.14)",
    icon: "◆",
    lessons: [
      {
        id: "rsi",
        term: "RSI",
        icon: "◆",
        summary: "RSI is a momentum oscillator from 0 to 100.",
        learn: [
          "RSI above 70 may indicate overbought conditions.",
          "RSI below 30 may indicate oversold conditions.",
          "Use RSI with trend context, not in isolation.",
        ],
        example: "In a strong uptrend, RSI can stay above 60 for long periods.",
        quiz: {
          question: "RSI below 30 often signals:",
          options: ["Overbought", "Oversold", "No volume", "Guaranteed rally"],
          answer: 1,
          explain: "Below 30 is typically interpreted as oversold.",
        },
      },
      {
        id: "ema-crossover",
        term: "EMA Crossover",
        icon: "≈",
        summary: "Fast EMA crossing slow EMA can signal trend change.",
        learn: [
          "Fast above slow implies bullish momentum shift.",
          "Fast below slow implies weakening momentum.",
          "Crossovers work better when paired with volume and structure.",
        ],
        example: "EMA12 crossing above EMA26 after consolidation can mark a momentum breakout.",
        quiz: {
          question: "A bullish EMA crossover happens when:",
          options: [
            "Slow EMA crosses above fast EMA",
            "Fast EMA crosses above slow EMA",
            "Price closes below both EMAs",
            "Volume drops to zero",
          ],
          answer: 1,
          explain: "Bullish crossover = short-term trend overtakes long-term trend.",
        },
      },
      {
        id: "volume-spike",
        term: "Volume Spike",
        icon: "⊕",
        summary: "Large volume changes reveal conviction in price action.",
        learn: [
          "A spike confirms importance of a breakout or breakdown.",
          "Spikes near key levels are more informative.",
          "Spikes against trend can indicate exhaustion.",
        ],
        example: "A failed breakout with a huge spike can become a reversal signal.",
        quiz: {
          question: "Why is a volume spike at resistance important?",
          options: [
            "It can confirm breakout strength or rejection",
            "It cancels all indicators",
            "It means market cap doubled",
            "It guarantees next candle direction",
          ],
          answer: 0,
          explain: "At key levels, unusual volume often confirms the real battle outcome.",
        },
      },
    ],
    test: [
      {
        question: "RSI is primarily a:",
        options: ["Valuation metric", "Momentum oscillator", "Balance sheet line item", "Candlestick type"],
        answer: 1,
      },
      {
        question: "EMA crossover signals are strongest when combined with:",
        options: ["No context", "Volume and structure", "Random entries", "Ignoring trend"],
        answer: 1,
      },
      {
        question: "A sudden volume spike during a breakdown usually means:",
        options: ["Move may be meaningful", "Data error", "Guaranteed bounce", "Lower volatility"],
        answer: 0,
      },
    ],
  },
  {
    id: "risk-strategy",
    title: "Risk & Strategy",
    tagline: "Protect downside and build repeatable process",
    color: "#f472b6",
    glow: "rgba(244,114,182,.14)",
    icon: "▣",
    lessons: [
      {
        id: "stop-loss",
        term: "Stop-Loss",
        icon: "⊗",
        summary: "Stop-loss defines max loss before the trade starts.",
        learn: [
          "Set the stop at a level that invalidates your trade idea.",
          "Risk per trade should be a small fixed percent of account.",
          "Never widen stops emotionally after entry.",
        ],
        example: "Entry at 100, invalidation at 95, risk = $5/share.",
        quiz: {
          question: "Best reason to use a stop-loss?",
          options: [
            "Guarantee profit",
            "Control downside and preserve capital",
            "Avoid paying fees",
            "Increase leverage",
          ],
          answer: 1,
          explain: "Stops keep one bad trade from becoming account damage.",
        },
      },
      {
        id: "take-profit",
        term: "Take-Profit",
        icon: "◎",
        summary: "Take-profit locks gains at planned levels.",
        learn: [
          "Predefine exit targets based on structure or risk-reward.",
          "Partial profit-taking can reduce psychological pressure.",
          "Combining stop and target gives clear expectancy math.",
        ],
        example: "Risk $2 to target $6 gives a 1:3 risk-reward profile.",
        quiz: {
          question: "A 1:3 risk-reward trade means:",
          options: [
            "You risk 3 to make 1",
            "You risk 1 to make 3",
            "No stop-loss is needed",
            "Win rate must be 100%",
          ],
          answer: 1,
          explain: "Risk 1 unit to potentially earn 3 units.",
        },
      },
      {
        id: "paper-trading",
        term: "Paper Trading",
        icon: "▣",
        summary: "Paper trading tests execution without financial risk.",
        learn: [
          "Use it to validate process and remove beginner mistakes.",
          "Track mistakes and rules, not just PnL.",
          "Graduate only after consistent rule-following.",
        ],
        example: "Run your setup for 20 trades in simulation before going live.",
        quiz: {
          question: "Best use of paper trading?",
          options: [
            "Max leverage experimentation",
            "Build and test disciplined execution",
            "Ignore risk management",
            "Predict exact market tops",
          ],
          answer: 1,
          explain: "It is a practice environment for process quality.",
        },
      },
      {
        id: "backtesting",
        term: "Backtesting",
        icon: "◉",
        summary: "Backtesting evaluates a strategy on historical data.",
        learn: [
          "Measure win rate, drawdown, and expectancy.",
          "Avoid overfitting by testing on unseen periods.",
          "A robust strategy survives different market regimes.",
        ],
        example: "A strategy that only works in one year may be curve-fit noise.",
        quiz: {
          question: "A major backtesting pitfall is:",
          options: ["Overfitting", "Risk controls", "Data hygiene", "Sample diversity"],
          answer: 0,
          explain: "Overfitting creates fake confidence by memorizing history.",
        },
      },
    ],
    test: [
      {
        question: "Primary purpose of a stop-loss:",
        options: ["Increase trade size", "Control downside", "Guarantee win rate", "Avoid taxes"],
        answer: 1,
      },
      {
        question: "Backtesting should include what metric?",
        options: ["Only biggest winner", "Drawdown and expectancy", "Only total return", "Only number of trades"],
        answer: 1,
      },
      {
        question: "Paper trading is most useful for:",
        options: ["Practicing process", "Making real income", "Avoiding journal", "Ignoring slippage"],
        answer: 0,
      },
    ],
  },
];

const ZIGZAG = [0, 72, 0, -72, 0, 72, 0, -72];

function StatBadge({ icon, value, label, color }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 24,
        padding: "8px 16px",
      }}
    >
      <span style={{ fontSize: 16, color }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f0f4ff",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", fontWeight: 600, letterSpacing: ".06em", marginTop: 1 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function LessonNode({ section, lesson, idx, done, unlocked, current, celebrate, onOpen }) {
  const offset = ZIGZAG[idx % ZIGZAG.length];
  const color = section.color;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {idx > 0 && (
        <div
          style={{
            width: 3,
            height: 34,
            borderRadius: 2,
            background: done ? `${color}55` : "rgba(255,255,255,.07)",
          }}
        />
      )}

      {current && (
        <div
          style={{
            transform: `translateX(${offset}px)`,
            marginBottom: 8,
            background: color,
            borderRadius: 10,
            padding: "6px 14px",
            animation: "tooltipBounce 1.2s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#fff" }}>NEXT</span>
        </div>
      )}

      <div
        onClick={unlocked ? onOpen : undefined}
        style={{
          transform: `translateX(${offset}px)`,
          width: 72,
          height: 72,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: unlocked ? "pointer" : "not-allowed",
          userSelect: "none",
          border: `3px solid ${done ? color : unlocked ? `${color}44` : "rgba(255,255,255,.1)"}`,
          background: done
            ? `linear-gradient(145deg, ${color}, ${color}cc)`
            : unlocked
              ? `linear-gradient(145deg, ${color}22, ${color}12)`
              : "rgba(255,255,255,.04)",
          boxShadow: done
            ? `0 0 0 4px ${color}22, 0 8px 24px ${color}44`
            : unlocked
              ? "0 4px 12px rgba(0,0,0,.28)"
              : "0 4px 12px rgba(0,0,0,.2)",
          animation: celebrate ? "completePop .5s cubic-bezier(.34,1.56,.64,1)" : "none",
          transition: "all .16s ease",
        }}
      >
        {done ? (
          <span style={{ fontSize: 30, color: "#fff", fontWeight: 700 }}>✓</span>
        ) : unlocked ? (
          <span style={{ fontSize: 24, color }}>{lesson.icon}</span>
        ) : (
          <span style={{ fontSize: 20, color: "rgba(148,163,184,.25)" }}>⊠</span>
        )}
      </div>

      <div style={{ transform: `translateX(${offset}px)`, marginTop: 10, textAlign: "center", maxWidth: 120 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: done ? color : unlocked ? "rgba(148,163,184,.82)" : "rgba(148,163,184,.28)" }}>
          {lesson.term}
        </div>
        <div style={{ marginTop: 3, fontSize: 10, color: "rgba(148,163,184,.45)" }}>
          {done ? "Mini quiz passed" : "Mini quiz inside"}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ section, unlocked, lessonDone, lessonTotal, testDone, onStartLesson, onStartTest }) {
  const pct = Math.round((lessonDone / lessonTotal) * 100);
  return (
    <div
      style={{
        marginTop: 34,
        borderRadius: 20,
        overflow: "hidden",
        border: `1px solid ${unlocked ? `${section.color}28` : "rgba(255,255,255,.06)"}`,
        background: unlocked ? `linear-gradient(130deg, ${section.glow}, rgba(255,255,255,.02))` : "rgba(255,255,255,.02)",
      }}
    >
      <div
        style={{
          height: 4,
          width: "100%",
          background: unlocked
            ? `linear-gradient(90deg, ${section.color} ${pct}%, rgba(255,255,255,.07) ${pct}%)`
            : "rgba(255,255,255,.05)",
        }}
      />
      <div style={{ padding: "18px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: `1px solid ${unlocked ? `${section.color}30` : "rgba(255,255,255,.08)"}`,
              background: unlocked ? section.glow : "rgba(255,255,255,.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20, color: unlocked ? section.color : "rgba(148,163,184,.3)" }}>{section.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: unlocked ? "#f0f4ff" : "rgba(148,163,184,.45)" }}>{section.title}</div>
            <div style={{ fontSize: 12, color: unlocked ? "rgba(148,163,184,.58)" : "rgba(148,163,184,.3)", marginTop: 2 }}>
              {unlocked ? section.tagline : "Pass previous checkpoint to unlock"}
            </div>
          </div>
        </div>

        {unlocked && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,.06)" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: section.color, transition: "width .3s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: "rgba(148,163,184,.5)", fontVariantNumeric: "tabular-nums" }}>
                {lessonDone}/{lessonTotal}
              </span>
            </div>

            {lessonDone < lessonTotal && (
              <button
                onClick={onStartLesson}
                style={{
                  padding: "9px 16px",
                  borderRadius: 11,
                  border: "none",
                  background: section.color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 8px 18px ${section.color}44`,
                }}
              >
                {lessonDone === 0 ? "Start lessons" : "Continue lessons"}
              </button>
            )}

            {lessonDone === lessonTotal && !testDone && (
              <button
                onClick={onStartTest}
                style={{
                  padding: "10px 16px",
                  borderRadius: 11,
                  border: "none",
                  background: `linear-gradient(135deg, ${section.color}, #0ea5e9)`,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 8px 18px ${section.color}44`,
                }}
              >
                Take checkpoint test
              </button>
            )}

            {testDone && (
              <div
                style={{
                  display: "inline-flex",
                  gap: 7,
                  alignItems: "center",
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: `${section.color}18`,
                  border: `1px solid ${section.color}28`,
                  fontSize: 12,
                  color: section.color,
                  fontWeight: 700,
                }}
              >
                <span>✓</span>
                <span>Checkpoint passed</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalShell({ color, title, subtitle, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(4,7,15,.88)",
        backdropFilter: "blur(12px)",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          maxHeight: "86vh",
          overflowY: "auto",
          borderRadius: 20,
          border: `1px solid ${color}30`,
          background: "rgba(10,16,32,.98)",
          boxShadow: `0 40px 90px rgba(0,0,0,.8), 0 0 80px ${color}1a`,
          animation: "slideUp .2s ease",
        }}
      >
        <div style={{ height: 4, background: color }} />
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{title}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "rgba(148,163,184,.58)" }}>{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.04)",
              color: "rgba(148,163,184,.7)",
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function QuizOptions({ options, selected, onSelect, disabled }) {
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      {options.map((opt, idx) => (
        <button
          key={`${opt}-${idx}`}
          disabled={disabled}
          onClick={() => onSelect(idx)}
          style={{
            textAlign: "left",
            borderRadius: 12,
            padding: "10px 12px",
            border: `1px solid ${selected === idx ? "rgba(79,172,254,.7)" : "rgba(255,255,255,.1)"}`,
            background: selected === idx ? "rgba(79,172,254,.16)" : "rgba(255,255,255,.03)",
            color: selected === idx ? "#e0f2ff" : "rgba(226,232,240,.92)",
            cursor: disabled ? "default" : "pointer",
            fontSize: 13,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function LessonModal({ section, lesson, alreadyDone, onPass, onClose }) {
  const [stage, setStage] = useState("learn");
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  function checkAnswer() {
    if (selected === null) return;
    const ok = selected === lesson.quiz.answer;
    setCorrect(ok);
    setChecked(true);
    if (!ok) setMistakes((m) => m + 1);
  }

  function nextStep() {
    if (correct) {
      onPass(mistakes);
      return;
    }
    setChecked(false);
    setSelected(null);
  }

  return (
    <ModalShell
      color={section.color}
      title={lesson.term}
      subtitle={stage === "learn" ? "Read, then take a mini quiz" : "Mini quiz"}
      onClose={onClose}
    >
      {stage === "learn" && (
        <>
          <div style={{ fontSize: 14, color: "#f0f4ff", fontWeight: 700, marginBottom: 10 }}>{lesson.summary}</div>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            {lesson.learn.map((point) => (
              <div key={point} style={{ fontSize: 13, color: "rgba(148,163,184,.9)", lineHeight: 1.7 }}>
                - {point}
              </div>
            ))}
          </div>
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${section.color}26`,
              background: section.glow,
              padding: "10px 12px",
              fontSize: 12,
              color: "rgba(226,232,240,.9)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: section.color }}>Example:</strong> {lesson.example}
          </div>
          <button
            onClick={() => setStage("quiz")}
            style={{
              marginTop: 16,
              width: "100%",
              border: "none",
              borderRadius: 12,
              background: section.color,
              color: "#fff",
              fontWeight: 700,
              padding: "12px 0",
              cursor: "pointer",
            }}
          >
            Start mini quiz
          </button>
        </>
      )}

      {stage === "quiz" && (
        <>
          <div style={{ fontSize: 13, color: "rgba(148,163,184,.7)" }}>
            {alreadyDone ? "Already completed. You can still practice." : "Get it right to complete this lesson."}
          </div>
          <div style={{ marginTop: 10, fontSize: 16, fontWeight: 700, color: "#f8fafc", lineHeight: 1.5 }}>{lesson.quiz.question}</div>

          <QuizOptions options={lesson.quiz.options} selected={selected} onSelect={setSelected} disabled={checked} />

          {!checked ? (
            <button
              onClick={checkAnswer}
              disabled={selected === null}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                cursor: selected === null ? "not-allowed" : "pointer",
                background: selected === null ? "rgba(255,255,255,.08)" : section.color,
                color: selected === null ? "rgba(148,163,184,.5)" : "#fff",
              }}
            >
              Check answer
            </button>
          ) : (
            <div
              style={{
                marginTop: 14,
                borderRadius: 12,
                padding: "12px 14px",
                background: correct ? "rgba(74,222,128,.14)" : "rgba(248,113,113,.14)",
                border: `1px solid ${correct ? "rgba(74,222,128,.35)" : "rgba(248,113,113,.35)"}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: correct ? "#4ade80" : "#f87171" }}>
                {correct ? "Correct!" : "Not yet"}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: "rgba(226,232,240,.88)", lineHeight: 1.6 }}>{lesson.quiz.explain}</div>
              <button
                onClick={nextStep}
                style={{
                  marginTop: 10,
                  width: "100%",
                  borderRadius: 10,
                  padding: "10px 0",
                  border: "none",
                  background: correct ? section.color : "rgba(255,255,255,.12)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {correct ? (alreadyDone ? "Close" : "Complete lesson +25 XP") : "Try again"}
              </button>
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}

function SectionTestModal({ section, onPass, onClose }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = section.test[idx];
  const passScore = Math.ceil(section.test.length * 0.67);

  function checkCurrent() {
    if (selected === null) return;
    const ok = selected === q.answer;
    if (ok) setScore((s) => s + 1);
    if (!ok) setMistakes((m) => m + 1);
    setChecked(true);
  }

  function nextQuestion() {
    if (idx + 1 >= section.test.length) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setChecked(false);
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setChecked(false);
    setScore(0);
    setMistakes(0);
    setFinished(false);
  }

  return (
    <ModalShell
      color={section.color}
      title={`${section.title} Checkpoint`}
      subtitle={`Pass ${passScore}/${section.test.length} to unlock the next section`}
      onClose={onClose}
    >
      {!finished ? (
        <>
          <div style={{ fontSize: 12, color: "rgba(148,163,184,.65)", marginBottom: 8 }}>
            Question {idx + 1} of {section.test.length}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", lineHeight: 1.5 }}>{q.question}</div>
          <QuizOptions options={q.options} selected={selected} onSelect={setSelected} disabled={checked} />

          {!checked ? (
            <button
              onClick={checkCurrent}
              disabled={selected === null}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                cursor: selected === null ? "not-allowed" : "pointer",
                background: selected === null ? "rgba(255,255,255,.08)" : section.color,
                color: selected === null ? "rgba(148,163,184,.5)" : "#fff",
              }}
            >
              Check answer
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                cursor: "pointer",
                background: section.color,
                color: "#fff",
              }}
            >
              {idx + 1 === section.test.length ? "See results" : "Next question"}
            </button>
          )}
        </>
      ) : (
        <>
          <div
            style={{
              borderRadius: 14,
              padding: "16px 14px",
              background: score >= passScore ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)",
              border: `1px solid ${score >= passScore ? "rgba(74,222,128,.35)" : "rgba(248,113,113,.35)"}`,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: score >= passScore ? "#4ade80" : "#f87171" }}>
              {score >= passScore ? "Checkpoint passed" : "Checkpoint not passed"}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(226,232,240,.88)" }}>
              Score: {score}/{section.test.length}
            </div>
          </div>

          {score >= passScore ? (
            <button
              onClick={() => onPass(mistakes)}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                cursor: "pointer",
                background: section.color,
                color: "#fff",
              }}
            >
              Claim +60 XP and continue
            </button>
          ) : (
            <button
              onClick={restart}
              style={{
                marginTop: 14,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "12px 0",
                fontWeight: 700,
                cursor: "pointer",
                background: "rgba(255,255,255,.1)",
                color: "#fff",
              }}
            >
              Retry checkpoint
            </button>
          )}
        </>
      )}
    </ModalShell>
  );
}

export default function LearnPage() {
  const [prog, setProg] = useState(loadProgress);
  const [openLesson, setOpenLesson] = useState(null);
  const [openTest, setOpenTest] = useState(null);
  const [celebrateKey, setCelebrateKey] = useState(null);
  const [xpPop, setXpPop] = useState(null);

  const totalLessons = useMemo(() => SECTIONS.reduce((sum, sec) => sum + sec.lessons.length, 0), []);
  const totalTests = SECTIONS.length;

  const completedCount = prog.completedLessons.size;

  function isSectionUnlocked(sectionIdx) {
    if (sectionIdx === 0) return true;
    const prev = SECTIONS[sectionIdx - 1];
    const prevLessonsDone = prev.lessons.every((l) => prog.completedLessons.has(lessonKey(prev.id, l.id)));
    const prevTestDone = prog.completedTests.has(testKey(prev.id));
    return prevLessonsDone && prevTestDone;
  }

  function isLessonDone(section, lesson) {
    return prog.completedLessons.has(lessonKey(section.id, lesson.id));
  }

  function findNextLesson() {
    for (let sIdx = 0; sIdx < SECTIONS.length; sIdx += 1) {
      if (!isSectionUnlocked(sIdx)) break;
      const sec = SECTIONS[sIdx];
      const firstUnfinished = sec.lessons.find((lesson) => !isLessonDone(sec, lesson));
      if (firstUnfinished) return { sec, lesson: firstUnfinished };
    }
    return null;
  }

  function isLessonUnlocked(section, lesson) {
    if (isLessonDone(section, lesson)) return true;
    const next = findNextLesson();
    return next?.sec.id === section.id && next?.lesson.id === lesson.id;
  }

  function awardProgress({ xpGain, mistakePenalty }) {
    const today = new Date().toDateString();
    const streak = buildDailyStreak(prog.lastDate, prog.streak);
    const lives = Math.max(0, Math.min(5, prog.lives - mistakePenalty));
    return {
      ...prog,
      xp: prog.xp + xpGain,
      streak,
      lives,
      lastDate: today,
    };
  }

  function completeLesson(section, lesson, mistakes) {
    const key = lessonKey(section.id, lesson.id);
    const alreadyDone = prog.completedLessons.has(key);
    const base = alreadyDone ? 5 : 25;

    const nextProg = awardProgress({ xpGain: base, mistakePenalty: Math.min(mistakes, 1) });
    nextProg.completedLessons = new Set([...prog.completedLessons, key]);
    nextProg.completedTests = new Set([...prog.completedTests]);

    setProg(nextProg);
    persistProgress(nextProg);

    setCelebrateKey(key);
    setXpPop(`+${base} XP`);
    setOpenLesson(null);
    setTimeout(() => {
      setCelebrateKey(null);
      setXpPop(null);
    }, 1400);
  }

  function completeCheckpoint(section, mistakes) {
    const key = testKey(section.id);
    const nextProg = awardProgress({ xpGain: 60, mistakePenalty: Math.min(mistakes, 2) });
    nextProg.completedLessons = new Set([...prog.completedLessons]);
    nextProg.completedTests = new Set([...prog.completedTests, key]);

    setProg(nextProg);
    persistProgress(nextProg);

    setXpPop("+60 XP");
    setOpenTest(null);
    setTimeout(() => setXpPop(null), 1400);
  }

  const nextLesson = findNextLesson();
  const finishedAllLessons = completedCount === totalLessons;
  const finishedAllTests = prog.completedTests.size === totalTests;

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "12px 0 10px",
          background: "rgba(4,7,15,.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <StatBadge icon="✦" value={prog.xp.toLocaleString()} label="XP" color="#a78bfa" />
          <StatBadge icon="◆" value={`${prog.streak}`} label="Day Streak" color="#4ade80" />
          <StatBadge icon="♥" value={`${prog.lives}/5`} label="Lives" color="#f87171" />
          <StatBadge icon="◈" value={`${completedCount}/${totalLessons}`} label="Lessons" color="#4facfe" />
        </div>

        <div style={{ margin: "10px 24px 0", height: 4, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,.06)" }}>
          <div
            style={{
              width: `${((completedCount + prog.completedTests.size) / (totalLessons + totalTests)) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg,#4facfe,#a78bfa,#4ade80)",
              transition: "width .4s ease",
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 430, margin: "0 auto", width: "100%", padding: "16px 20px 120px" }}>
        {SECTIONS.map((section, sIdx) => {
          const unlocked = isSectionUnlocked(sIdx);
          const lessonDone = section.lessons.filter((lesson) => isLessonDone(section, lesson)).length;
          const checkpointDone = prog.completedTests.has(testKey(section.id));
          const nextInSection = section.lessons.find((lesson) => !isLessonDone(section, lesson));

          return (
            <div key={section.id}>
              <SectionHeader
                section={section}
                unlocked={unlocked}
                lessonDone={lessonDone}
                lessonTotal={section.lessons.length}
                testDone={checkpointDone}
                onStartLesson={() => {
                  if (nextInSection) setOpenLesson({ section, lesson: nextInSection });
                }}
                onStartTest={() => setOpenTest({ section })}
              />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18 }}>
                {section.lessons.map((lesson, idx) => {
                  const done = isLessonDone(section, lesson);
                  const lessonUnlocked = unlocked && isLessonUnlocked(section, lesson);
                  const current = nextLesson?.sec.id === section.id && nextLesson?.lesson.id === lesson.id;
                  return (
                    <LessonNode
                      key={lesson.id}
                      section={section}
                      lesson={lesson}
                      idx={idx}
                      done={done}
                      unlocked={lessonUnlocked}
                      current={current && lessonUnlocked}
                      celebrate={celebrateKey === lessonKey(section.id, lesson.id)}
                      onOpen={() => setOpenLesson({ section, lesson })}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {finishedAllLessons && finishedAllTests && (
          <div
            style={{
              marginTop: 26,
              textAlign: "center",
              borderRadius: 18,
              border: "1px solid rgba(74,222,128,.22)",
              background: "rgba(74,222,128,.08)",
              padding: "24px 16px",
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 8 }}>🏁</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#dcfce7" }}>Course complete</div>
            <div style={{ marginTop: 6, fontSize: 13, color: "rgba(226,232,240,.8)", lineHeight: 1.7 }}>
              You finished all lessons and checkpoints. Use the terminal pages to apply your strategy skills in practice.
            </div>
          </div>
        )}
      </div>

      {openLesson && (
        <LessonModal
          section={openLesson.section}
          lesson={openLesson.lesson}
          alreadyDone={isLessonDone(openLesson.section, openLesson.lesson)}
          onPass={(mistakes) => completeLesson(openLesson.section, openLesson.lesson, mistakes)}
          onClose={() => setOpenLesson(null)}
        />
      )}

      {openTest && (
        <SectionTestModal
          section={openTest.section}
          onPass={(mistakes) => completeCheckpoint(openTest.section, mistakes)}
          onClose={() => setOpenTest(null)}
        />
      )}

      {xpPop && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 80,
            transform: "translateX(-50%)",
            zIndex: 1001,
            borderRadius: 999,
            background: "#a78bfa",
            color: "#fff",
            padding: "10px 18px",
            fontWeight: 800,
            boxShadow: "0 10px 34px rgba(167,139,250,.45)",
            animation: "floatUp 1.2s ease forwards",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {xpPop}
        </div>
      )}

      <style>{`
        @keyframes tooltipBounce {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes completePop {
          0% { transform: scale(1); }
          45% { transform: scale(1.18); }
          75% { transform: scale(.92); }
          100% { transform: scale(1); }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-42px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
