import { useEffect, useState } from "react";
import { f2, SYMBOLS } from "../utils/formatters";

const FEATURES = [
  { icon: "◈", title: "Live Market Data", desc: "Real-time prices, charts and stats from Yahoo Finance — updated every 60 seconds." },
  { icon: "✦", title: "AI Trading Assistant", desc: "Ask Quanta anything in plain English. Get buy/sell verdicts backed by live numbers." },
  { icon: "◎", title: "Strategy Backtester", desc: "Describe a strategy, Quanta runs it on real historical data and shows you the results." },
  { icon: "▣", title: "Paper Trading", desc: "Practice buying and selling with $100,000 of virtual cash — zero risk, real experience." },
];

const TAGLINES = [
  "Your AI-powered trading terminal.",
  "Built for beginners. Sharp enough for traders.",
  "Live data. Real insights. Zero jargon.",
];

export default function LandingPage({ onEnter, watch, loadingWatch }) {
  const [tagline, setTagline] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTagline(i => (i + 1) % TAGLINES.length), 3000);
    return () => clearInterval(t);
  }, []);

  const stocks = SYMBOLS.map(s => watch[s]).filter(Boolean);

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "#080e1e", overflow: "hidden", position: "relative",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.09) 0%,transparent 65%)", animation: "breathe 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.08) 0%,transparent 65%)", animation: "breathe 10s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 65%)", animation: "breathe 12s ease-in-out infinite 4s" }} />
      </div>

      {/* Nav bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#4facfe,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(79,172,254,.35)" }}>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 20, color: "#fff", lineHeight: 1 }}>Q</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: ".14em", color: "#f8fafc" }}>QUANTA</span>
        </div>
        <button onClick={onEnter} style={{
          padding: "10px 28px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer",
          background: "linear-gradient(135deg,#4facfe,#a78bfa)", border: "none", color: "#fff",
          letterSpacing: ".04em", boxShadow: "0 0 24px rgba(79,172,254,.3)", transition: "all .2s",
        }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 40px rgba(79,172,254,.5)"}
          onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 24px rgba(79,172,254,.3)"}>
          Open Terminal
        </button>
      </div>

      {/* Hero */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "0 40px", position: "relative", zIndex: 5,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity .8s ease, transform .8s ease",
      }}>
        {/* Live badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 20, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.2)", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "pulse 2s infinite", boxShadow: "0 0 8px #4ade80", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 500, letterSpacing: ".08em" }}>LIVE MARKET DATA</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 68, fontWeight: 400, color: "#f8fafc", lineHeight: 1.05, letterSpacing: "-.02em", margin: "0 0 16px" }}>
          Trade smarter,<br />
          <span style={{ background: "linear-gradient(135deg,#4facfe,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>not harder.</span>
        </h1>

        {/* Rotating tagline */}
        <p style={{ fontSize: 18, color: "rgba(148,163,184,.7)", maxWidth: 480, lineHeight: 1.6, margin: "0 0 40px", minHeight: 28, transition: "opacity .4s ease" }}>
          {TAGLINES[tagline]}
        </p>

        {/* CTA */}
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onEnter} style={{
            padding: "14px 40px", borderRadius: 40, fontSize: 15, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(135deg,#4facfe,#a78bfa)", border: "none", color: "#fff",
            letterSpacing: ".04em", boxShadow: "0 0 32px rgba(79,172,254,.4)", transition: "all .25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 48px rgba(79,172,254,.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 32px rgba(79,172,254,.4)"; }}>
            Enter Terminal
          </button>
          <button onClick={onEnter} style={{
            padding: "14px 32px", borderRadius: 40, fontSize: 15, fontWeight: 500, cursor: "pointer",
            background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "rgba(148,163,184,.8)",
            letterSpacing: ".04em", transition: "all .25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.25)"; e.currentTarget.style.color = "#f1f5f9"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(148,163,184,.8)"; }}>
            See how it works
          </button>
        </div>

        {/* Feature pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 60, maxWidth: 900, width: "100%" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              padding: "18px 20px", borderRadius: 18, background: "rgba(255,255,255,.03)",
              border: "1px solid rgba(255,255,255,.07)", textAlign: "left",
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: `opacity .6s ${.2 + i * .1}s ease, transform .6s ${.2 + i * .1}s ease`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 10, color: "#4facfe" }}>{f.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(148,163,184,.6)", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live market strip at bottom */}
      <div style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(255,255,255,.05)", height: 36, display: "flex", alignItems: "center", overflow: "hidden", background: "rgba(8,14,30,.8)" }}>
        {!loadingWatch && stocks.length > 0 && (
          <div style={{ display: "flex", animation: "ticker 50s linear infinite", whiteSpace: "nowrap" }}>
            {[...stocks, ...stocks].map((d, i) => {
              const chg = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
              return (
                <span key={i} style={{ padding: "0 24px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ color: "rgba(148,163,184,.5)", fontWeight: 500 }}>{d.symbol}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 500 }}>${f2(d.price)}</span>
                  <span style={{ fontSize: 11, color: chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>{chg >= 0 ? "▲" : "▼"}{Math.abs(chg).toFixed(2)}%</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
