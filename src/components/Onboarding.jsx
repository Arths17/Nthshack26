import { useState } from "react";

function IconWelcome() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrade() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 14l4-4 4 4 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBacktest() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconExplore() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const STEPS = [
  {
    Icon: IconWelcome,
    title: "Welcome to Quanta",
    body: "This is your AI-powered trading terminal. You start with $100,000 of virtual cash — no real money, no real risk. Everything here uses real live market data.",
    cta: "Continue",
  },
  {
    Icon: IconChat,
    title: "Ask the AI anything",
    body: "The chat panel on the left is Quanta AI. Ask it things like \"Should I buy NVDA?\" or \"Compare Apple vs Microsoft\" — it'll give you a plain-English verdict using live prices.",
    cta: "Next",
    tip: "Try: \"Analyze NVDA\" or \"What's the best stock to buy right now?\"",
  },
  {
    Icon: IconTrade,
    title: "Paper trade for free",
    body: "Use the Buy and Sell buttons on the Market page to practice trading. Your positions, cash, and P&L are all tracked. Nothing is real — it's just practice.",
    cta: "Next",
    tip: "Start by buying 10 shares of something and watching it move.",
  },
  {
    Icon: IconBacktest,
    title: "Backtest strategies",
    body: "Tell the AI a strategy like \"Buy when EMA 12 crosses above EMA 26\" and it'll automatically run a backtest — showing you if it would have worked historically.",
    cta: "Next",
    tip: "The AI will explain every term in plain English — no finance degree needed.",
  },
  {
    Icon: IconExplore,
    title: "Explore the app",
    body: "Use the tabs at the top to switch between Market, Compare, Portfolio, Screener, News, Alerts, and Learn. The Learn tab explains every trading term in plain English.",
    cta: "Enter terminal",
    final: true,
  },
];

const accent = "linear-gradient(135deg,#4facfe,#6b8cff)";

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const StepIcon = current.Icon;

  function next() {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      if (isLast) {
        onDone();
        return;
      }
      setStep(s => s + 1);
      setAnimating(false);
    }, 200);
  }

  function skip() {
    onDone();
  }

  return (
    <div className="q-onboard-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className={`q-onboard-card ${animating ? "q-onboard-card--exit" : ""}`}>
        <div style={{ height: 3, background: "rgba(255,255,255,.05)" }}>
          <div
            style={{
              height: "100%",
              background: accent,
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: "width 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              borderRadius: "0 2px 2px 0",
            }}
          />
        </div>

        <div style={{ padding: "34px 38px 30px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              marginBottom: 22,
              background: "linear-gradient(145deg, rgba(79,172,254,.12), rgba(107,140,255,.08))",
              border: "1px solid rgba(79,172,254,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7dd3fc",
            }}
          >
            <StepIcon />
          </div>

          <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
            Step {step + 1} of {STEPS.length}
          </div>

          <h2 id="onboard-title" style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 12, fontFamily: "var(--q-font-display)", fontStyle: "italic", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {current.title}
          </h2>

          <p style={{ fontSize: 14, color: "rgba(203,213,225,.82)", lineHeight: 1.7, margin: "0 0 18px" }}>
            {current.body}
          </p>

          {current.tip && (
            <div
              style={{
                background: "rgba(79,172,254,.06)",
                border: "1px solid rgba(79,172,254,.14)",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 22,
                fontSize: 12,
                color: "rgba(186,230,253,.9)",
                lineHeight: 1.55,
              }}
            >
              <span style={{ fontWeight: 600, color: "#7dd3fc" }}>Tip · </span>
              {current.tip}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 12 }}>
            <button type="button" onClick={skip} className="q-onboard-skip">
              Skip tour
            </button>

            <div style={{ display: "flex", gap: 6 }} aria-hidden>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? "#4facfe" : "rgba(255,255,255,.1)",
                    transition: "width 0.3s ease, background 0.2s ease",
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="q-onboard-btn-primary"
              style={{
                background: isLast ? accent : "rgba(255,255,255,.07)",
                border: isLast ? "none" : "1px solid rgba(255,255,255,.1)",
                color: isLast ? "#fff" : "#e2e8f0",
                boxShadow: isLast ? "0 8px 28px rgba(79,172,254,.25)" : "none",
              }}
            >
              {current.cta}
              <span aria-hidden style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
