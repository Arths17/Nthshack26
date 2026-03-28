import { f2 } from "../utils/formatters";
import { SYMBOLS } from "../utils/formatters";

export default function Ticker({ watch, loading, onSelect }) {
  if (loading) {
    return (
      <div style={bar}>
        <div className="skel" style={{ width: "100%", height: "100%", borderRadius: 0 }} />
      </div>
    );
  }

  return (
    <div style={bar}>
      <div style={{ display: "flex", animation: "ticker 55s linear infinite", whiteSpace: "nowrap" }}>
        {[...SYMBOLS, ...SYMBOLS].map((s, i) => {
          const d = watch[s];
          if (!d) return null;
          const chg = d.price && d.prevClose ? (d.price - d.prevClose) / d.prevClose * 100 : 0;
          return (
            <span key={i} onClick={() => onSelect(s)}
              style={{ padding: "0 22px", fontSize: 11, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0, transition: "opacity .2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".5"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <span style={{ color: "rgba(148,163,184,.4)", fontWeight: 500 }}>{s}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 500 }}>${f2(d.price)}</span>
              <span style={{ fontSize: 10, color: chg >= 0 ? "#4ade80" : "#f87171", fontWeight: 500 }}>
                {chg >= 0 ? "▲" : "▼"}{Math.abs(chg).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const bar = {
  position: "relative", zIndex: 10, height: 30,
  borderBottom: "1px solid rgba(255,255,255,.05)",
  overflow: "hidden", display: "flex", alignItems: "center",
  background: "rgba(8,14,30,.8)", backdropFilter: "blur(20px)", flexShrink: 0,
};
