import { useEffect, useState } from "react";
import { f2, SYMBOLS } from "../utils/formatters";

/* ─── Design tokens ──────────────────────────────────────────── */
const BG       = "#04070f";
const GLASS    = "rgba(255,255,255,0.03)";
const BORDER   = "rgba(255,255,255,0.08)";
const BORDER_H = "rgba(255,255,255,0.14)";
const TEXT1    = "#f0f4ff";
const TEXT2    = "rgba(148,163,184,0.75)";
const TEXT3    = "rgba(148,163,184,0.38)";
const BLUE     = "#4facfe";
const PURPLE   = "#a78bfa";

/* ─── Micro-interaction helpers ──────────────────────────────── */
const useBtn = () => ({
  onMouseEnter: e => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,.18),0 20px 52px rgba(79,172,254,.5),0 0 0 1px rgba(79,172,254,.28)";
  },
  onMouseLeave: e => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,.12),0 8px 28px rgba(79,172,254,.3),0 0 0 1px rgba(79,172,254,.18)";
  },
  onMouseDown: e => {
    e.currentTarget.style.transform = "translateY(1px) scale(0.985)";
    e.currentTarget.style.boxShadow =
      "inset 0 2px 6px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.08),0 4px 12px rgba(79,172,254,.2)";
  },
  onMouseUp: e => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,.18),0 20px 52px rgba(79,172,254,.5),0 0 0 1px rgba(79,172,254,.28)";
  },
});

