import { useEffect, useState, useRef, useCallback } from "react";
import { f2, SYMBOLS } from "../utils/formatters";

/* ══════════════════════════════════════════════════════════════════
   WISPR-STYLE MOTION SYSTEM
   - Easing: cubic-bezier(0.16, 1, 0.3, 1) — snappy but smooth
   - Duration: 300-500ms for most transitions
   - Entry: Staggered fade-in-up with 0.05s delays
   ══════════════════════════════════════════════════════════════════ */

const MOTION = {
  ease: "cubic-bezier(0.16, 1, 0.3, 1)",
  duration: {
    fast: "200ms",
    normal: "350ms",
    slow: "500ms",
  },
};

/* ══════════════════════════════════════════════════════════════════
   INTERSECTION OBSERVER HOOK — Scroll-triggered reveals
   ══════════════════════════════════════════════════════════════════ */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isInView];
}

/* ══════════════════════════════════════════════════════════════════
   ANIMATED COUNTER — Premium number animations
   ══════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  const [ref, isInView] = useInView();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out expo for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{prefix}{current.toLocaleString()}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════════════════
   MINI SPARKLINE — Clean, minimal chart
   ══════════════════════════════════════════════════════════════════ */
function Sparkline({ values = [], color = "#10b981", h = 32, w = 80 }) {
  if (values.length < 2) return null;
  const mn = Math.min(...values), mx = Math.max(...values), rng = mx - mn || 1;
  const step = w / (values.length - 1);
  const y = v => h - 2 - ((v - mn) / rng) * (h - 4);
  const d = values.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`spark-${color.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + ` L${w},${h} L0,${h} Z`} fill={`url(#spark-${color.slice(1)})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAGNETIC BUTTON — Subtle cursor attraction
   ══════════════════════════════════════════════════════════════════ */
function MagneticButton({ children, onClick, variant = "primary", size = "default", style = {} }) {
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    setPosition({ x: deltaX, y: deltaY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  const baseStyles = {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "var(--q-font-sans)",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: `transform ${MOTION.duration.normal} ${MOTION.ease}, box-shadow ${MOTION.duration.normal} ${MOTION.ease}`,
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  const variants = {
    primary: {
      padding: size === "large" ? "16px 32px" : "12px 24px",
      fontSize: size === "large" ? 15 : 14,
      borderRadius: 10,
      background: "#fff",
      color: "#030712",
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    },
    secondary: {
      padding: size === "large" ? "16px 32px" : "12px 24px",
      fontSize: size === "large" ? 15 : 14,
      borderRadius: 10,
      background: "transparent",
      color: "var(--q-text-secondary)",
      border: "1px solid var(--q-border)",
    },
    ghost: {
      padding: "10px 20px",
      fontSize: 14,
      borderRadius: 8,
      background: "transparent",
      color: "var(--q-text-muted)",
    },
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...baseStyles, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BENTO CARD — Border glow trace on hover
   ══════════════════════════════════════════════════════════════════ */
function BentoCard({ children, delay = 0, className = "" }) {
  const [ref, isInView] = useInView();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <div
      ref={(node) => {
        ref.current = node;
        cardRef.current = node;
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: "relative",
        padding: 32,
        borderRadius: 16,
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity ${MOTION.duration.slow} ${MOTION.ease} ${delay}ms, transform ${MOTION.duration.slow} ${MOTION.ease} ${delay}ms, border-color ${MOTION.duration.normal} ${MOTION.ease}, box-shadow ${MOTION.duration.normal} ${MOTION.ease}`,
        borderColor: isHovered ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.06)",
        boxShadow: isHovered ? "0 20px 40px rgba(0, 0, 0, 0.3)" : "none",
      }}
    >
      {/* Border glow trace effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 16,
          opacity: isHovered ? 1 : 0,
          transition: `opacity ${MOTION.duration.normal} ${MOTION.ease}`,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.06), transparent 40%)`,
          pointerEvents: "none",
        }}
      />
      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    id: "data",
    label: "Market Data",
    title: "Real-time market intelligence",
    desc: "Live prices, P/E ratios, volume, and 52-week ranges across 40+ symbols. Institutional-grade data refreshed every 60 seconds.",
  },
  {
    id: "ai",
    label: "AI Analysis",
    title: "Natural language queries",
    desc: "Ask anything about your portfolio or the market. Get BUY, HOLD, or SELL recommendations backed by real data.",
  },
  {
    id: "backtest",
    label: "Backtesting",
    title: "Validate before you trade",
    desc: "Describe any strategy in plain English. Run it against 3 months of real candle data and score its performance.",
  },
  {
    id: "paper",
    label: "Paper Trading",
    title: "$100K virtual sandbox",
    desc: "Execute trades risk-free. Track P&L, manage positions, and review your complete trade history.",
  },
];

const STATS = [
  { value: 40, suffix: "+", label: "Live Symbols" },
  { value: 100, prefix: "$", suffix: "K", label: "Virtual Capital" },
  { value: 60, suffix: "s", label: "Refresh Rate" },
  { value: 99, suffix: "%", label: "Uptime" },
];

const PREVIEW_STOCKS = [
  { sym: "NVDA", name: "NVIDIA Corp", price: 875.42, chg: 2.84 },
  { sym: "AAPL", name: "Apple Inc", price: 213.18, chg: -0.39 },
  { sym: "MSFT", name: "Microsoft", price: 415.50, chg: 0.27 },
  { sym: "TSLA", name: "Tesla Inc", price: 248.73, chg: -0.96 },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════ */
export default function LandingPage({ onEnter, watch, user }) {
  const [mounted, setMounted] = useState(false);
  const [heroRef, heroInView] = useInView();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Get live data or fallback to preview
  const liveStocks = SYMBOLS.map(s => watch[s]).filter(Boolean);
  const stocksToShow = liveStocks.length > 0
    ? liveStocks.slice(0, 4).map(d => ({
        sym: d.symbol,
        name: d.name || d.symbol,
        price: d.price,
        chg: d.price && d.prevClose ? ((d.price - d.prevClose) / d.prevClose * 100) : 0
      }))
    : PREVIEW_STOCKS;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#030712",
      color: "#e2e8f0",
      fontFamily: "var(--q-font-sans)",
      overflowX: "hidden",
    }}>
      {/* ══════════════════════════════════════════════════════════════
          SUBTLE BACKGROUND
          ══════════════════════════════════════════════════════════════ */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {/* Subtle top gradient */}
        <div style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 1200,
          height: 600,
          background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99, 102, 241, 0.08), transparent)",
        }} />
        {/* Noise texture overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NAVIGATION — Clean, minimal
          ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(24px, 5vw, 80px)",
        height: 64,
        background: "rgba(3, 7, 18, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#030712" }}>Q</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.1em", color: "#f8fafc" }}>QUANTA</span>
        </div>

        {/* Nav right */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {user && (
            <span style={{ fontSize: 13, color: "var(--q-text-muted)" }}>
              {user.name?.split(" ")[0]}
            </span>
          )}
          <MagneticButton onClick={onEnter} variant="primary" size="default">
            Open Terminal
          </MagneticButton>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION — Large, centered, minimal
          ══════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "calc(100dvh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px clamp(24px, 5vw, 80px)",
          textAlign: "center",
        }}
      >
        {/* Pill badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: 32,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all ${MOTION.duration.slow} ${MOTION.ease}`,
          }}
        >
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
          }} />
          <span style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.9)", fontWeight: 500, letterSpacing: "0.02em" }}>
            AI-Powered Trading Terminal
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: "clamp(48px, 7vw, 80px)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
            margin: 0,
            maxWidth: 900,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all ${MOTION.duration.slow} ${MOTION.ease} 100ms`,
          }}
        >
          Institutional-grade
          <br />
          analysis for everyone
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: "clamp(16px, 2vw, 19px)",
            color: "rgba(148, 163, 184, 0.8)",
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "28px 0 40px",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all ${MOTION.duration.slow} ${MOTION.ease} 200ms`,
          }}
        >
          Live market data, AI-powered verdicts, and a full paper trading sandbox. Built for traders who mean business.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
            transition: `all ${MOTION.duration.slow} ${MOTION.ease} 300ms`,
          }}
        >
          <MagneticButton onClick={onEnter} variant="primary" size="large">
            Start Trading
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </MagneticButton>
          <MagneticButton
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            variant="secondary"
            size="large"
          >
            Learn More
          </MagneticButton>
        </div>

        {/* Terminal preview card */}
        <div
          style={{
            marginTop: 80,
            width: "100%",
            maxWidth: 520,
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            overflow: "hidden",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: `all ${MOTION.duration.slow} ${MOTION.ease} 400ms`,
          }}
        >
          {/* Window chrome */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#ef4444", "#f59e0b", "#10b981"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.6 }} />
              ))}
            </div>
            <span style={{ flex: 1, fontSize: 11, color: "rgba(148, 163, 184, 0.5)", textAlign: "center", letterSpacing: "0.05em" }}>
              quanta terminal
            </span>
          </div>

          {/* Stock rows */}
          <div style={{ padding: 12 }}>
            {stocksToShow.map((s, i) => {
              const up = s.chg >= 0;
              return (
                <div
                  key={s.sym}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: i === 0 ? "rgba(255, 255, 255, 0.03)" : "transparent",
                    marginBottom: i < stocksToShow.length - 1 ? 4 : 0,
                    transition: `background ${MOTION.duration.fast} ${MOTION.ease}`,
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(148, 163, 184, 0.8)",
                  }}>
                    {s.sym.slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{s.sym}</div>
                    <div style={{ fontSize: 11, color: "rgba(148, 163, 184, 0.5)", marginTop: 2 }}>{s.name}</div>
                  </div>
                  <Sparkline
                    values={[40, 45, 42, 48, 44, 52, 49, 55, 51, 58, 54, 60].map((v, j) => up ? v + j * 1.2 : v - j * 0.8)}
                    color={up ? "#10b981" : "#ef4444"}
                    h={28}
                    w={64}
                  />
                  <div style={{ textAlign: "right", minWidth: 72 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", fontFamily: "var(--q-font-mono)" }}>
                      ${f2(s.price)}
                    </div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: up ? "#10b981" : "#ef4444",
                      fontFamily: "var(--q-font-mono)",
                    }}>
                      {up ? "+" : ""}{s.chg.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: mounted ? 0.4 : 0,
            transition: `opacity ${MOTION.duration.slow} ${MOTION.ease} 600ms`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS SECTION — Clean metrics
          ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "80px clamp(24px, 5vw, 80px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 24,
        }}>
          {STATS.map((stat, i) => {
            const [ref, isInView] = useInView();
            return (
              <div
                key={stat.label}
                ref={ref}
                style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  opacity: isInView ? 1 : 0,
                  transform: isInView ? "translateY(0)" : "translateY(20px)",
                  transition: `all ${MOTION.duration.slow} ${MOTION.ease} ${i * 50}ms`,
                }}
              >
                <div style={{
                  fontSize: 36,
                  fontWeight: 600,
                  color: "#f8fafc",
                  fontFamily: "var(--q-font-mono)",
                  marginBottom: 8,
                }}>
                  <AnimatedNumber value={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix || ""} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(148, 163, 184, 0.6)", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES SECTION — Bento grid with border glow
          ══════════════════════════════════════════════════════════════ */}
      <section id="features" style={{
        position: "relative",
        zIndex: 1,
        padding: "120px clamp(24px, 5vw, 80px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionHeader
              label="Features"
              title="Everything you need to trade smarter"
              desc="Professional-grade tools designed for modern retail traders."
            />
          </div>

          {/* Bento grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}>
            {FEATURES.map((feature, i) => (
              <BentoCard key={feature.id} delay={i * 50}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(148, 163, 184, 0.5)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}>
                  {feature.label}
                </div>
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#f8fafc",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 14,
                  color: "rgba(148, 163, 184, 0.7)",
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {feature.desc}
                </p>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA SECTION — Clean, focused
          ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "120px clamp(24px, 5vw, 80px)",
      }}>
        <div style={{
          maxWidth: 700,
          margin: "0 auto",
          textAlign: "center",
        }}>
          <SectionHeader
            title="Ready to start trading?"
            desc="Join traders using Quanta to make smarter investment decisions with AI-powered analysis."
          />
          <div style={{ marginTop: 40 }}>
            <MagneticButton onClick={onEnter} variant="primary" size="large">
              Launch Terminal
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER — Minimal
          ══════════════════════════════════════════════════════════════ */}
      <footer style={{
        position: "relative",
        zIndex: 1,
        padding: "32px clamp(24px, 5vw, 80px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: "rgba(255, 255, 255, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f8fafc" }}>Q</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.5)" }}>Quanta</span>
        </div>
        <span style={{ fontSize: 12, color: "rgba(148, 163, 184, 0.4)" }}>
          Paper trading only. Not financial advice.
        </span>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION HEADER — Reusable component
   ══════════════════════════════════════════════════════════════════ */
function SectionHeader({ label, title, desc }) {
  const [ref, isInView] = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(20px)",
        transition: `all ${MOTION.duration.slow} ${MOTION.ease}`,
      }}
    >
      {label && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "6px 12px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 11, color: "rgba(148, 163, 184, 0.7)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {label}
          </span>
        </div>
      )}
      <h2 style={{
        fontSize: "clamp(28px, 4vw, 40px)",
        fontWeight: 600,
        color: "#f8fafc",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        margin: 0,
        marginBottom: desc ? 16 : 0,
      }}>
        {title}
      </h2>
      {desc && (
        <p style={{
          fontSize: 16,
          color: "rgba(148, 163, 184, 0.7)",
          lineHeight: 1.6,
          maxWidth: 500,
          margin: "0 auto",
        }}>
          {desc}
        </p>
      )}
    </div>
  );
}
