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
const LoginPage   = lazy(() => import("./pages/LoginPage"));
const Onboarding  = lazy(() => import("./components/Onboarding"));

const SESSION_KEY = "quanta:session";
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}

function devSessionOverride() {
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("forceLanding") === "1") return null;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

function IconTerminal() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="q-mobile-tab__icon">
      <rect x="3" y="4" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 8.5h6M7 12h10M7 15.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="q-mobile-tab__icon">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser]             = useState(() => getSession());
  const [sym, setSym]               = useState("NVDA");
  const [timeframe, setTimeframe]   = useState("3M");
  const devOverride = devSessionOverride();
  const [showLanding, setShowLanding]       = useState(() => devOverride === null ? true : true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobile, setIsMobile]     = useState(typeof window !== "undefined" ? window.innerWidth < UI.BREAKPOINT_MOBILE : false);
  const [mobilTab, setMobilTab]     = useState("market");

  const { watch, loading: loadW }               = useWatchlist();
  const { data, loading: loadS, error, reload }   = useStockData(sym, timeframe);
  const { cash, pos, log, buy, sell, isHydrated } = usePortfolio();
  const { msgs, input, setInput, busy, send }     = useChat(sym, data, watch, cash, pos);

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
      const qty = typeof v === "object" ? v.quantity : v;
      return s + qty * (watch[k]?.price || 0);
    }, 0),
    [cash, pos, watch]
  );
  const pnl = useMemo(() => portVal - 100_000, [portVal]);

  const [showLogin, setShowLogin] = useState(false);

  function handleEnter() {
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
        <Suspense fallback={<div className="q-app-loading" style={{ gap: 0 }} aria-busy="true"><div className="q-app-loading__spinner" /></div>}>
          <LoginPage onLogin={handleLogin} onBack={() => setShowLogin(false)} />
        </Suspense>
      );
    }
    return <LandingPage onEnter={handleEnter} watch={watch} user={user} />;
  }

  if (authLoading || !isHydrated) {
    return (
      <div className="q-app-loading" role="status" aria-live="polite" aria-busy="true">
        <div className="q-app-loading__mark" aria-hidden>Q</div>
        <div className="q-app-loading__spinner" />
        <span>Loading terminal…</span>
      </div>
    );
  }

  const mainProps = {
    sym, data, loading: loadS, error, watch, pos, log, cash, buy, sell,
    onReload: reload, send, timeframe, onTimeframeChange: setTimeframe,
  };

  return (
    <ErrorBoundary>
      <a href="#main-terminal" className="q-skip-link">
        Skip to main content
      </a>
      <div
        style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", background: "var(--q-bg)" }}
        role="application"
        aria-label="Quanta AI Trading Terminal"
      >
        {showOnboarding && (
          <Suspense fallback={null}>
            <Onboarding onDone={handleOnboardingDone} />
          </Suspense>
        )}

        <Ticker watch={watch} loading={loadW} onSelect={setSym} />
        <NavBar sym={sym} watch={watch} pnl={pnl} cash={cash} onSelect={setSym} onSignOut={handleSignOut} />

        <main
          id="main-terminal"
          style={{
            position: "relative",
            zIndex: 5,
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: isMobile ? undefined : `${UI.SIDEBAR_WIDTH}px 1fr`,
            flexDirection: isMobile ? "column" : undefined,
          }}
        >
          {!isMobile ? (
            <>
              <aside role="complementary" aria-label="AI Assistant" style={{ height: "100%", overflow: "hidden", minWidth: 0 }}>
                <ChatPanel sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />
              </aside>
              <section role="region" aria-label="Market data and trading" style={{ height: "100%", overflow: "hidden", minWidth: 0 }}>
                <MainContent {...mainProps} />
              </section>
            </>
          ) : (
            <>
              <div
                id="mobile-panel"
                role="tabpanel"
                aria-labelledby={mobilTab === "market" ? "tab-market" : "tab-chat"}
                style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden" }}
              >
                {mobilTab === "market"
                  ? <MainContent {...mainProps} />
                  : <ChatPanel sym={sym} msgs={msgs} input={input} setInput={setInput} busy={busy} send={send} />}
              </div>
              <nav className="q-mobile-tabbar" role="tablist" aria-label="Terminal sections">
                {[
                  { id: "market", label: "Terminal", Icon: IconTerminal },
                  { id: "chat", label: "AI Chat", Icon: IconChat },
                ].map(t => {
                  const active = mobilTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      id={`tab-${t.id}`}
                      aria-selected={active}
                      aria-controls="mobile-panel"
                      className={`q-mobile-tab ${active ? "q-mobile-tab--active" : ""}`}
                      onClick={() => setMobilTab(t.id)}
                    >
                      <t.Icon />
                      <span className="q-mobile-tab__label">{t.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
