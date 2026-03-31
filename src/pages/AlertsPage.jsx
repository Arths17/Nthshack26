import { useState, useEffect, useRef } from "react";
import Glass from "../components/Glass";
import { f2, SYMBOLS } from "../utils/formatters";

const green = "#4ade80", red = "#f87171", muted = "rgba(148,163,184,.5)", dim = "rgba(148,163,184,.25)";

function loadStored(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export default function AlertsPage({ watch }) {
  const [alerts,    setAlerts]    = useState(() => loadStored("quanta:alerts", []));
  const [triggered, setTriggered] = useState(() => loadStored("quanta:triggered", []));
  const [sym,       setSym]       = useState("NVDA");
  const [condition, setCondition] = useState("above");
  const [price,     setPrice]     = useState("");
  const [note,      setNote]      = useState("");
  const [toast,     setToast]     = useState(null);
  const toastTimer = useRef(null);

  // Persist alerts to localStorage
  useEffect(() => { localStorage.setItem("quanta:alerts",    JSON.stringify(alerts));    }, [alerts]);
  useEffect(() => { localStorage.setItem("quanta:triggered", JSON.stringify(triggered)); }, [triggered]);

  // Check alerts against live prices every time watch updates
  useEffect(() => {
    if (!alerts.length) return;
    const nowTriggered = [];
    const stillActive  = [];

    alerts.forEach(a => {
      const current = watch[a.sym]?.price;
      if (!current) { stillActive.push(a); return; }
      const hit = a.condition === "above" ? current >= a.price : current <= a.price;
      if (hit) {
        nowTriggered.push({ ...a, triggeredAt: current, triggeredTime: new Date().toLocaleTimeString() });
      } else {
        stillActive.push(a);
      }
    });

    if (nowTriggered.length) {
      setAlerts(stillActive);
      setTriggered(t => [...nowTriggered, ...t].slice(0, 20));
      const a = nowTriggered[0];
      showToast(`${a.sym} hit $${f2(a.triggeredAt)} — alert triggered!`, a.condition === "above" ? green : red);
    }
  }, [watch]);

  function showToast(msg, color) {
    setToast({ msg, color });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  function addAlert() {
    const p = parseFloat(price);
    if (!p || !sym) return;
    const current = watch[sym]?.price;
    // Warn if the condition is already met
    if (current && ((condition === "above" && current >= p) || (condition === "below" && current <= p))) {
      showToast(`${sym} is already ${condition} $${f2(p)} right now!`, "#fbbf24");
      return;
    }
    setAlerts(a => [{ id: Date.now(), sym, condition, price: p, note: note.trim(), addedAt: new Date().toLocaleTimeString() }, ...a]);
    setPrice("");
    setNote("");
  }

  const currentPrice = watch[sym]?.price;

  return (
    <div className="q-page-scroll q-page-in" style={{ position: "relative" }}>

      {/* Toast notification */}
      {toast && (
        <div
          className="q-toast"
          style={{
          position: "fixed", top: 80, right: 24, zIndex: 100,
          background: "rgba(15,20,40,.97)", border: `1px solid ${toast.color}40`,
          borderRadius: 14, padding: "12px 18px", boxShadow: `0 0 32px ${toast.color}30`,
          maxWidth: 300,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: toast.color, flexShrink: 0, boxShadow: `0 0 10px ${toast.color}` }} />
          <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 500 }}>{toast.msg}</span>
        </div>
      )}

      {/* Add alert form */}
      <Glass style={{ padding: "18px 20px", borderRadius: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 14 }}>
          Set a Price Alert
          <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>we'll notify you when your target is hit</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Symbol */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Stock</label>
            <select value={sym} onChange={e => setSym(e.target.value)} style={{
              padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.05)", color: "#e2e8f0", fontSize: 12, cursor: "pointer", outline: "none",
            }}>
              {SYMBOLS.map(s => <option key={s} value={s} style={{ background: "#0f1420" }}>{s}</option>)}
            </select>
          </div>

          {/* Condition */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Condition</label>
            <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)" }}>
              {["above", "below"].map(c => (
                <button key={c} onClick={() => setCondition(c)} style={{
                  padding: "8px 16px", fontSize: 12, cursor: "pointer", border: "none", transition: "all .2s",
                  background: condition === c ? (c === "above" ? "rgba(74,222,128,.15)" : "rgba(248,113,113,.15)") : "rgba(255,255,255,.03)",
                  color: condition === c ? (c === "above" ? green : red) : muted,
                  fontWeight: condition === c ? 600 : 400,
                }}>
                  {c === "above" ? "Rises above" : "Drops below"}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>
              Target Price {currentPrice ? <span style={{ color: dim }}>· now ${f2(currentPrice)}</span> : ""}
            </label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addAlert()}
              placeholder="e.g. 180.00"
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#e2e8f0", fontSize: 12, width: 130, outline: "none" }} />
          </div>

          {/* Note */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 140 }}>
            <label style={{ fontSize: 10, color: muted, textTransform: "uppercase", letterSpacing: ".06em" }}>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addAlert()}
              placeholder="e.g. buy signal"
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.05)", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
          </div>

          {/* Add button */}
          <button onClick={addAlert} disabled={!price} style={{
            padding: "9px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
            background: price ? "linear-gradient(135deg,#4facfe,#a78bfa)" : "rgba(255,255,255,.06)",
            color: price ? "#fff" : muted, transition: "all .2s",
            boxShadow: price ? "0 0 16px rgba(79,172,254,.3)" : "none",
          }}>
            Set Alert
          </button>
        </div>
      </Glass>

      {/* Active alerts */}
      <Glass style={{ padding: "14px 18px", borderRadius: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", marginBottom: 12 }}>
          Active Alerts
          {alerts.length > 0 && <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>{alerts.length} watching</span>}
        </div>
        {alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: muted, fontSize: 12 }}>
            No active alerts — set one above
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map(a => {
              const current = watch[a.sym]?.price;
              const diff = current ? ((current - a.price) / a.price * 100) : null;
              const isAbove = a.condition === "above";
              const close = diff != null && Math.abs(diff) < 3;
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: close ? (isAbove ? "rgba(74,222,128,.05)" : "rgba(248,113,113,.05)") : "rgba(255,255,255,.03)", borderRadius: 12, border: `1px solid ${close ? (isAbove ? "rgba(74,222,128,.2)" : "rgba(248,113,113,.2)") : "rgba(255,255,255,.06)"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isAbove ? green : red, animation: "pulse 2s infinite", boxShadow: `0 0 8px ${isAbove ? green : red}`, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                      {a.sym} {isAbove ? "rises above" : "drops below"} <span style={{ color: isAbove ? green : red }}>${f2(a.price)}</span>
                    </div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
                      Set at {a.addedAt} · Now ${current ? f2(current) : "—"}
                      {diff != null && <span style={{ color: close ? "#fbbf24" : dim }}> · {Math.abs(diff).toFixed(1)}% away</span>}
                      {a.note && <span style={{ color: dim }}> · {a.note}</span>}
                    </div>
                  </div>
                  {close && <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 600, background: "rgba(251,191,36,.1)", padding: "2px 8px", borderRadius: 6 }}>Close!</span>}
                  <button onClick={() => setAlerts(al => al.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", color: dim, cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                </div>
              );
            })}
          </div>
        )}
      </Glass>

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <Glass style={{ padding: "14px 18px", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9" }}>
              Triggered <span style={{ fontSize: 10, color: muted, fontWeight: 400, marginLeft: 8 }}>alerts that fired</span>
            </div>
            <button onClick={() => setTriggered([])} style={{ fontSize: 10, color: dim, background: "none", border: "none", cursor: "pointer" }}>Clear all</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {triggered.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "rgba(255,255,255,.02)", borderRadius: 10, opacity: .7 }}>
                <span style={{ fontSize: 11, color: a.condition === "above" ? green : red }}>✓</span>
                <span style={{ fontSize: 12, color: "#e2e8f0", flex: 1 }}>
                  {a.sym} {a.condition === "above" ? "rose above" : "dropped below"} ${f2(a.price)}
                  <span style={{ color: muted }}> — hit at ${f2(a.triggeredAt)}</span>
                </span>
                <span style={{ fontSize: 10, color: dim }}>{a.triggeredTime}</span>
              </div>
            ))}
          </div>
        </Glass>
      )}
    </div>
  );
}
