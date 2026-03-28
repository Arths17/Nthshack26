import { useState, useMemo, useEffect } from "react";
import { useWatchlist }  from "./hooks/useWatchlist";
import { useStockData }  from "./hooks/useStockData";
import { usePortfolio }  from "./hooks/usePortfolio";
import { useChat }       from "./hooks/useChat";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UI }            from "./utils/constants";
import Ticker      from "./components/Ticker";
import NavBar      from "./components/NavBar";
import ChatPanel   from "./components/ChatPanel";
import MainContent from "./components/MainContent";
import LandingPage from "./pages/LandingPage";
import Onboarding  from "./components/Onboarding";

const Orbs = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
    <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.07) 0%,transparent 70%)", animation: "breathe 8s ease-in-out infinite" }} />
    <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.06) 0%,transparent 70%)", animation: "breathe 10s ease-in-out infinite 2s" }} />
    <div style={{ position: "absolute", top: "40%", right: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 70%)", animation: "breathe 12s ease-in-out infinite 4s" }} />
  </div>
);

export default function App() {
  const [sym, setSym]               = useState("NVDA");
  const [showLanding, setShowLanding]       = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < UI.BREAKPOINT_MOBILE);
  const [mobilTab, setMobilTab]     = useState("market");

  const { watch, loading: loadW }               = useWatchlist();
  const { data, loading: loadS, error, reload }   = useStockData(sym);
  const { cash, pos, log, buy, sell, isHydrated } = usePortfolio();
  const { msgs, input, setInput, busy, send }     = useChat(sym, data, watch, cash, pos);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < UI.BREAKPOINT_MOBILE);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const portVal = useMemo(
    () => cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0),
    [cash, pos, watch]
  );
  const pnl = useMemo(() => portVal - 100_000, [portVal]);

  function handleEnter() {
    setShowLanding(false);
    if (!localStorage.getItem("quanta:onboarded")) setShowOnboarding(true);
  }

  function handleOnboardingDone() {
    localStorage.setItem("quanta:onboarded", "1");
    setShowOnboarding(false);
  }

  if (showLanding) {
    return <LandingPage onEnter={handleEnter} watch={watch} loadingWatch={loadW} />;
  }

  if (!isHydrated) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060b18", color: "rgba(148,163,184,.5)", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <Orbs />

        {showOnboarding && <Onboarding onDone={handleOnboardingDone} />}

        <Ticker watch={watch} loading={loadW} onSelect={setSym} />
        <NavBar sym={sym} watch={watch} pnl={pnl} cash={cash} onSelect={setSym} />

        {/* DESKTOP */}
        {!isMobile && (
          <div style={{ position: "relative", zIndex: 5, flex: 1, display: "grid", gridTemplateColumns: `${UI.SIDEBAR_WIDTH}px 1fr`, minHeight: 0, overflow: "hidden" }}>
            <ChatPanel   sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
            <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} />
          </div>
        )}

        {/* MOBILE */}
        {isMobile && (
          <>
            <div style={{ position: "relative", zIndex: 5, flex: 1, minHeight: 0, overflow: "hidden" }}>
              {mobilTab === "market"
                ? <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} />
                : <ChatPanel   sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
              }
            </div>
            <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,.07)", background: "rgba(6,11,24,.95)", backdropFilter: "blur(16px)", flexShrink: 0, zIndex: 20 }}>
              {[
                { id: "market", icon: "◈", label: "Terminal" },
                { id: "chat",   icon: "✦", label: "AI Chat" },
              ].map(t => (
                <button key={t.id} onClick={() => setMobilTab(t.id)} style={{
                  flex: 1, padding: "12px 0", background: "none", border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  color: mobilTab === t.id ? "#4facfe" : "rgba(148,163,184,.4)", transition: "color .2s",
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: mobilTab === t.id ? 600 : 400, letterSpacing: ".04em" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
