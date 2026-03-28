import { useState, useMemo, useEffect } from "react";
import { useWatchlist } from "./hooks/useWatchlist";
import { useStockData } from "./hooks/useStockData";
import { usePortfolio } from "./hooks/usePortfolio";
import { useChat } from "./hooks/useChat";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UI } from "./utils/constants";
import Ticker from "./components/Ticker";
import NavBar from "./components/NavBar";
import ChatPanel from "./components/ChatPanel";
import MainContent from "./components/MainContent";
import LandingPage from "./pages/LandingPage";

const Orbs = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
    <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.07) 0%,transparent 70%)", animation: "breathe 8s ease-in-out infinite" }} />
    <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.06) 0%,transparent 70%)", animation: "breathe 10s ease-in-out infinite 2s" }} />
    <div style={{ position: "absolute", top: "40%", right: "30%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.04) 0%,transparent 70%)", animation: "breathe 12s ease-in-out infinite 4s" }} />
  </div>
);

export default function App() {
  const [sym, setSym] = useState("NVDA");
  const [showLanding, setShowLanding] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < UI.BREAKPOINT_MOBILE);

  const { watch, loading: loadW } = useWatchlist();
  const { data, loading: loadS, error, reload } = useStockData(sym);
  const { cash, pos, log, buy, sell, isHydrated } = usePortfolio();
  const { msgs, input, setInput, busy, send } = useChat(sym, data, watch, cash, pos);

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < UI.BREAKPOINT_MOBILE);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Memoize calculated values to prevent unnecessary re-renders
  const portVal = useMemo(
    () => cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0),
    [cash, pos, watch]
  );
  const pnl = useMemo(() => portVal - 100_000, [portVal]);

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} watch={watch} loadingWatch={loadW} />;
  }

  // Wait for portfolio to hydrate from localStorage before rendering
  if (!isHydrated) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        Loading portfolio...
      </div>
    );
  }

  const gridLayout = isMobile ? "1fr" : `${UI.SIDEBAR_WIDTH}px 1fr`;

  return (
    <ErrorBoundary>
      <div style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}>
        <Orbs />
        <Ticker watch={watch} loading={loadW} onSelect={setSym} />
        <NavBar sym={sym} watch={watch} pnl={pnl} cash={cash} onSelect={setSym} />
        <div style={{
          position: "relative",
          zIndex: 5,
          flex: 1,
          display: "grid",
          gridTemplateColumns: gridLayout,
          minHeight: 0,
          overflow: "hidden",
        }}>
          {!isMobile && (
            <ChatPanel sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
          )}
          <MainContent
            sym={sym}
            data={data}
            loading={loadS}
            error={error}
            watch={watch}
            pos={pos}
            log={log}
            cash={cash}
            buy={buy}
            sell={sell}
            onReload={reload}
          />
        </div>
        {isMobile && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", height: "40%", overflowY: "auto", zIndex: 10 }}>
            <ChatPanel sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
