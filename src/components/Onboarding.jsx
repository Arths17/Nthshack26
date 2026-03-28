import { useState, useEffect } from "react";

const STEPS = [
  {
    icon: "◈",
    title: "Welcome to Quanta",
    body: "This is your AI-powered trading terminal. You start with $100,000 of virtual cash — no real money, no real risk. Everything here uses real live market data.",
    cta: "Let's go →",
  },
  {
    icon: "✦",
    title: "Ask the AI anything",
    body: "The chat panel on the left is Quanta AI. Ask it things like \"Should I buy NVDA?\" or \"Compare Apple vs Microsoft\" — it'll give you a plain-English verdict using live prices.",
    cta: "Got it →",
    tip: "Try: \"Analyze NVDA\" or \"What's the best stock to buy right now?\"",
  },
  {
    icon: "▣",
    title: "Paper trade for free",
    body: "Use the Buy and Sell buttons on the Market page to practice trading. Your positions, cash, and P&L are all tracked. Nothing is real — it's just practice.",
    cta: "Got it →",
    tip: "Start by buying 10 shares of something and watching it move.",
  },
  {
    icon: "◎",
    title: "Backtest strategies",
    body: "Tell the AI a strategy like \"Buy when EMA 12 crosses above EMA 26\" and it'll automatically run a backtest — showing you if it would have worked historically.",
    cta: "Got it →",
    tip: "The AI will explain every term in plain English — no finance degree needed.",
  },
  {
    icon: "▤",
    title: "Explore the pages",
    body: "Use the tabs at the top to switch between Market, Compare, Portfolio, Screener, News, Alerts, and Learn. The Learn tab explains every trading term in plain English.",
    cta: "Start trading →",
    final: true,
  },
];

const accent = "linear-gradient(135deg,#4facfe,#a78bfa)";

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (isLast) { onDone(); return; }
      setStep(s => s + 1);
      setAnimating(false);
    }, 200);
  }

  function skip() { onDone(); }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(6,11,24,.88)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 460, borderRadius: 28,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.1)",
        boxShadow: "0 40px 100px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05)",
        overflow: "hidden",
        opacity: animating ? 0 : 1,
        transform: animating ? "scale(.97)" : "scale(1)",
        transition: "opacity .2s ease, transform .2s ease",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,.05)" }}>
          <div style={{
            height: "100%", background: accent,
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: "width .4s ease",
            borderRadius: "0 2px 2px 0",
          }} />
        </div>

        <div style={{ padding: "36px 40px 32px" }}>
          {/* Icon */}
          <div style={{
            width: 56, height: 56, borderRadius: 18, marginBottom: 24,
            background: "linear-gradient(135deg,rgba(79,172,254,.15),rgba(167,139,250,.15))",
            border: "1px solid rgba(79,172,254,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "#4facfe",
          }}>
            {current.icon}
          </div>

          {/* Step count */}
          <div style={{ fontSize: 10, color: "rgba(148,163,184,.4)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
            Step {step + 1} of {STEPS.length}
          </div>

          {/* Title */}
          <div style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 14, fontFamily: "'DM Serif Display',serif", fontStyle: "italic" }}>
            {current.title}
          </div>

          {/* Body */}
          <p style={{ fontSize: 14, color: "rgba(148,163,184,.75)", lineHeight: 1.75, margin: "0 0 20px" }}>
            {current.body}
          </p>

          {/* Tip */}
          {current.tip && (
            <div style={{
              background: "rgba(79,172,254,.06)", border: "1px solid rgba(79,172,254,.15)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 20,
              fontSize: 12, color: "rgba(79,172,254,.8)", lineHeight: 1.6,
            }}>
              <span style={{ fontWeight: 700, color: "#4facfe" }}>Try it: </span>{current.tip}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <button onClick={skip} style={{
              background: "none", border: "none", color: "rgba(148,163,184,.35)",
              fontSize: 12, cursor: "pointer", padding: 0, transition: "color .2s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(148,163,184,.7)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(148,163,184,.35)"}>
              Skip tour
            </button>

            {/* Dot indicators */}
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === step ? "#4facfe" : "rgba(255,255,255,.12)",
                  transition: "all .3s ease",
                }} />
              ))}
            </div>

            <button onClick={next} style={{
              padding: "10px 24px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: isLast ? accent : "rgba(255,255,255,.08)",
              border: isLast ? "none" : "1px solid rgba(255,255,255,.12)",
              color: isLast ? "#fff" : "#e2e8f0",
              boxShadow: isLast ? "0 0 24px rgba(79,172,254,.4)" : "none",
              transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; if (isLast) e.currentTarget.style.boxShadow = "0 0 36px rgba(79,172,254,.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; if (isLast) e.currentTarget.style.boxShadow = "0 0 24px rgba(79,172,254,.4)"; }}>
              {current.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