/* ─── Sparkline SVG ──────────────────────────────────────────── */
function Sparkline({ values = [40,48,38,55,50,62,58,70,65,78,72,84], color = BLUE, h = 40, w = 140 }) {
  const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
  const step = w / (values.length - 1);
  const y = v => h - 4 - ((v - mn) / rng) * (h - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const fill = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#sg-${color.slice(1)})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Bento tile config ──────────────────────────────────────── */
const BENTO = [
  {
    id: "data", icon: "◈", tag: "MARKET DATA", color: BLUE,
    glow: "rgba(79,172,254,.07)",
    title: "Live, always.",
    desc: "Real-time prices, P/E, volume and 52-week range across 40+ symbols — refreshed every 60 seconds.",
    gridArea: "1 / 1 / 3 / 2",
  },
  {
    id: "ai", icon: "✦", tag: "AI ANALYSIS", color: PURPLE,
    glow: "rgba(167,139,250,.07)",
    title: "Ask anything. Get verdicts.",
    desc: "Type in plain English. Get BUY / HOLD / SELL calls backed by your live portfolio and real market data.",
    gridArea: "1 / 2 / 2 / 4",
  },
  {
    id: "bt", icon: "◎", tag: "BACKTESTER", color: "#f472b6",
    glow: "rgba(244,114,182,.06)",
    title: "Test before you risk.",
    desc: "Describe a strategy in plain English — Quanta runs it on 3 months of real candles and scores it.",
    gridArea: "2 / 2 / 3 / 3",
  },
  {
    id: "pt", icon: "▣", tag: "PAPER TRADING", color: "#4ade80",
    glow: "rgba(74,222,128,.06)",
    title: "$100K, zero risk.",
    desc: "Execute real trades in a zero-risk sandbox. Track P&L, positions, and trade history like a pro.",
    gridArea: "2 / 3 / 3 / 4",
  },
];

const STEPS = [
  { n: "01", title: "Pick a stock", desc: "Choose from 40+ curated symbols or search any ticker on the market." },
  { n: "02", title: "Ask the AI", desc: "Get a verdict, breakdown, or full strategy — in the time it takes to type a sentence." },
  { n: "03", title: "Trade & track", desc: "Execute paper trades, run backtests, and watch your virtual P&L grow." },
];

const STATS = [
  { val: "40+",   label: "Live symbols" },
  { val: "$100K", label: "Virtual cash" },
  { val: "60s",   label: "Data refresh" },
  { val: "AI",    label: "Gemini-powered" },
];

const PREVIEW_STOCKS = [
  { sym: "NVDA", price: 167.42, chg: +3.21 },
  { sym: "AAPL", price: 213.18, chg: -0.84 },
  { sym: "MSFT", price: 415.50, chg: +1.12 },
  { sym: "TSLA", price: 248.73, chg: -2.40 },
];

/* ─── Main component ─────────────────────────────────────────── */
export default function LandingPage({ onEnter, watch, user }) {
  const [vis, setVis]         = useState(false);
  const [activeIdx, setActive] = useState(0);
  const btnProps              = useBtn();

  useEffect(() => { const t = setTimeout(() => setVis(true), 50); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % PREVIEW_STOCKS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const liveStocks = SYMBOLS.map(s => watch[s]).filter(Boolean);
  const tickerData = liveStocks.length > 0
    ? liveStocks.map(d => ({ sym: d.symbol, price: d.price, chg: d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0 }))
    : PREVIEW_STOCKS;
  const stocksToShow = tickerData.slice(0, 4);

  const glass = (extra = {}) => ({
    background: GLASS,
    border: `1px solid ${BORDER}`,
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,.05), 0 24px 48px rgba(0,0,0,.5)",
    ...extra,
  });

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      background: BG, overflowX: "hidden", overflowY: "auto",
      fontFamily: "'DM Sans', sans-serif", color: TEXT1,
    }}>

      {/* ── Ambient background ──────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-25%", left: "-8%", width: 920, height: 920, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.1) 0%,transparent 55%)", animation: "breathe 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "-5%", right: "-12%", width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.08) 0%,transparent 55%)", animation: "breathe 15s ease-in-out infinite 4s" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "35%", width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 60%)", animation: "breathe 18s ease-in-out infinite 8s" }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle,rgba(255,255,255,.055) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 30%,black 0%,transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 30%,black 0%,transparent 100%)",
        }} />
      </div>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(24px,5vw,56px)", height: 62,
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(4,7,15,.82)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg,#4facfe,#a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(79,172,254,.4)",
          }}>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 18, color: "#fff" }}>Q</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".18em" }}>QUANTA</span>
        </div>

        {/* Right nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {user && (
            <span style={{ fontSize: 12, color: TEXT3 }}>
              Hey, <span style={{ color: PURPLE }}>{user.name.split(" ")[0]}</span>
            </span>
          )}
          {/* Live dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(74,222,128,.07)", border: "1px solid rgba(74,222,128,.16)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, letterSpacing: ".1em" }}>LIVE</span>
          </div>
          <button onClick={onEnter} style={{
            padding: "8px 22px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 100%),linear-gradient(135deg,#4facfe,#7c6fff)",
            border: "none", color: "#fff",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.12),0 8px 28px rgba(79,172,254,.3),0 0 0 1px rgba(79,172,254,.18)",
            transition: "all .18s cubic-bezier(.34,1.56,.64,1)",
          }} {...btnProps}>
            Open Terminal
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "flex", minHeight: "calc(100dvh - 62px - 36px)",
        opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(22px)",
        transition: "opacity .85s ease, transform .85s ease",
      }}>

        {/* Left copy */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 0 0 clamp(28px,8vw,96px)",
        }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 30,
            padding: "5px 14px 5px 8px", borderRadius: 30, width: "fit-content",
            background: "rgba(79,172,254,.07)", border: "1px solid rgba(79,172,254,.18)",
          }}>
            <span style={{ fontSize: 10, background: "linear-gradient(135deg,#4facfe,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700, letterSpacing: ".06em" }}>◆</span>
            <span style={{ fontSize: 11, color: "rgba(148,163,184,.6)", letterSpacing: ".1em", fontWeight: 500 }}>AI-POWERED TRADING TERMINAL</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(40px,5.2vw,70px)", fontWeight: 400,
            lineHeight: 1.06, letterSpacing: "-.02em",
            margin: "0 0 6px", maxWidth: 540, color: TEXT1,
          }}>
            Institutional-grade
          </h1>
          <h1 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(40px,5.2vw,70px)", fontWeight: 400,
            lineHeight: 1.06, letterSpacing: "-.02em",
            margin: "0 0 26px", maxWidth: 540,
          }}>
            <span style={{
              background: "linear-gradient(108deg,#4facfe 0%,#a78bfa 52%,#f472b6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              analysis.
            </span>{" "}
            <span style={{ color: TEXT2, fontStyle: "italic", fontSize: "85%" }}>for everyone.</span>
          </h1>

          {/* Thin rainbow accent line */}
          <div style={{
            width: 200, height: 1, marginBottom: 28,
            background: "linear-gradient(90deg,#4facfe,#a78bfa,#f472b6,transparent)",
            borderRadius: 1,
          }} />

          <p style={{ fontSize: 16, color: TEXT2, maxWidth: 400, lineHeight: 1.78, margin: "0 0 40px" }}>
            Live data, AI verdicts in plain English, and a full paper trading sandbox — built for beginners who mean business.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 44, flexWrap: "wrap" }}>
            <button onClick={onEnter} style={{
              padding: "13px 38px", borderRadius: 40, fontSize: 14, fontWeight: 600, cursor: "pointer",
              background: "linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 100%),linear-gradient(135deg,#4facfe,#7c6fff,#a78bfa)",
              border: "none", color: "#fff",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.12),0 8px 28px rgba(79,172,254,.3),0 0 0 1px rgba(79,172,254,.18)",
              transition: "all .18s cubic-bezier(.34,1.56,.64,1)", letterSpacing: ".025em",
            }} {...btnProps}>
              Start Trading Free →
            </button>
            <button onClick={() => scrollTo("features")} style={{
              padding: "13px 26px", borderRadius: 40, fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`,
              color: TEXT2, transition: "all .15s", letterSpacing: ".02em",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = BORDER_H; e.currentTarget.style.color = TEXT1; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}>
              See how it works ↓
            </button>
          </div>

          {/* Trust row */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["◈","40+ live symbols"],["▣","$100K virtual cash"],["✦","AI-powered verdicts"]].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 11, color: BLUE, opacity: .7 }}>{icon}</span>
                <span style={{ fontSize: 12, color: TEXT3, fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: floating terminal */}
        <div style={{
          width: "44%", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "36px 5vw 36px 24px", position: "relative", zIndex: 5,
          opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(28px)",
          transition: "opacity .95s .18s ease, transform .95s .18s ease",
        }}>
          {/* Ambient glow behind card */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 380, height: 380, borderRadius: "50%",
            background: "radial-gradient(circle,rgba(79,172,254,.12) 0%,transparent 65%)",
            filter: "blur(20px)", pointerEvents: "none",
          }} />

          {/* Terminal card — subtle 3D tilt */}
          <div style={{
            width: "100%", maxWidth: 370,
            transform: "perspective(1100px) rotateY(-7deg) rotateX(2deg)",
            ...glass({ borderRadius: 22 }),
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.07),0 48px 96px rgba(0,0,0,.7),0 0 80px rgba(79,172,254,.08),0 0 0 1px rgba(255,255,255,.05)",
            overflow: "hidden", position: "relative", zIndex: 2,
          }}>
            {/* Window chrome */}
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#f87171","#fbbf24","#4ade80"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: .55 }} />)}
              </div>
              <span style={{ fontSize: 11, color: TEXT3, marginLeft: 6, letterSpacing: ".06em", flex: 1 }}>quanta — terminal</span>
              <span style={{ fontSize: 10, color: TEXT3, fontFamily: "monospace" }}>●  connected</span>
            </div>

            {/* Stock rows */}
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
              {stocksToShow.map((s, i) => {
                const isAct = i === activeIdx % 4;
                const up = s.chg >= 0;
                return (
                  <div key={s.sym} style={{
                    display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 12,
                    transition: "all .5s cubic-bezier(.4,0,.2,1)",
                    background: isAct ? (up ? "rgba(74,222,128,.06)" : "rgba(248,113,113,.06)") : "rgba(255,255,255,.02)",
                    border: `1px solid ${isAct ? (up ? "rgba(74,222,128,.18)" : "rgba(248,113,113,.18)") : "rgba(255,255,255,.04)"}`,
                    boxShadow: isAct ? `0 0 24px ${up ? "rgba(74,222,128,.04)" : "rgba(248,113,113,.04)"}` : "none",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: up ? "rgba(74,222,128,.09)" : "rgba(248,113,113,.09)",
                      border: `1px solid ${up ? "rgba(74,222,128,.18)" : "rgba(248,113,113,.18)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 13, color: up ? "#4ade80" : "#f87171" }}>{s.sym[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT1, fontVariantNumeric: "tabular-nums" }}>{s.sym}</div>
                      <div style={{ fontSize: 10, color: TEXT3, marginTop: 2 }}>NYSE · Live</div>
                    </div>
                    {/* Sparkline mini */}
                    <Sparkline
                      values={[40,48,38,55,50,62,58,70,65,78,72,84].map((v,j) => up ? v + j*1.2 : v - j*1.1)}
                      color={up ? "#4ade80" : "#f87171"} h={32} w={100}
                    />
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 64 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT1, fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>${f2(s.price)}</div>
                      <div style={{ fontSize: 11, color: up ? "#4ade80" : "#f87171", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {up ? "▲" : "▼"}{Math.abs(s.chg).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI chat preview */}
            <div style={{ padding: "0 14px 13px" }}>
              <div style={{ background: "rgba(79,172,254,.05)", border: "1px solid rgba(79,172,254,.13)", borderRadius: 13, padding: "11px 13px" }}>
                <div style={{ fontSize: 10, color: "rgba(79,172,254,.6)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 5 }}>QUANTA AI</div>
                <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.65, fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ color: "#4ade80", fontWeight: 700 }}>VERDICT: BUY</span> — NVDA is trading above its 20-day average ($158.40) with strong momentum. You could buy <span style={{ color: TEXT1, fontWeight: 600 }}>10 shares for $1,674</span>.
                </div>
              </div>
            </div>

            {/* Input bar */}
            <div style={{ padding: "0 14px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`, borderRadius: 11, padding: "9px 12px" }}>
                <span style={{ fontSize: 12, color: TEXT3, flex: 1 }}>Ask Quanta anything…</span>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,#4facfe,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 11 }}>↑</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div style={{
            position: "absolute", top: "14%", right: "3.5vw", zIndex: 3,
            background: "rgba(6,12,26,.92)", border: "1px solid rgba(74,222,128,.22)",
            borderRadius: 13, padding: "10px 15px", backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(74,222,128,.06)",
          }}>
            <div style={{ fontSize: 10, color: TEXT3, letterSpacing: ".08em", marginBottom: 3 }}>PORTFOLIO P&L</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#4ade80", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>+$4,218.50</div>
          </div>
          <div style={{
            position: "absolute", bottom: "20%", left: "22px", zIndex: 3,
            background: "rgba(6,12,26,.92)", border: "1px solid rgba(167,139,250,.22)",
            borderRadius: 13, padding: "10px 15px", backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,.5),0 0 20px rgba(167,139,250,.06)",
          }}>
            <div style={{ fontSize: 10, color: TEXT3, letterSpacing: ".08em", marginBottom: 3 }}>WIN RATE</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: PURPLE, fontVariantNumeric: "tabular-nums" }}>68.4%</div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ───────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        display: "grid", gridTemplateColumns: "repeat(4,1fr)",
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,.02)", backdropFilter: "blur(12px)",
      }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding: "26px 0", textAlign: "center",
            borderRight: i < STATS.length - 1 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{
              fontSize: "clamp(22px,2.8vw,34px)", fontWeight: 700,
              fontFamily: "monospace", fontVariantNumeric: "tabular-nums",
              background: "linear-gradient(135deg,#4facfe,#a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 5, letterSpacing: "-.01em",
            }}>{s.val}</div>
            <div style={{ fontSize: 11, color: TEXT3, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── BENTO FEATURES ──────────────────────────────────────── */}
      <div id="features" style={{ position: "relative", zIndex: 5, padding: "88px clamp(24px,7vw,80px)" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 11, color: TEXT3, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>Everything you need</div>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 400,
            margin: 0, color: TEXT1, letterSpacing: "-.01em",
          }}>
            One terminal. No compromises.
          </h2>
        </div>

        {/* Bento grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gridTemplateRows: "auto auto",
          gap: 14, maxWidth: 900, margin: "0 auto",
        }}>
          {BENTO.map((tile) => (
            <div key={tile.id} style={{
              gridArea: tile.gridArea,
              ...glass({ borderRadius: 22 }),
              padding: 28, position: "relative", overflow: "hidden",
              transition: "border-color .22s, box-shadow .22s, transform .22s",
              cursor: "default",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `rgba(${tile.color === BLUE ? "79,172,254" : tile.color === PURPLE ? "167,139,250" : tile.color === "#f472b6" ? "244,114,182" : "74,222,128"},.22)`;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,.07),0 32px 64px rgba(0,0,0,.6),0 0 40px ${tile.glow.replace("06)", "12)")}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.05),0 24px 48px rgba(0,0,0,.5)";
              }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: `radial-gradient(circle at 20% 20%,${tile.glow} 0%,transparent 60%)`,
              }} />
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, marginBottom: 18,
                background: `${tile.glow}`, border: `1px solid ${tile.glow.replace("07)", "18)")}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 18, color: tile.color }}>{tile.icon}</span>
              </div>
              {/* Tag */}
              <div style={{ fontSize: 10, color: tile.color, fontWeight: 700, letterSpacing: ".12em", marginBottom: 9, opacity: .8 }}>{tile.tag}</div>
              {/* Title */}
              <div style={{ fontSize: 17, fontWeight: 600, color: TEXT1, marginBottom: 10, lineHeight: 1.3 }}>{tile.title}</div>
              {/* Desc */}
              <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.72 }}>{tile.desc}</div>

              {/* Feature preview for the first (tall) tile */}
              {tile.id === "data" && (
                <div style={{ marginTop: 24, padding: "14px", background: "rgba(255,255,255,.03)", borderRadius: 14, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 10, color: TEXT3, letterSpacing: ".08em", marginBottom: 10 }}>NVDA · LIVE PRICE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: TEXT1, fontFamily: "monospace", marginBottom: 4 }}>$167.42</div>
                  <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 600, marginBottom: 12 }}>▲ 3.21% today</div>
                  <Sparkline values={[140,145,138,152,148,160,155,165,160,170,164,168]} color={BLUE} h={48} w={180} />
                </div>
              )}
              {tile.id === "ai" && (
                <div style={{ marginTop: 20, padding: "12px 14px", background: "rgba(167,139,250,.05)", borderRadius: 12, border: "1px solid rgba(167,139,250,.12)" }}>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, fontStyle: "italic" }}>
                    "Should I hold my NVDA position?"
                  </div>
                  <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6, marginTop: 8 }}>
                    <span style={{ color: "#4ade80", fontWeight: 700 }}>HOLD</span> — momentum is strong but you're near resistance at $170. Consider a stop at $158.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 5, padding: "0 clamp(24px,8vw,96px) 96px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: TEXT3, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>How it works</div>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(26px,3.2vw,44px)", fontWeight: 400, margin: 0, color: TEXT1,
          }}>
            From zero to trading in{" "}
            <span style={{ background: "linear-gradient(108deg,#4facfe,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              minutes.
            </span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 820, margin: "0 auto", position: "relative" }}>
          {/* Connector line */}
          <div style={{
            position: "absolute", top: 28, left: "calc(16.67% + 20px)", right: "calc(16.67% + 20px)",
            height: 1, background: `linear-gradient(90deg,${BORDER},${BORDER_H},${BORDER})`,
            pointerEvents: "none",
          }} />

          {STEPS.map((s, i) => (
            <div key={i} style={{
              ...glass({ borderRadius: 20 }),
              padding: "26px 22px",
              transition: "border-color .2s, transform .2s, box-shadow .2s",
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(79,172,254,.2)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.07),0 32px 56px rgba(0,0,0,.55),0 0 28px rgba(79,172,254,.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.05),0 24px 48px rgba(0,0,0,.5)";
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", marginBottom: 18,
                border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: BLUE, fontWeight: 700 }}>{s.n}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: TEXT1, marginBottom: 9 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.72 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 5,
        margin: "0 clamp(24px,7vw,80px) 88px",
        ...glass({ borderRadius: 26 }),
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.06),0 32px 80px rgba(0,0,0,.5),0 0 80px rgba(79,172,254,.05)",
        padding: "68px clamp(28px,6vw,72px)", textAlign: "center",
        overflow: "hidden",
      }}>
        {/* CTA background glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 50% 50%,rgba(79,172,254,.05) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(26px,3vw,42px)", fontWeight: 400, margin: "0 0 14px", color: TEXT1,
          }}>
            Ready to trade smarter?
          </h2>
          <p style={{ fontSize: 15, color: TEXT2, margin: "0 auto 36px", maxWidth: 380, lineHeight: 1.75 }}>
            No credit card. No real money. Just AI insights, live data, and $100,000 to practice with.
          </p>
          <button onClick={onEnter} style={{
            padding: "15px 52px", borderRadius: 40, fontSize: 15, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 100%),linear-gradient(135deg,#4facfe,#7c6fff,#a78bfa)",
            border: "none", color: "#fff",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.16),0 12px 40px rgba(79,172,254,.4),0 0 0 1px rgba(79,172,254,.24)",
            transition: "all .18s cubic-bezier(.34,1.56,.64,1)", letterSpacing: ".03em",
          }} {...btnProps}>
            Open the Terminal →
          </button>
        </div>
      </div>

      {/* ── LIVE TICKER STRIP ───────────────────────────────────── */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 50,
        height: 36, display: "flex", alignItems: "center", overflow: "hidden",
        borderTop: `1px solid ${BORDER}`,
        background: "rgba(4,7,15,.96)", backdropFilter: "blur(20px)",
        flexShrink: 0,
      }}>
        {liveStocks.length > 0 ? (
          <div style={{ display: "flex", animation: "ticker 55s linear infinite", whiteSpace: "nowrap" }}>
            {[...tickerData, ...tickerData].map((d, i) => (
              <span key={i} style={{ padding: "0 26px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ color: TEXT3, fontWeight: 600, letterSpacing: ".06em" }}>{d.sym}</span>
                <span style={{ color: "#cbd5e1", fontWeight: 500, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}>${f2(d.price)}</span>
                <span style={{ color: d.chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>{d.chg >= 0 ? "▲" : "▼"}{Math.abs(d.chg).toFixed(2)}%</span>
                <span style={{ color: "rgba(255,255,255,.05)", fontSize: 14 }}>·</span>
              </span>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 36, padding: "0 24px", alignItems: "center" }}>
            {[70,52,80,58,72,52,68,58].map((w, i) => <div key={i} className="skel" style={{ width: w, height: 7, borderRadius: 4 }} />)}
          </div>
        )}
      </div>
    </div>
  );
}
