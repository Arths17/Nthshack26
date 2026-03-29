import { useState, useEffect, useRef } from "react";
import { f2, fV, sma } from "../utils/formatters";

// Find pivot highs/lows — a point is a pivot if it's the highest/lowest of N bars each side
function calcSR(candles, pivotN = 5, maxLevels = 3) {
  const highs = [], lows = [];
  for (let i = pivotN; i < candles.length - pivotN; i++) {
    const slice = candles.slice(i - pivotN, i + pivotN + 1);
    const h = candles[i].high;
    const l = candles[i].low;
    if (h === Math.max(...slice.map(c => c.high))) highs.push(h);
    if (l === Math.min(...slice.map(c => c.low)))  lows.push(l);
  }
  // Cluster nearby levels (within 1.5%) and pick most significant
  function cluster(arr) {
    if (!arr.length) return [];
    const sorted = [...arr].sort((a, b) => a - b);
    const groups = [[sorted[0]]];
    for (let i = 1; i < sorted.length; i++) {
      const last = groups[groups.length - 1];
      if ((sorted[i] - last[0]) / last[0] < 0.015) last.push(sorted[i]);
      else groups.push([sorted[i]]);
    }
    return groups
      .sort((a, b) => b.length - a.length)
      .slice(0, maxLevels)
      .map(g => g.reduce((s, v) => s + v, 0) / g.length);
  }
  return { resistance: cluster(highs), support: cluster(lows) };
}

