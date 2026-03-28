import { useRef, useEffect } from "react";
import Glass from "./Glass";
import MarkdownText from "./MarkdownText";
import BacktestCard from "./BacktestCard";

export default function ChatPanel({ sym, msgs, input, setInput, busy, send }) {
  const chatRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, busy]);

  const suggestions = [
    `Analyze ${sym} with the live data`,
    `Should I buy ${sym} today?`,
    `Why is ${sym} moving?`,
    `Build me a strategy for ${sym}`,
  ];

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#4facfe,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5Z" fill="white" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc", letterSpacing: ".02em" }}>Quanta Intelligence</div>
            <div style={{ fontSize: 10, color: busy ? "#fbbf24" : "#4ade80", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: busy ? "#fbbf24" : "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
              {busy ? "Analyzing live data…" : "Connected to Yahoo Finance"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ animation: "slideUp .25s ease both" }}>
            {m.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "linear-gradient(135deg,rgba(79,172,254,.18),rgba(167,139,250,.18))", border: "1px solid rgba(79,172,254,.25)", borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 12, color: "#e2e8f0", lineHeight: 1.65, maxWidth: "88%" }}>
                  {m.content}
                </div>
              </div>
            ) : (
              <>
                <MarkdownText text={m.content} style={{ fontSize: 12, color: "rgba(148,163,184,.85)", lineHeight: 1.75 }} />
                {m.backtestResult && m.strategySpec && (
                  <BacktestCard spec={m.strategySpec} result={m.backtestResult} sym={m.sym} />
                )}
              </>
            )}
          </div>
        ))}

        {busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(79,172,254,.2)", borderTop: "2px solid #4facfe", animation: "spin .7s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "rgba(148,163,184,.4)", animation: "pulse 1.5s infinite" }}>Thinking…</span>
          </div>
        )}

        {msgs.length <= 1 && !busy && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {suggestions.map((p, i) => (
              <button key={i} onClick={() => send(p)} style={{
                textAlign: "left", padding: "9px 12px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)",
                color: "rgba(148,163,184,.6)", fontSize: 11, cursor: "pointer", lineHeight: 1.4,
                transition: "all .2s", display: "flex", alignItems: "center", gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(79,172,254,.08)"; e.currentTarget.style.borderColor = "rgba(79,172,254,.2)"; e.currentTarget.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.02)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.06)"; e.currentTarget.style.color = "rgba(148,163,184,.6)"; }}>
                <span style={{ fontSize: 14, color: "rgba(79,172,254,.5)" }}>→</span>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,.05)", flexShrink: 0 }}>
        <Glass style={{ borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(255,255,255,.08)", transition: "border-color .2s" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Ask about ${sym}…`} rows={1}
              style={{ flex: 1, fontSize: 12, lineHeight: "18px", color: "#e2e8f0", caretColor: "#4facfe" }} />
            <button onClick={() => send()} disabled={busy || !input.trim()} style={{
              width: 30, height: 30, borderRadius: 10, flexShrink: 0,
              background: input.trim() && !busy ? "linear-gradient(135deg,#4facfe,#a78bfa)" : "rgba(255,255,255,.06)",
              border: "none", color: input.trim() && !busy ? "#fff" : "rgba(148,163,184,.3)",
              cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s", boxShadow: input.trim() && !busy ? "0 0 16px rgba(79,172,254,.3)" : "none",
            }}>↑</button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(148,163,184,.25)", marginTop: 6, letterSpacing: ".04em" }}>⏎ to send · ⇧⏎ newline</div>
        </Glass>
      </div>
    </div>
  );
}

const panel = {
  borderRight: "1px solid rgba(255,255,255,.05)",
  display: "flex", flexDirection: "column",
  background: "rgba(8,14,30,.6)", backdropFilter: "blur(20px)",
  overflow: "hidden",
};
