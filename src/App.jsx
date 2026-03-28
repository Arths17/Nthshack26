import { useState, useMemo, useEffect, lazy, Suspense, useRef } from "react";
import { useWatchlist }  from "./hooks/useWatchlist";
import { useStockData }  from "./hooks/useStockData";
import { usePortfolioFirebase }  from "./hooks/usePortfolioFirebase";
import { useChat }       from "./hooks/useChat";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAuth } from "./contexts/AuthContext";
import { signOut } from "./api/firebase";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { UI }            from "./utils/constants";
import Ticker      from "./components/Ticker";
import NavBar      from "./components/NavBar";
import ChatPanel   from "./components/ChatPanel";
import MainContent from "./components/MainContent";
import LandingPage from "./pages/LandingPage";
// Lazy load less critical pages
const LoginPage   = lazy(() => import("./pages/LoginPage"));
const Onboarding  = lazy(() => import("./components/Onboarding"));

const SESSION_KEY = "quanta:session";
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}


export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser]             = useState(() => getSession());
  const [sym, setSym]               = useState("NVDA");
  const [timeframe, setTimeframe]   = useState("3M");
  const [showLanding, setShowLanding]       = useState(() => !getSession());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < UI.BREAKPOINT_MOBILE);
  const [mobilTab, setMobilTab]     = useState("market");

  const { watch, loading: loadW }               = useWatchlist();
  const { data, loading: loadS, error, reload }   = useStockData(sym, timeframe);
  const { user: portfolioUser, cash, pos, log, buy, sell, loading: portfolioLoading, error: portfolioError, isHydrated } = usePortfolioFirebase();
  const { msgs, input, setInput, busy, send }     = useChat(sym, data, watch, cash, pos);

  // Log portfolio errors for debugging
  if (portfolioError) console.warn("[Portfolio Error]", portfolioError);

  // Sync Firebase auth to local state
  useEffect(() => {
    if (authUser && !user) {
      const newUser = {
        id: authUser.uid,
        email: authUser.email,
        name: authUser.displayName || authUser.email.split("@")[0],
      };
      setUser(newUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      setShowLanding(false);
    }
  }, [authUser, user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < UI.BREAKPOINT_MOBILE);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts: j/k for navigation, space for chat focus
  useKeyboardShortcuts(
    sym,
    watch?.length > 0 ? Object.keys(watch).map(k => ({ symbol: k })) : [],
    setSym,
    () => { if (inputRef) { inputRef.current?.focus(); } },
    () => window.quantaChatFocus?.()
  );

  const inputRef = useRef(null);

  const portVal = useMemo(
    () => cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0),
    [cash, pos, watch]
  );
  const pnl = useMemo(() => portVal - 100_000, [portVal]);

  const [showLogin, setShowLogin] = useState(false);

  function handleEnter() {
    // Always show login page - Firebase auth is required for trading
    setShowLogin(true);
  }

  function handleLogin(u) {
    console.log("[Auth] User logged in:", u.email);
    setUser(u);
    setShowLanding(false);
    setShowLogin(false);
    if (!localStorage.getItem("quanta:onboarded")) setShowOnboarding(true);
  }

  function handleOnboardingDone() {
    localStorage.setItem("quanta:onboarded", "1");
    setShowOnboarding(false);
  }

  async function handleSignOut() {
    await signOut();
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    setShowLanding(true);
  }

  if (showLanding) {
    if (showLogin) {
      return (
        <Suspense fallback={<div style={{ height: "100dvh", background: "#060b18" }} />}>
          <LoginPage onLogin={handleLogin} onBack={() => setShowLogin(false)} />
        </Suspense>
      );
    }
    return <LandingPage onEnter={handleEnter} watch={watch} user={user} />;
  }

  if (authLoading || portfolioLoading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060b18", color: "rgba(148,163,184,.5)", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  // Require Firebase auth for trading
  if (!authUser) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060b18", overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, maxWidth: 400 }}>
          <div style={{ fontSize: 32, color: "rgba(148,163,184,.3)" }}>🔐</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f8fafc", marginBottom: 8 }}>Authentication Required</div>
            <div style={{ fontSize: 13, color: "rgba(148,163,184,.6)", marginBottom: 16 }}>
              You need to log in to access the trading terminal.
            </div>
            <button onClick={() => setShowLanding(true)} style={{
              padding: "10px 24px",
              background: "#4facfe",
              color: "#060b18",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 13,
            }}>
              Log In or Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div 
        style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}
        role="application"
        aria-label="Quanta AI Trading Terminal">
        {showOnboarding && (
          <Suspense fallback={null}>
            <Onboarding onDone={handleOnboardingDone} />
          </Suspense>
        )}

        <NavBar sym={sym} watch={watch} pnl={pnl} cash={cash} onSelect={setSym} onSignOut={handleSignOut} />

        {/* DESKTOP */}
        {!isMobile && (
          <div 
            style={{ position: "relative", zIndex: 5, flex: 1, display: "grid", gridTemplateColumns: `${UI.SIDEBAR_WIDTH}px 1fr`, minHeight: 0, overflow: "hidden" }}
            role="main">
            <aside role="complementary" aria-label="AI Assistant" style={{ height: "100%", overflow: "hidden" }}>
              <ChatPanel   sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
            </aside>
            <section role="region" aria-label="Market Data and Trading" style={{ height: "100%", overflow: "hidden" }}>
              <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} timeframe={timeframe} onTimeframeChange={setTimeframe} onSelectSymbol={setSym} />
            </section>
          </div>
        )}

        {/* MOBILE */}
        {isMobile && (
          <>
            <div style={{ position: "relative", zIndex: 5, flex: 1, minHeight: 0, overflow: "hidden" }}>
              {mobilTab === "market"
                ? <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} timeframe={timeframe} onTimeframeChange={setTimeframe} onSelectSymbol={setSym} />
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