export default function Chart({ candles }) {
  const [hov, setHov]    = useState(null);
  const [drawn, setDrawn] = useState(false);
  const [showSR, setShowSR] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const pathRef = useRef(null);
  const [pLen, setPLen]  = useState(0);

  useEffect(() => { setDrawn(false); const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, [candles]);
  useEffect(() => {
    if (drawn && pathRef.current) { const l = pathRef.current.getTotalLength?.() || 3000; setPLen(l); }
  }, [drawn]);

  if (!candles?.length) return (
    <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(79,172,254,.15)", borderTop: "2px solid #4facfe", animation: "spin .8s linear infinite" }} />
    </div>
  );

  const W = 900, H = 300, PL = 48, PR = 12, PT = 12, PB = 60;
  const cw = W - PL - PR, ch = H - PT - PB - 40, n = candles.length;
  const allP = candles.flatMap(c => [c.high, c.low]).filter(Boolean);
  const mn = Math.min(...allP), mx = Math.max(...allP), rng = mx - mn || 1;
  const lo = mn - rng * .06, hi = mx + rng * .06;
  const xOf = i => PL + (i / (n - 1)) * cw;
  const yOf = v => PT + ch - ((v - lo) / (hi - lo)) * ch;
  
  // Volume calculations
  const volumes = candles.map(c => c.volume || 0);
  const maxVol = Math.max(...volumes, 1);
  const volH = 30; // Height of volume bars
  const volY = PT + ch + 10; // Y position of volume bars
  const volOf = (v) => (v / maxVol) * volH;
  const isUp = candles.at(-1).close >= candles[0].close;
  const lineColor = isUp ? "#4ade80" : "#f87171";
  const s20 = sma(candles, 20), s50 = sma(candles, 50);
  const { resistance, support } = calcSR(candles);

  const closePts = candles.map((c, i) => [xOf(i), yOf(c.close)]);
  const linePath = `M ${closePts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;
  const areaPath = `${linePath} L ${xOf(n - 1)} ${H - PB} L ${xOf(0)} ${H - PB} Z`;
  const toPath = (arr) => {
    const pts = arr.map((v, i) => v ? `${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}` : null);
    const segs = []; let cur = [];
    pts.forEach(p => { if (p) { cur.push(p); } else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    return segs.map(s => `M ${s.join(" L ")}`).join(" ");
  };
  const yticks = [0, .25, .5, .75, 1].map(t => lo + (hi - lo) * t);
  const xticks = [0, Math.floor(n * .25), Math.floor(n * .5), Math.floor(n * .75), n - 1];
  const gradId = isUp ? "chartGradGreen" : "chartGradRed";

  return (
    <div style={{ position: "relative", userSelect: "none" }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * W;
        const i = Math.max(0, Math.min(n - 1, Math.round((x - PL) / cw * (n - 1))));
        setHov({ i, ...candles[i], pct: (xOf(i) / W * 100) });
      }} onMouseLeave={() => setHov(null)}>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 300 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity=".22" />
            <stop offset="75%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chartGradRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity=".18" />
            <stop offset="75%" stopColor="#f87171" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <clipPath id="chartClip"><rect x={PL} y={PT} width={cw + 1} height={ch + 1} /></clipPath>
        </defs>

        <g clipPath="url(#chartClip)">
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Volume bars */}
          {showVolume && candles.map((c, i) => {
            const h = volOf(c.volume || 0);
            const w = Math.max(0.8, cw / (n * 1.3));
            const x = xOf(i) - w / 2;
            const y = volY - h;
            const isUpBar = c.close >= c.open;
            return (
              <rect key={`vol${i}`} x={x} y={y} width={w} height={h}
                fill={isUpBar ? "rgba(74,222,128,.25)" : "rgba(248,113,113,.25)"}
                opacity={hov?.i === i ? 0.5 : 0.25} />
            );
          })}

          {/* S/R lines */}
          {showSR && resistance.map((v, i) => (
            <line key={`r${i}`} x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="#f87171" strokeWidth="1" strokeDasharray="5 4" opacity=".5" />
          ))}
          {showSR && support.map((v, i) => (
            <line key={`s${i}`} x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="#4ade80" strokeWidth="1" strokeDasharray="5 4" opacity=".5" />
          ))}

          <path d={toPath(s50)} fill="none" stroke="#a78bfa" strokeWidth="1.2" opacity={showSMA ? ".7" : ".3"} strokeLinejoin="round" />
          <path d={toPath(s20)} fill="none" stroke="#4facfe" strokeWidth="1.2" opacity={showSMA ? ".7" : ".3"} strokeLinejoin="round" />
          <path ref={pathRef} d={linePath} fill="none" stroke={lineColor} strokeWidth="2" filter="url(#lineGlow)" strokeLinejoin="round" strokeLinecap="round"
            style={{ strokeDasharray: pLen || 9999, strokeDashoffset: drawn ? 0 : (pLen || 9999), transition: drawn ? "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" : "none" }} />
          {hov && <>
            <line x1={xOf(hov.i)} x2={xOf(hov.i)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3 4" />
            <circle cx={xOf(hov.i)} cy={yOf(hov.close)} r="5" fill={lineColor} stroke="rgba(15,20,35,.8)" strokeWidth="2.5" />
            <circle cx={xOf(hov.i)} cy={yOf(hov.close)} r="10" fill="none" stroke={lineColor} strokeWidth="1" opacity=".3" />
          </>}
        </g>

        {/* Y-axis labels (outside clip) */}
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="rgba(148,163,184,.06)" strokeWidth="1" />
            <text x={PL - 8} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill="rgba(148,163,184,.4)" fontFamily="'DM Sans',sans-serif">${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}</text>
          </g>
        ))}
        {/* X-axis labels (outside clip) */}
        {xticks.map((idx, i) => (
          <text key={i} x={xOf(idx)} y={H - 8} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,.4)" fontFamily="'DM Sans',sans-serif">{candles[idx]?.date}</text>
        ))}

        {/* S/R labels (outside clip, on the right) - rendered as HTML overlays for z-index control */}
      </svg>

      {hov && (
        <div style={{ position: "absolute", top: 10, left: hov.pct > 60 ? "auto" : `${Math.max(2, hov.pct + 1)}%`, right: hov.pct > 60 ? "1%" : "auto", background: "rgba(15,20,40,.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "10px 14px", fontSize: 11, lineHeight: 2, pointerEvents: "none", zIndex: 20, fontFamily: "'DM Sans',sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
          <div style={{ color: "rgba(148,163,184,.6)", marginBottom: 2, fontSize: 10 }}>{hov.date}</div>
          <div style={{ color: "#e2e8f0" }}>O <span style={{ color: "#fff" }}>${f2(hov.open)}</span>&nbsp;&nbsp;H <span style={{ color: "#4ade80" }}>${f2(hov.high)}</span></div>
          <div style={{ color: "#e2e8f0" }}>L <span style={{ color: "#f87171" }}>${f2(hov.low)}</span>&nbsp;&nbsp;C <span style={{ color: isUp ? "#4ade80" : "#f87171" }}>${f2(hov.close)}</span></div>
          <div style={{ color: "rgba(148,163,184,.5)", fontSize: 10 }}>Vol {fV(hov.volume)}</div>
        </div>
      )}

      {/* S/R labels as HTML overlays for proper z-index */}
      {showSR && resistance.map((v, i) => {
        const y = yOf(v);
        return (
          <div key={`rlabel${i}`} style={{ position: "absolute", left: `${((W - PR - 18) / W) * 100}%`, top: `${(y / H) * 100}%`, transform: "translate(-50%, -50%)", background: "rgba(248,113,113,.25)", border: "1px solid #f87171", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 600, color: "#f87171", fontFamily: "'DM Sans',sans-serif", pointerEvents: "none", zIndex: 30, whiteSpace: "nowrap" }}>
            R {f2(v)}
          </div>
        );
      })}
      {showSR && support.map((v, i) => {
        const y = yOf(v);
        return (
          <div key={`slabel${i}`} style={{ position: "absolute", left: `${((W - PR - 18) / W) * 100}%`, top: `${(y / H) * 100}%`, transform: "translate(-50%, -50%)", background: "rgba(74,222,128,.25)", border: "1px solid #4ade80", borderRadius: 3, padding: "1px 4px", fontSize: 7.5, fontWeight: 600, color: "#4ade80", fontFamily: "'DM Sans',sans-serif", pointerEvents: "none", zIndex: 30, whiteSpace: "nowrap" }}>
            S {f2(v)}
          </div>
        );
      })}

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 8, right: 16, display: "flex", gap: 8, fontSize: 10, fontFamily: "'DM Sans',sans-serif", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(148,163,184,.5)" }}>
          <span style={{ width: 16, height: 2, background: "#4facfe", display: "inline-block", borderRadius: 1 }} /> SMA20
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(148,163,184,.5)" }}>
          <span style={{ width: 16, height: 2, background: "#a78bfa", display: "inline-block", borderRadius: 1 }} /> SMA50
        </span>
        <button onClick={() => setShowVolume(v => !v)} 
          style={{ background: showVolume ? "rgba(255,255,255,.06)" : "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: showVolume ? "#e2e8f0" : "rgba(148,163,184,.4)", fontSize: 9, transition: "all .2s" }}
          title="Toggle volume bars">
          Vol {showVolume ? "on" : "off"}
        </button>
        <button onClick={() => setShowSMA(v => !v)} 
          style={{ background: showSMA ? "rgba(255,255,255,.06)" : "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: showSMA ? "#e2e8f0" : "rgba(148,163,184,.4)", fontSize: 9, transition: "all .2s" }}
          title="Toggle moving averages">
          SMA {showSMA ? "on" : "off"}
        </button>
        <button onClick={() => setShowSR(v => !v)} 
          style={{ background: showSR ? "rgba(255,255,255,.06)" : "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", color: showSR ? "#e2e8f0" : "rgba(148,163,184,.4)", fontSize: 9, transition: "all .2s" }}
          title="Toggle support/resistance">
          S/R {showSR ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
