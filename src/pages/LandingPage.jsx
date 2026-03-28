import { useEffect, useState } from "react";
import { f2, SYMBOLS } from "../utils/formatters";

const FEATURES = [
  { icon: "◈", title: "Live Market Data", desc: "Real-time prices from Yahoo Finance, refreshed every 60 seconds." },
  { icon: "✦", title: "AI Assistant", desc: "Ask Quanta anything in plain English — buy/sell verdicts, analysis, comparisons." },
  { icon: "◎", title: "Strategy Backtester", desc: "Describe a strategy, Quanta runs it on real historical data and shows you the results." },
  { icon: "▣", title: "Paper Trading", desc: "$100,000 in virtual cash to practice buying and selling — zero risk." },
];

const PREVIEW_STOCKS = [
  { sym: "NVDA", price: 167.42, chg: +3.21 },
  { sym: "AAPL", price: 213.18, chg: -0.84 },
  { sym: "MSFT", price: 415.50, chg: +1.12 },
  { sym: "TSLA", price: 248.73, chg: -2.40 },
];

export default function LandingPage({ onEnter, watch, loadingWatch }) {
  const [visible, setVisible] = useState(false);
  const [activeStock, setActiveStock] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Cycle through preview stocks
  useEffect(() => {
    const t = setInterval(() => setActiveStock(i => (i + 1) % PREVIEW_STOCKS.length), 2400);
    return () => clearInterval(t);
  }, []);

  const stocks = SYMBOLS.map(s => watch[s]).filter(Boolean);

  const stocksToShow = stocks.length > 0
    ? stocks.map(d => ({ sym: d.symbol, price: d.price, chg: d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0 }))
    : PREVIEW_STOCKS.map(s => ({ ...s, chg: s.chg }));

  return (
    <div style={{
      height: "100dvh", display: "flex", flexDirection: "column",
      background: "#060b18", overflow: "hidden", position: "relative",
      fontFamily: "'DM Sans', sans-serif", color: "#f8fafc",
    }}>

      {/* ── BACKGROUND ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Aurora blobs */}
        <div style={{ position: "absolute", top: "-30%", left: "-10%", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.13) 0%,transparent 55%)", animation: "breathe 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "-10%", right: "-15%", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.10) 0%,transparent 55%)", animation: "breathe 13s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.05) 0%,transparent 60%)", animation: "breathe 15s ease-in-out infinite 6s" }} />
        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
        }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 64,
        borderBottom: "1px solid rgba(255,255,255,.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg,#4facfe,#a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 18px rgba(79,172,254,.45)",
          }}>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 18, color: "#fff", lineHeight: 1 }}>Q</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: ".16em", color: "#f8fafc" }}>QUANTA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "rgba(74,222,128,.08)", border: "1px solid rgba(74,222,128,.18)", marginRight: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, letterSpacing: ".08em" }}>MARKETS OPEN</span>
          </div>
          <button onClick={onEnter} style={{
            padding: "9px 24px", borderRadius: 40, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(135deg,#4facfe,#a78bfa)", border: "none", color: "#fff",
            boxShadow: "0 0 20px rgba(79,172,254,.3)", transition: "all .2s", letterSpacing: ".02em",
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 36px rgba(79,172,254,.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 20px rgba(79,172,254,.3)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            Open Terminal
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        flex: 1, display: "flex", gap: 0, minHeight: 0,
        opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(20px)",
        transition: "opacity .8s ease, transform .8s ease",
      }}>

        {/* Left: copy */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 0 0 10vw", position: "relative", zIndex: 5,
        }}>

          {/* Tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, width: "fit-content" }}>
            <span style={{ fontSize: 11, color: "rgba(148,163,184,.5)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 500 }}>AI-Powered Trading Terminal</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
            fontSize: "clamp(44px, 5.5vw, 72px)", fontWeight: 400,
            lineHeight: 1.05, letterSpacing: "-.02em",
            margin: "0 0 24px", maxWidth: 560,
          }}>
            Your edge in the<br />
            <span style={{
              background: "linear-gradient(100deg,#4facfe 0%,#a78bfa 50%,#f472b6 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              market.
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(148,163,184,.6)", maxWidth: 420, lineHeight: 1.75, margin: "0 0 40px" }}>
            Live data, AI analysis in plain English, and paper trading — everything a beginner needs to learn and trade with confidence.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, marginBottom: 56 }}>
            <button onClick={onEnter} style={{
              padding: "14px 40px", borderRadius: 40, fontSize: 15, fontWeight: 600, cursor: "pointer",
              background: "linear-gradient(135deg,#4facfe,#a78bfa)", border: "none", color: "#fff",
              boxShadow: "0 0 32px rgba(79,172,254,.4)", transition: "all .25s", letterSpacing: ".02em",
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 52px rgba(79,172,254,.6)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 0 32px rgba(79,172,254,.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              Start Trading Free
            </button>
            <button onClick={onEnter} style={{
              padding: "14px 28px", borderRadius: 40, fontSize: 14, fontWeight: 500, cursor: "pointer",
              background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: "rgba(148,163,184,.7)",
              transition: "all .2s", letterSpacing: ".02em",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.22)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.1)"; e.currentTarget.style.color = "rgba(148,163,184,.7)"; }}>
              See how it works →
            </button>
          </div>

          {/* Features list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(-12px)",
                transition: `opacity .5s ${.3 + i * .07}s ease, transform .5s ${.3 + i * .07}s ease`,
              }}>
                <span style={{ fontSize: 15, color: "#4facfe", flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{f.title} </span>
                  <span style={{ fontSize: 12, color: "rgba(148,163,184,.5)" }}>— {f.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: mock terminal preview */}
        <div style={{
          width: "42%", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px 6vw 32px 32px", position: "relative", zIndex: 5,
          opacity: visible ? 1 : 0, transform: visible ? "none" : "translateX(24px)",
          transition: "opacity .9s .15s ease, transform .9s .15s ease",
        }}>
          {/* Terminal card */}
          <div style={{
            width: "100%", maxWidth: 380,
            background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.09)",
            borderRadius: 24, backdropFilter: "blur(20px)",
            boxShadow: "0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05), inset 0 1px 0 rgba(255,255,255,.06)",
            overflow: "hidden",
          }}>
            {/* Terminal header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#f87171","#fbbf24","#4ade80"].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: .6 }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: "rgba(148,163,184,.4)", marginLeft: 6, letterSpacing: ".06em" }}>quanta — terminal</span>
            </div>

            {/* Stock cards */}
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {stocksToShow.slice(0, 4).map((s, i) => {
                const isActive = i === activeStock % 4;
                const up = s.chg >= 0;
                return (
                  <div key={s.sym} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 14, transition: "all .4s ease",
                    background: isActive ? (up ? "rgba(74,222,128,.07)" : "rgba(248,113,113,.07)") : "rgba(255,255,255,.02)",
                    border: `1px solid ${isActive ? (up ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)") : "rgba(255,255,255,.05)"}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: up ? "rgba(74,222,128,.1)" : "rgba(248,113,113,.1)",
                      border: `1px solid ${up ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 14, color: up ? "#4ade80" : "#f87171" }}>{s.sym[0]}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{s.sym}</div>
                      <div style={{ fontSize: 10, color: "rgba(148,163,184,.4)", marginTop: 1 }}>NYSE</div>
                    </div>
                    {/* Mini sparkline bars */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 24 }}>
                      {[.4,.6,.5,.8,.55,.7,.9,.75,1,.85].map((h, j) => (
                        <div key={j} style={{ width: 3, borderRadius: 2, height: `${h * 100}%`, background: up ? "rgba(74,222,128,.4)" : "rgba(248,113,113,.4)", transition: "height .3s ease" }} />
                      ))}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9" }}>${f2(s.price)}</div>
                      <div style={{ fontSize: 11, color: up ? "#4ade80" : "#f87171", fontWeight: 500 }}>
                        {up ? "▲" : "▼"}{Math.abs(s.chg).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI chat preview */}
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ background: "rgba(79,172,254,.06)", border: "1px solid rgba(79,172,254,.15)", borderRadius: 14, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "rgba(79,172,254,.7)", fontWeight: 600, letterSpacing: ".06em", marginBottom: 6 }}>QUANTA AI</div>
                <div style={{ fontSize: 12, color: "rgba(148,163,184,.75)", lineHeight: 1.6 }}>
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>VERDICT: BUY</span> — NVDA is trading above its 20-day average and momentum is strong. Consider an entry near <span style={{ color: "#f1f5f9", fontWeight: 600 }}>$165</span>.
                </div>
              </div>
            </div>

            {/* Bottom input bar */}
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, padding: "10px 14px" }}>
                <span style={{ fontSize: 12, color: "rgba(148,163,184,.3)", flex: 1 }}>Ask Quanta anything…</span>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#4facfe,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 12 }}>↑</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat badges */}
          <div style={{ position: "absolute", top: "18%", right: "4vw", background: "rgba(8,14,30,.9)", border: "1px solid rgba(74,222,128,.25)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 2 }}>PORTFOLIO</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#4ade80" }}>+$4,218</div>
          </div>

          <div style={{ position: "absolute", bottom: "22%", left: "28px", background: "rgba(8,14,30,.9)", border: "1px solid rgba(167,139,250,.25)", borderRadius: 12, padding: "10px 14px", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
            <div style={{ fontSize: 10, color: "rgba(148,163,184,.45)", letterSpacing: ".06em", marginBottom: 2 }}>WIN RATE</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>68%</div>
          </div>
        </div>
      </div>

      {/* ── TICKER STRIP ── */}
      <div style={{
        position: "relative", zIndex: 10,
        borderTop: "1px solid rgba(255,255,255,.05)",
        height: 36, display: "flex", alignItems: "center",
        overflow: "hidden", background: "rgba(6,11,24,.9)",
        flexShrink: 0,
      }}>
        {stocks.length > 0 ? (
          <div style={{ display: "flex", animation: "ticker 55s linear infinite", whiteSpace: "nowrap" }}>
            {[...stocks, ...stocks].map((d, i) => {
              const chg = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
              return (
                <span key={i} style={{ padding: "0 28px", fontSize: 11, display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ color: "rgba(148,163,184,.4)", fontWeight: 600, letterSpacing: ".05em" }}>{d.symbol}</span>
                  <span style={{ color: "#cbd5e1", fontWeight: 500 }}>${f2(d.price)}</span>
                  <span style={{ color: chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>{chg >= 0 ? "▲" : "▼"}{Math.abs(chg).toFixed(2)}%</span>
                  <span style={{ color: "rgba(255,255,255,.06)", fontSize: 14 }}>·</span>
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 40, padding: "0 24px", alignItems: "center" }}>
            {[70, 55, 85, 60, 75, 55, 70, 60].map((w, i) => (
              <div key={i} className="skel" style={{ width: w, height: 8, borderRadius: 4 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
