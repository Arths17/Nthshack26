import { useEffect, useState, useRef } from "react";
import { f2, SYMBOLS } from "../utils/formatters";

/* ══════════════════════════════════════════════════════════════════
   PREMIUM ANIMATED SPARKLINE
   ══════════════════════════════════════════════════════════════════ */
function Sparkline({ values = [40, 48, 38, 55, 50, 62, 58, 70, 65, 78, 72, 84], color = "#6366f1", h = 40, w = 140 }) {
  const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
  const step = w / (values.length - 1);
  const y = v => h - 4 - ((v - mn) / rng) * (h - 8);
  const d = values.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const fill = d + ` L${w},${h} L0,${h} Z`;
  const gradientId = `spark-${color.replace("#", "")}`;
  
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradientId})`} />
      <path 
        d={d} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER COMPONENT
   ══════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1000 }) {
  const [current, setCurrent] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const animate = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCurrent(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{prefix}{current.toLocaleString()}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════════════════
   FEATURE CARDS DATA
   ══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    id: "data",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 14l4-4 4 4 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tag: "MARKET DATA",
    title: "Real-time market intelligence",
    desc: "Live prices, P/E ratios, volume, and 52-week ranges across 40+ symbols — refreshed every 60 seconds with institutional-grade accuracy.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    id: "ai",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    tag: "AI ANALYSIS",
    title: "Ask anything, get verdicts",
    desc: "Natural language queries return BUY, HOLD, or SELL recommendations backed by real portfolio data and live market conditions.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "backtest",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    tag: "BACKTESTING",
    title: "Test before you risk",
    desc: "Describe any strategy in plain English. Quanta runs it against 3 months of real candle data and scores its performance.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "paper",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    tag: "PAPER TRADING",
    title: "$100K sandbox, zero risk",
    desc: "Execute trades in a risk-free environment. Track P&L, manage positions, and review your complete trade history like a pro.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const STATS = [
  { value: 40, suffix: "+", label: "Live Symbols" },
  { value: 100, prefix: "$", suffix: "K", label: "Virtual Cash" },
  { value: 60, suffix: "s", label: "Data Refresh" },
  { value: 24, suffix: "/7", label: "Availability" },
];

const PREVIEW_STOCKS = [
  { sym: "NVDA", name: "NVIDIA Corp", price: 167.42, chg: +3.21 },
  { sym: "AAPL", name: "Apple Inc", price: 213.18, chg: -0.84 },
  { sym: "MSFT", name: "Microsoft", price: 415.50, chg: +1.12 },
  { sym: "TSLA", name: "Tesla Inc", price: 248.73, chg: -2.40 },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onEnter, watch, user }) {
  const [visible, setVisible] = useState(false);
  const [activeStock, setActiveStock] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStock(i => (i + 1) % PREVIEW_STOCKS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const liveStocks = SYMBOLS.map(s => watch[s]).filter(Boolean);
  const stocksToShow = liveStocks.length > 0
    ? liveStocks.slice(0, 4).map(d => ({
        sym: d.symbol,
        name: d.name || d.symbol,
        price: d.price,
        chg: d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0
      }))
    : PREVIEW_STOCKS;

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "var(--q-bg)",
      overflowX: "hidden",
      overflowY: "auto",
      fontFamily: "var(--q-font-sans)",
      color: "var(--q-text)",
      position: "relative",
    }}>

      {/* ══════════════════════════════════════════════════════════════
          AMBIENT BACKGROUND
          ══════════════════════════════════════════════════════════════ */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {/* Main gradient orb */}
        <div style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "140%",
          height: "100%",
          background: "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(99, 102, 241, 0.12), transparent 70%)",
        }} />
        {/* Secondary orb */}
        <div style={{
          position: "absolute",
          top: "60%",
          right: "-10%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
          animation: "breathe 15s ease-in-out infinite",
        }} />
        {/* Grid pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 0%, transparent 70%)",
        }} />
        {/* Interactive glow */}
        <div style={{
          position: "absolute",
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 60%)",
          transition: "left 0.3s ease-out, top 0.3s ease-out",
          pointerEvents: "none",
        }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION
          ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(24px, 5vw, 64px)",
        height: 72,
        borderBottom: "1px solid var(--q-border-muted)",
        background: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--q-gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}>
            <span style={{ fontFamily: "var(--q-font-display)", fontWeight: 700, fontSize: 18, color: "#fff" }}>Q</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.12em", color: "var(--q-text-bright)" }}>QUANTA</span>
        </div>

        {/* Nav Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user && (
            <span style={{ fontSize: 13, color: "var(--q-text-muted)" }}>
              Welcome back, <span style={{ color: "var(--q-accent-light)", fontWeight: 600 }}>{user.name?.split(" ")[0]}</span>
            </span>
          )}
          {/* Live indicator */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "var(--q-success-subtle)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--q-success)",
              boxShadow: "0 0 12px var(--q-success-glow)",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, color: "var(--q-success)", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
          </div>
          {/* CTA Button */}
          <button
            onClick={onEnter}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "var(--q-gradient-accent)",
              border: "none",
              color: "#fff",
              boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
            }}
          >
            Open Terminal
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        zIndex: 5,
        minHeight: "calc(100dvh - 72px)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 48,
        alignItems: "center",
        padding: "0 clamp(32px, 6vw, 96px)",
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%",
      }}>
        {/* Left: Copy */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(24px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px 8px 10px",
            borderRadius: 999,
            background: "var(--q-accent-subtle)",
            border: "1px solid var(--q-border-accent)",
            width: "fit-content",
            animation: "fadeUp 0.6s 0.2s both",
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--q-accent)",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: 12, color: "var(--q-accent-light)", fontWeight: 600, letterSpacing: "0.05em" }}>
              AI-POWERED TRADING TERMINAL
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--q-font-display)",
            fontSize: "clamp(48px, 5.5vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--q-text-bright)",
            margin: 0,
            animation: "fadeUp 0.6s 0.3s both",
          }}>
            Institutional-grade
            <br />
            <span style={{
              background: "var(--q-gradient-brand)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              analysis.
            </span>
            {" "}
            <span style={{ color: "var(--q-text-muted)", fontWeight: 400 }}>
              For everyone.
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 18,
            color: "var(--q-text-secondary)",
            lineHeight: 1.7,
            maxWidth: 480,
            margin: 0,
            animation: "fadeUp 0.6s 0.4s both",
          }}>
            Live market data, AI-powered verdicts in plain English, and a full paper trading sandbox — built for beginners who mean business.
          </p>

          {/* CTAs */}
          <div style={{
            display: "flex",
            gap: 14,
            animation: "fadeUp 0.6s 0.5s both",
          }}>
            <button
              onClick={onEnter}
              style={{
                padding: "16px 32px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                background: "var(--q-gradient-brand)",
                border: "none",
                color: "#fff",
                boxShadow: "0 12px 40px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-3px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
            >
              Start Trading Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={scrollToFeatures}
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 500,
                cursor: "pointer",
                background: "var(--q-surface-1)",
                border: "1px solid var(--q-border)",
                color: "var(--q-text-secondary)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "var(--q-border-strong)";
                e.currentTarget.style.background = "var(--q-surface-2)";
                e.currentTarget.style.color = "var(--q-text)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--q-border)";
                e.currentTarget.style.background = "var(--q-surface-1)";
                e.currentTarget.style.color = "var(--q-text-secondary)";
              }}
            >
              Learn More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </button>
          </div>

          {/* Trust badges */}
          <div style={{
            display: "flex",
            gap: 32,
            paddingTop: 16,
            animation: "fadeUp 0.6s 0.6s both",
          }}>
            {[
              { icon: "chart", text: "40+ Live Symbols" },
              { icon: "dollar", text: "$100K Virtual Cash" },
              { icon: "ai", text: "AI-Powered Analysis" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--q-surface-1)",
                  border: "1px solid var(--q-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {item.icon === "chart" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--q-accent)" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18M7 14l4-4 4 4 5-5" /></svg>
                  )}
                  {item.icon === "dollar" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--q-success)" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                  )}
                  {item.icon === "ai" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--q-cyan)" strokeWidth="2" strokeLinecap="round"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" /></svg>
                  )}
                </div>
                <span style={{ fontSize: 13, color: "var(--q-text-muted)", fontWeight: 500 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Terminal Preview */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateX(32px)",
          transition: "all 0.9s 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Glow behind card */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            maxWidth: 500,
            maxHeight: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
            filter: "blur(40px)",
            animation: "breathe 8s ease-in-out infinite",
          }} />

          {/* Terminal Card */}
          <div style={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 24,
            background: "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            boxShadow: `
              0 48px 100px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.08)
            `,
            overflow: "hidden",
            transform: "perspective(1200px) rotateY(-5deg) rotateX(2deg)",
          }}>
            {/* Window chrome */}
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--q-border-muted)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
            }}>
              <div style={{ display: "flex", gap: 8 }}>
                {["#ef4444", "#f59e0b", "#10b981"].map(c => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ flex: 1, fontSize: 12, color: "var(--q-text-faint)", textAlign: "center", letterSpacing: "0.05em" }}>
                quanta — terminal
              </span>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10,
                color: "var(--q-success)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--q-success)", animation: "pulse 2s infinite" }} />
                connected
              </div>
            </div>

            {/* Stock rows */}
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {stocksToShow.map((s, i) => {
                const isActive = i === activeStock;
                const up = s.chg >= 0;
                return (
                  <div
                    key={s.sym}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 14,
                      background: isActive ? (up ? "var(--q-success-bg)" : "var(--q-danger-bg)") : "var(--q-surface-1)",
                      border: `1px solid ${isActive ? (up ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)") : "var(--q-border)"}`,
                      transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      transform: isActive ? "scale(1.02)" : "scale(1)",
                    }}
                  >
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: up ? "var(--q-success-subtle)" : "var(--q-danger-subtle)",
                      border: `1px solid ${up ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: "var(--q-font-display)", fontWeight: 700, fontSize: 14, color: up ? "var(--q-success)" : "var(--q-danger)" }}>
                        {s.sym[0]}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--q-text-bright)" }}>{s.sym}</div>
                      <div style={{ fontSize: 11, color: "var(--q-text-faint)", marginTop: 2 }}>{s.name}</div>
                    </div>
                    <Sparkline
                      values={[40, 48, 38, 55, 50, 62, 58, 70, 65, 78, 72, 84].map((v, j) => up ? v + j * 1.5 : v - j * 1.2)}
                      color={up ? "#10b981" : "#ef4444"}
                      h={36}
                      w={90}
                    />
                    <div style={{ textAlign: "right", minWidth: 70 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--q-text-bright)", fontFamily: "var(--q-font-mono)" }}>
                        ${f2(s.price)}
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: up ? "var(--q-success)" : "var(--q-danger)",
                        fontFamily: "var(--q-font-mono)",
                      }}>
                        {up ? "+" : ""}{s.chg.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI preview */}
            <div style={{ padding: "0 14px 14px" }}>
              <div style={{
                padding: 16,
                borderRadius: 14,
                background: "var(--q-accent-subtle)",
                border: "1px solid var(--q-border-accent)",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "var(--q-gradient-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--q-accent-light)", letterSpacing: "0.08em" }}>
                    QUANTA AI
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--q-text-secondary)", lineHeight: 1.7, margin: 0 }}>
                  <span style={{ color: "var(--q-success)", fontWeight: 700 }}>VERDICT: BUY</span> — NVDA is trading near support with strong momentum and institutional interest...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        zIndex: 5,
        padding: "80px clamp(32px, 6vw, 96px)",
        borderTop: "1px solid var(--q-border-muted)",
        borderBottom: "1px solid var(--q-border-muted)",
        background: "linear-gradient(180deg, transparent 0%, rgba(99, 102, 241, 0.03) 50%, transparent 100%)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32,
        }}>
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding: "32px 24px",
                borderRadius: 20,
                background: "var(--q-surface-1)",
                border: "1px solid var(--q-border)",
                transition: "all 0.3s ease",
              }}
            >
              <div style={{
                fontSize: 48,
                fontWeight: 700,
                fontFamily: "var(--q-font-display)",
                color: "var(--q-text-bright)",
                marginBottom: 8,
                background: i === 0 ? "var(--q-gradient-brand)" : "none",
                WebkitBackgroundClip: i === 0 ? "text" : "none",
                WebkitTextFillColor: i === 0 ? "transparent" : "inherit",
              }}>
                <AnimatedNumber
                  value={stat.value}
                  prefix={stat.prefix || ""}
                  suffix={stat.suffix || ""}
                  duration={1500}
                />
              </div>
              <div style={{ fontSize: 14, color: "var(--q-text-muted)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section id="features" style={{
        position: "relative",
        zIndex: 5,
        padding: "120px clamp(32px, 6vw, 96px)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 999,
              background: "var(--q-surface-1)",
              border: "1px solid var(--q-border)",
              marginBottom: 24,
            }}>
              <span style={{ fontSize: 12, color: "var(--q-text-muted)", fontWeight: 600, letterSpacing: "0.08em" }}>
                FEATURES
              </span>
            </div>
            <h2 style={{
              fontFamily: "var(--q-font-display)",
              fontSize: "clamp(36px, 4vw, 52px)",
              fontWeight: 700,
              color: "var(--q-text-bright)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 20,
            }}>
              Everything you need to
              <br />
              <span style={{
                background: "var(--q-gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                trade smarter
              </span>
            </h2>
            <p style={{
              fontSize: 18,
              color: "var(--q-text-secondary)",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.7,
            }}>
              Professional trading tools and AI-powered insights, designed for modern retail traders.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}>
            {FEATURES.map((feature, i) => (
              <div
                key={feature.id}
                style={{
                  padding: 32,
                  borderRadius: 24,
                  background: "var(--q-bg-card)",
                  border: "1px solid var(--q-border)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--q-border-strong)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(99, 102, 241, 0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--q-border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${feature.gradient.includes("indigo") ? "#6366f1" : feature.gradient.includes("emerald") ? "#10b981" : feature.gradient.includes("pink") ? "#ec4899" : "#8b5cf6"}15, transparent)`,
                  border: "1px solid var(--q-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                  color: feature.gradient.includes("indigo") ? "#818cf8" : feature.gradient.includes("emerald") ? "#34d399" : feature.gradient.includes("pink") ? "#f472b6" : "#a78bfa",
                }}>
                  {feature.icon}
                </div>
                {/* Tag */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--q-text-faint)",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}>
                  {feature.tag}
                </div>
                {/* Title */}
                <h3 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--q-text-bright)",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}>
                  {feature.title}
                </h3>
                {/* Description */}
                <p style={{
                  fontSize: 15,
                  color: "var(--q-text-secondary)",
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA SECTION
          ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        zIndex: 5,
        padding: "120px clamp(32px, 6vw, 96px)",
      }}>
        <div style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "80px 64px",
          borderRadius: 32,
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)",
          border: "1px solid var(--q-border-accent)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Background glow */}
          <div style={{
            position: "absolute",
            top: "-50%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 60%)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{
              fontFamily: "var(--q-font-display)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 700,
              color: "var(--q-text-bright)",
              lineHeight: 1.2,
              marginBottom: 20,
            }}>
              Ready to start trading?
            </h2>
            <p style={{
              fontSize: 18,
              color: "var(--q-text-secondary)",
              maxWidth: 500,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}>
              Join thousands of traders using Quanta to make smarter investment decisions.
            </p>
            <button
              onClick={onEnter}
              style={{
                padding: "18px 40px",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                background: "var(--q-gradient-brand)",
                border: "none",
                color: "#fff",
                boxShadow: "0 16px 48px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 20px 56px rgba(99, 102, 241, 0.6), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(99, 102, 241, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)";
              }}
            >
              Launch Terminal
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════════════ */}
      <footer style={{
        position: "relative",
        zIndex: 5,
        padding: "40px clamp(32px, 6vw, 96px)",
        borderTop: "1px solid var(--q-border-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--q-gradient-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ fontFamily: "var(--q-font-display)", fontWeight: 700, fontSize: 14, color: "#fff" }}>Q</span>
          </div>
          <span style={{ fontSize: 13, color: "var(--q-text-muted)" }}>
            Quanta AI Trading Terminal
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--q-text-faint)" }}>
          Paper trading only. Not financial advice.
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════
          RESPONSIVE STYLES
          ══════════════════════════════════════════════════════════════ */}
      <style>{`
        @media (max-width: 1024px) {
          section:first-of-type {
            grid-template-columns: 1fr !important;
            text-align: center;
            padding-top: 60px !important;
            padding-bottom: 60px !important;
            min-height: auto !important;
          }
          section:first-of-type > div:first-child {
            align-items: center;
          }
          section:first-of-type > div:last-child {
            display: none !important;
          }
          section:first-of-type h1 br {
            display: none;
          }
        }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section > div > div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
          footer {
            flex-direction: column !important;
            gap: 16px !important;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
