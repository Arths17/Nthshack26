import { useState, useEffect } from "react";
import { signUp, signIn, isUsingLocalDevAuth } from "../api/firebaseAuth";

const SESSION_KEY = "quanta:session";

/* ─── Design tokens ──────────────────────────────────────────── */
const BG     = "#060b18";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT1  = "#f0f4ff";
const TEXT2  = "rgba(148,163,184,0.7)";
const TEXT3  = "rgba(148,163,184,0.35)";

export default function LoginPage({ onLogin, onBack }) {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [vis, setVis]           = useState(false);
  const [animating, setAnimating] = useState(false); // mode-switch animation

  useEffect(() => { const t = setTimeout(() => setVis(true), 40); return () => clearTimeout(t); }, []);

  function switchMode(next) {
    setAnimating(true);
    setError("");
    setTimeout(() => { setMode(next); setAnimating(false); }, 180);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim())                        { setError("Please enter your name."); return; }
        if (!email.includes("@"))                { setError("Enter a valid email address."); return; }
        if (password.length < 6)                 { setError("Password must be at least 6 chars."); return; }

        const { data, error: signUpError } = await signUp(email, password, { display_name: name.trim() });
        if (signUpError) { setError(signUpError.message); return; }

        // Save session
        const uid = data.user.uid;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name: name.trim(), id: uid }));
        onLogin({ email, name: name.trim(), id: uid });
      } else {
        if (!email.trim())                       { setError("Enter your email."); return; }
        if (!password)                           { setError("Enter your password."); return; }

        const { data, error: signInError } = await signIn(email, password);
        if (signInError) { setError(signInError.message); return; }

        const userName = data.user.displayName || email.split("@")[0];
        const uid = data.user.uid;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name: userName, id: uid }));
        onLogin({ email, name: userName, id: uid });
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = {
    width: "100%", padding: "13px 16px", borderRadius: 13, fontSize: 14,
    background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`,
    color: TEXT1, outline: "none", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color .18s, box-shadow .18s, background .18s",
  };

  const onFocus = e => {
    e.target.style.borderColor = "rgba(79,172,254,.42)";
    e.target.style.boxShadow   = "0 0 0 3px rgba(79,172,254,.1)";
    e.target.style.background  = "rgba(79,172,254,.04)";
  };
  const onBlur = e => {
    e.target.style.borderColor = BORDER;
    e.target.style.boxShadow   = "none";
    e.target.style.background  = "rgba(255,255,255,.04)";
  };

  return (
    <div style={{
      height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: BG, fontFamily: "'DM Sans', sans-serif", color: TEXT1,
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-30%", left: "-10%", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(79,172,254,.11) 0%,transparent 55%)", animation: "breathe 10s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,.08) 0%,transparent 55%)", animation: "breathe 14s ease-in-out infinite 3s" }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 65% 65% at 50% 50%,black 0%,transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 65% at 50% 50%,black 0%,transparent 100%)",
        }} />
      </div>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{
          position: "absolute", top: 22, left: 28, zIndex: 20,
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`,
          borderRadius: 30, padding: "7px 16px 7px 12px",
          color: TEXT2, fontSize: 12, fontWeight: 500, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          transition: "border-color .15s, color .15s, background .15s",
          opacity: vis ? 1 : 0,
          transform: vis ? "none" : "translateX(-8px)",
          transitionProperty: "opacity, transform, border-color, color, background",
          transitionDuration: ".4s, .4s, .15s, .15s, .15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.16)"; e.currentTarget.style.color = TEXT1; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>←</span> Back
        </button>
      )}

      {/* Logo */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 10, zIndex: 10,
        opacity: vis ? 1 : 0, transition: "opacity .6s ease",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: "linear-gradient(135deg,#4facfe,#a78bfa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(79,172,254,.42)",
        }}>
          <span style={{ fontFamily: "'DM Serif Display',serif", fontStyle: "italic", fontSize: 17, color: "#fff" }}>Q</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".18em" }}>QUANTA</span>
      </div>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 5, width: "100%", maxWidth: 400, padding: "0 20px",
        opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(28px) scale(.97)",
        transition: "opacity .65s .08s ease, transform .65s .08s cubic-bezier(.34,1.4,.64,1)",
      }}>
        <div style={{
          background: "rgba(255,255,255,.03)",
          border: `1px solid ${BORDER}`,
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          borderRadius: 24,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06),0 40px 88px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.03)",
          padding: "32px 28px",
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "'DM Serif Display',serif", fontStyle: "italic",
              fontSize: 26, fontWeight: 400, margin: "0 0 6px", color: TEXT1, letterSpacing: "-.01em",
            }}>
              {mode === "login" ? "Welcome back." : "Create your account."}
            </h2>
            <p style={{ fontSize: 13, color: TEXT3, margin: 0 }}>
              {mode === "login" ? "Sign in to your Quanta account" : "Start with $100K in virtual cash"}
            </p>
          </div>

          {isUsingLocalDevAuth() && (
            <div
              style={{
                marginBottom: 20,
                padding: "11px 14px",
                borderRadius: 12,
                background: "rgba(79,172,254,.07)",
                border: "1px solid rgba(79,172,254,.22)",
                fontSize: 12,
                color: "rgba(203,213,225,.92)",
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              <strong style={{ color: "#93c5fd" }}>Local dev mode.</strong>{" "}
              Firebase is not configured, so accounts are stored only in this browser. To use real auth, copy{" "}
              <code style={{ fontSize: 11, opacity: 0.9 }}>.env.example</code> →{" "}
              <code style={{ fontSize: 11, opacity: 0.9 }}>.env.local</code> and add your{" "}
              <code style={{ fontSize: 11, opacity: 0.9 }}>NEXT_PUBLIC_FIREBASE_*</code> values.
            </div>
          )}

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: "rgba(255,255,255,.04)", border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: 4, marginBottom: 24,
          }}>
            {[["login","Sign In"],["signup","Create Account"]].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "9px 0", borderRadius: 10,
                fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: ".02em",
                background: mode === m
                  ? "linear-gradient(180deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,0) 100%),rgba(79,172,254,.14)"
                  : "transparent",
                border: mode === m ? "1px solid rgba(79,172,254,.28)" : "1px solid transparent",
                color: mode === m ? TEXT1 : TEXT3,
                transition: "all .18s ease",
                boxShadow: mode === m ? "inset 0 1px 0 rgba(255,255,255,.08)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{
            display: "flex", flexDirection: "column", gap: 14,
            opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "none",
            transition: "opacity .18s ease, transform .18s ease",
          }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: 10, color: TEXT3, letterSpacing: ".1em", fontWeight: 700, display: "block", marginBottom: 7, textTransform: "uppercase" }}>Full Name</label>
                <input type="text" placeholder="Alex Johnson" value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
            )}

            <div>
              <label style={{ fontSize: 10, color: TEXT3, letterSpacing: ".1em", fontWeight: 700, display: "block", marginBottom: 7, textTransform: "uppercase" }}>Email</label>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputBase} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label style={{ fontSize: 10, color: TEXT3, letterSpacing: ".1em", fontWeight: 700, display: "block", marginBottom: 7, textTransform: "uppercase" }}>Password</label>
              <input type="password" placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"} value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputBase} onFocus={onFocus} onBlur={onBlur} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 11,
                background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.18)",
                fontSize: 13, color: "#f87171", lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: "14px 0", borderRadius: 13,
              fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              background: loading
                ? "rgba(79,172,254,.3)"
                : "linear-gradient(180deg,rgba(255,255,255,.1) 0%,rgba(255,255,255,0) 100%),linear-gradient(135deg,#4facfe,#7c6fff,#a78bfa)",
              border: "none", color: "#fff", letterSpacing: ".03em",
              boxShadow: loading ? "none" : "inset 0 1px 0 rgba(255,255,255,.14),0 8px 28px rgba(79,172,254,.32),0 0 0 1px rgba(79,172,254,.2)",
              transition: "all .18s cubic-bezier(.34,1.56,.64,1)",
            }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.18),0 16px 40px rgba(79,172,254,.46),0 0 0 1px rgba(79,172,254,.28)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = loading ? "none" : "inset 0 1px 0 rgba(255,255,255,.14),0 8px 28px rgba(79,172,254,.32),0 0 0 1px rgba(79,172,254,.2)"; }}
              onMouseDown={e => { if (!loading) { e.currentTarget.style.transform = "translateY(1px) scale(.984)"; e.currentTarget.style.boxShadow = "inset 0 2px 6px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.08),0 4px 10px rgba(79,172,254,.22)"; } }}
              onMouseUp={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,.18),0 16px 40px rgba(79,172,254,.46),0 0 0 1px rgba(79,172,254,.28)"; } }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,.25)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                    Please wait…
                  </span>
                : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          {/* Switch mode link */}
          <p style={{ margin: "20px 0 0", fontSize: 12, color: TEXT3, textAlign: "center" }}>
            {mode === "login"
              ? <>No account?{" "}
                  <button onClick={() => switchMode("signup")} style={{ background: "none", border: "none", color: "rgba(79,172,254,.75)", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                    Create one free →
                  </button>
                </>
              : <>Already have an account?{" "}
                  <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "rgba(79,172,254,.75)", cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                    Sign in →
                  </button>
                </>
            }
          </p>

          {/* Disclaimer */}
          <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(148,163,184,.2)", textAlign: "center" }}>
            Paper trading only · No real money involved
          </p>
        </div>
      </div>

      {/* Spin keyframe via style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
