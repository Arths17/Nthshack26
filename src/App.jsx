import { useState, useMemo, useEffect, lazy, Suspense, useRef } from "react";
import { useWatchlist }  from "./hooks/useWatchlist";
import { useStockData }  from "./hooks/useStockData";
import { usePortfolio }  from "./hooks/usePortfolio";
import { useChat }       from "./hooks/useChat";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAuth } from "./contexts/AuthContext";
import { signOut } from "./api/firebaseAuth";
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

// For development: allow forcing the landing page by adding `?forceLanding=1` to the URL.
function devSessionOverride() {
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('forceLanding') === '1') return null;
    }
  } catch (e) {
    // ignore
  }
  return undefined;
}


export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser]             = useState(() => getSession());
  const [sym, setSym]               = useState("NVDA");
  const [timeframe, setTimeframe]   = useState("3M");
  // Respect dev override: if devSessionOverride() returns null we force landing
  const devOverride = devSessionOverride();
  // Always show the landing page first. Only authenticated users (via Auth) can enter.
  const [showLanding, setShowLanding]       = useState(() => devOverride === null ? true : true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < UI.BREAKPOINT_MOBILE);
  const [mobilTab, setMobilTab]     = useState("market");

  const { watch, loading: loadW }               = useWatchlist();
  const { data, loading: loadS, error, reload }   = useStockData(sym, timeframe);
  const { cash, pos, log, buy, sell, isHydrated } = usePortfolio();
  const { msgs, input, setInput, busy, send }     = useChat(sym, data, watch, cash, pos);

  // Sync auth to local state
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
    () => cash + Object.entries(pos).reduce((s, [k, v]) => {
      const qty = typeof v === 'object' ? v.quantity : v;
      return s + qty * (watch[k]?.price || 0);
    }, 0),
    [cash, pos, watch]
  );
  const pnl = useMemo(() => portVal - 100_000, [portVal]);

  const [showLogin, setShowLogin] = useState(false);

  function handleEnter() {
    // Require an authenticated session (AuthContext) to enter the terminal.
    if (authUser) {
      setShowLanding(false);
      if (!localStorage.getItem("quanta:onboarded")) setShowOnboarding(true);
    } else {
      setShowLogin(true);
    }
  }

  function handleLogin(u) {
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

  if (authLoading || !isHydrated) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060b18", color: "rgba(148,163,184,.5)", fontSize: 13 }}>
        Loading…
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

        <Ticker watch={watch} loading={loadW} onSelect={setSym} />
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
              <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} timeframe={timeframe} onTimeframeChange={setTimeframe} />
            </section>
          </div>
        )}

        {/* MOBILE */}
        {isMobile && (
          <>
            <div style={{ position: "relative", zIndex: 5, flex: 1, minHeight: 0, overflow: "hidden" }}>
              {mobilTab === "market"
                ? <MainContent sym={sym} data={data} loading={loadS} error={error} watch={watch} pos={pos} log={log} cash={cash} buy={buy} sell={sell} onReload={reload} send={send} timeframe={timeframe} onTimeframeChange={setTimeframe} />
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
