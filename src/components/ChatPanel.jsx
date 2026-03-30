import { useRef, useEffect } from "react";
import Glass from "./Glass";
import MarkdownText from "./MarkdownText";
import BacktestCard from "./BacktestCard";

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 4l8 8h-5v8h-6v-8H4l8-8z" />
    </svg>
  );
}

export default function ChatPanel({ sym, msgs, input, setInput, busy, send }) {
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, busy]);

  useEffect(() => {
    window.quantaChatFocus = () => inputRef.current?.focus();
  }, []);

  const suggestions = [
    `Should I buy ${sym} right now?`,
    `Why is ${sym} going up or down today?`,
    `Is ${sym} a good stock to invest in?`,
    `Build me a simple strategy for ${sym} — explain everything`,
  ];

  const canSend = input.trim() && !busy;

  return (
    <div className="q-chat">
      <div className="q-chat__header">
        <div className="q-chat__header-row">
          <div className="q-chat__logo" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L9.5 9.5L2 12L9.5 14.5L12 22L14.5 14.5L22 12L14.5 9.5Z" fill="white" />
            </svg>
          </div>
          <div>
            <div className="q-chat__title">Quanta Intelligence</div>
            <div className={`q-chat__status ${busy ? "q-chat__status--busy" : "q-chat__status--ready"}`}>
              <span
                className="q-chat__status-dot"
                style={{ background: busy ? "var(--q-warning)" : "var(--q-success)" }}
              />
              {busy ? "Analyzing live data…" : "Connected to Yahoo Finance"}
            </div>
          </div>
        </div>
      </div>

      <div ref={chatRef} className="q-chat__messages" role="log" aria-live="polite" aria-relevant="additions">
        {msgs.map((m, i) => (
          <div key={i} style={{ animation: "slideUp .25s ease both" }}>
            {m.role === "user" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div className="q-chat__bubble-user">{m.content}</div>
              </div>
            ) : (
              <>
                <MarkdownText
                  text={m.content}
                  style={{ fontSize: 12, color: "var(--q-text-secondary)", lineHeight: 1.75 }}
                />
                {m.backtestResult && m.strategySpec && (
                  <BacktestCard spec={m.strategySpec} result={m.backtestResult} sym={m.sym} />
                )}
              </>
            )}
          </div>
        ))}

        {busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid rgba(79,172,254,.2)",
                borderTop: "2px solid var(--q-accent)",
                animation: "spin .7s linear infinite",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: "var(--q-text-faint)", animation: "pulse 1.5s infinite" }}>Thinking…</span>
          </div>
        )}

        {msgs.length <= 1 && !busy && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {suggestions.map((p, i) => (
              <button key={i} type="button" onClick={() => send(p)} className="q-chat__suggestion">
                <span style={{ fontSize: 13, color: "rgba(79,172,254,.55)", flexShrink: 0 }}>→</span>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="q-chat__input-wrap">
        <Glass className="q-chat__composer">
          <div className="q-chat__composer-inner">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Ask about ${sym}…`}
              rows={1}
              className="q-chat__textarea"
              aria-label={`Message about ${sym}`}
              aria-describedby="chat-help"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!canSend}
              className="q-chat__send"
              aria-label="Send message"
              title="Send (Enter)"
            >
              <SendIcon />
            </button>
          </div>
        </Glass>
        <span id="chat-help" className="sr-only">
          Press Enter to send. Shift+Enter for a new line.
        </span>
      </div>
    </div>
  );
}
