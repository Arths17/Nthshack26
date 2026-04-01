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

export default function Chart({
  candles,
  loading = false,
  errorMessage = null,
  sym,
  timeframe,
  timeframes = [],
  onTimeframeChange,
}) {
  const [hov, setHov]    = useState(null);
  const [drawn, setDrawn] = useState(false);
  const [showSR, setShowSR] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const pathRef = useRef(null);
  const [pLen, setPLen]  = useState(0);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 900, h: 320 });

  useEffect(() => { setDrawn(false); const t = setTimeout(() => setDrawn(true), 80); return () => clearTimeout(t); }, [candles]);
  useEffect(() => {
    if (drawn && pathRef.current) { const l = pathRef.current.getTotalLength?.() || 3000; setPLen(l); }
  }, [drawn]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const r = entry.contentRect;
        const nextW = Math.max(320, Math.floor(r.width));
        const measuredH = r.height > 0 ? r.height : r.width * 0.42;
        const nextH = Math.max(220, Math.min(520, Math.floor(measuredH)));
        setSize(prev => {
          if (prev.w === nextW && prev.h === nextH) return prev;
          return { w: nextW, h: nextH };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (errorMessage) {
    return (
      <div ref={containerRef} className="q-chart-placeholder q-chart-placeholder--error" role="alert">
        <div className="q-chart-placeholder__inner">
          <p className="q-chart-placeholder__title">Couldn&apos;t load chart</p>
          <p className="q-chart-placeholder__detail">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (loading && !candles?.length) {
    return (
      <div ref={containerRef} className="q-chart-placeholder" aria-busy="true">
        <div className="q-chart-placeholder__spinner" />
        <p className="q-chart-placeholder__hint">Loading prices…</p>
      </div>
    );
  }

  if (!candles?.length) {
    return (
      <div ref={containerRef} className="q-chart-placeholder">
        <p className="q-chart-placeholder__hint">No candle data for this range yet.</p>
      </div>
    );
  }

  const W = size.w, H = size.h, PL = 48, PR = 14, PT = 14, PB = 64;
  const volBandH = 58;
  const volGap = 14;
  const priceH = H - PT - PB - volBandH - volGap;
  const chartBottom = PT + priceH;
  const cw = W - PL - PR;
  const ch = priceH;
  const n = candles.length;
  const nSafe = Math.max(2, n);
  const allP = candles.flatMap(c => [c.high, c.low]).filter(Boolean);
  const mn = Math.min(...allP), mx = Math.max(...allP), rng = mx - mn || 1;
  const lo = mn - rng * .06, hi = mx + rng * .06;
  const xOf = i => PL + (i / (nSafe - 1)) * cw;
  const yOf = v => PT + ch - ((v - lo) / (hi - lo)) * ch;
  
  // Volume calculations
  const volumes = candles.map(c => c.volume || 0);
  const maxVol = Math.max(...volumes, 1);
  const volTop = chartBottom + volGap;
  const volH = volBandH;
  const volBase = volTop + volH;
  const volOf = (v) => (v / maxVol) * Math.max(6, volH - 10);
  const isUp = candles.at(-1).close >= candles[0].close;
  const lineColor = isUp ? "#4ade80" : "#f87171";
  const s20 = sma(candles, 20), s50 = sma(candles, 50);
  const { resistance, support } = calcSR(candles);

  const closePts = candles.map((c, i) => [xOf(i), yOf(c.close)]);
  const linePath = `M ${closePts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")}`;
  const areaPath = `${linePath} L ${xOf(n - 1)} ${chartBottom} L ${xOf(0)} ${chartBottom} Z`;
  const toPath = (arr) => {
    const pts = arr.map((v, i) => v ? `${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}` : null);
    const segs = []; let cur = [];
    pts.forEach(p => { if (p) { cur.push(p); } else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    return segs.map(s => `M ${s.join(" L ")}`).join(" ");
  };
  const mid = lo + (hi - lo) * 0.5;
  const yticks = [lo, mid, hi];
  const xticks = [0, Math.floor(n * .33), Math.floor(n * .66), n - 1];
  const baseline = candles[0]?.close || candles[0]?.open || mid;
  const gradId = isUp ? "chartGradGreen" : "chartGradRed";

  return (
    <div
      ref={containerRef}
      className="q-chart-surface"
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * W;
        const i = Math.max(0, Math.min(n - 1, Math.round((x - PL) / cw * (n - 1))));
        setHov({ i, ...candles[i], pct: (xOf(i) / W * 100) });
      }}
      onMouseLeave={() => setHov(null)}
    >

      <div className="q-chart__toolbar">
        <div>
          <div className="q-chart__title">{sym || "Price & volume"}</div>
          <div className="q-chart__subtitle">20/50 MA, support/resistance, volume</div>
        </div>
        <div className="q-chart__toolbar-right">
          {timeframes.length > 0 && (
            <div className="q-chart__pills">
              {timeframes.map(tf => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => onTimeframeChange?.(tf.id)}
                  className={`q-chart__pill ${timeframe === tf.id ? "q-chart__pill--active" : ""}`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          )}
          <div className="q-chart__toggles">
            {[{ id: "sma", label: "MAs", on: showSMA, set: setShowSMA }, { id: "vol", label: "Vol", on: showVolume, set: setShowVolume }, { id: "sr", label: "S/R", on: showSR, set: setShowSR }].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => t.set(v => !v)}
                className={`q-chart__toggle ${t.on ? "q-chart__toggle--on" : ""}`}
                aria-pressed={t.on}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
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
          <clipPath id="chartClip"><rect x={PL} y={PT} width={cw + 1} height={H - PT - PB + volBandH} /></clipPath>
        </defs>

        <g clipPath="url(#chartClip)">
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Volume bars (separate band) */}
          {showVolume && candles.map((c, i) => {
            const h = volOf(c.volume || 0);
            const w = Math.max(1, cw / (n * 1.25));
            const x = xOf(i) - w / 2;
            const y = volBase - h;
            const isUpBar = c.close >= c.open;
            return (
              <rect
                key={`vol${i}`}
                x={x}
                y={y}
                width={w}
                height={h}
                fill={isUpBar ? "rgba(74,222,128,.3)" : "rgba(248,113,113,.28)"}
                opacity={hov?.i === i ? 0.55 : 0.3}
              />
            );
          })}

          {/* S/R lines */}
          {showSR && resistance.map((v, i) => (
            <line key={`r${i}`} x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="#f87171" strokeWidth="1" strokeDasharray="5 4" opacity=".5" />
          ))}
          {showSR && support.map((v, i) => (
            <line key={`s${i}`} x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke="#4ade80" strokeWidth="1" strokeDasharray="5 4" opacity=".5" />
          ))}

          <path d={toPath(s50)} fill="none" stroke="#a78bfa" strokeWidth="1.2" opacity={showSMA ? ".8" : ".2"} strokeLinejoin="round" />
          <path d={toPath(s20)} fill="none" stroke="#4facfe" strokeWidth="1.2" opacity={showSMA ? ".8" : ".2"} strokeLinejoin="round" />
          <line x1={PL} x2={W - PR} y1={yOf(baseline)} y2={yOf(baseline)} stroke="rgba(255,255,255,.16)" strokeWidth="1.2" strokeDasharray="6 4" />
          <path ref={pathRef} d={linePath} fill="none" stroke={lineColor} strokeWidth="2" filter="url(#lineGlow)" strokeLinejoin="round" strokeLinecap="round"
            style={{ strokeDasharray: pLen || 9999, strokeDashoffset: drawn ? 0 : (pLen || 9999), transition: drawn ? "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" : "none" }} />
          {hov && <>
            <line x1={xOf(hov.i)} x2={xOf(hov.i)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.14)" strokeWidth="1" strokeDasharray="3 4" />
            <line x1={PL} x2={W - PR} y1={yOf(hov.close)} y2={yOf(hov.close)} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3 4" />
            <circle cx={xOf(hov.i)} cy={yOf(hov.close)} r="5" fill={lineColor} stroke="rgba(15,20,35,.8)" strokeWidth="2.5" />
            <circle cx={xOf(hov.i)} cy={yOf(hov.close)} r="10" fill="none" stroke={lineColor} strokeWidth="1" opacity=".3" />
          </>}
        </g>

        {/* Y-axis labels (outside clip) */}
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={yOf(v)} y2={yOf(v)} stroke={i === 1 ? "rgba(148,163,184,.14)" : "rgba(148,163,184,.06)"} strokeWidth={i === 1 ? "1.2" : "1"} />
            <text x={PL - 8} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill={i === 1 ? "rgba(226,232,240,.78)" : "rgba(148,163,184,.5)"} fontFamily="'DM Sans',sans-serif">${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}</text>
          </g>
        ))}
        {/* X-axis labels (outside clip) */}
        {xticks.map((idx, i) => {
          const safeIdx = Math.min(Math.max(idx, 0), n - 1);
          return (
            <text key={i} x={xOf(safeIdx)} y={H - 8} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,.4)" fontFamily="'DM Sans',sans-serif">{candles[safeIdx]?.date}</text>
          );
        })}

        {/* S/R labels (outside clip, on the right) - rendered as HTML overlays for z-index control */}
      </svg>

      {hov && (
        <div
          className="q-chart-tooltip"
          style={{ left: hov.pct > 60 ? "auto" : `${Math.max(2, hov.pct + 1)}%`, right: hov.pct > 60 ? "1%" : "auto" }}
        >
          <div className="q-chart-tooltip__date">{hov.date}</div>
          <div className="q-chart-tooltip__row">O <span className="q-chart-tooltip__value">${f2(hov.open)}</span>&nbsp;&nbsp;H <span className="q-chart-tooltip__value q-chart-tooltip__value--up">${f2(hov.high)}</span></div>
          <div className="q-chart-tooltip__row">L <span className="q-chart-tooltip__value q-chart-tooltip__value--down">${f2(hov.low)}</span>&nbsp;&nbsp;C <span className={`q-chart-tooltip__value ${isUp ? "q-chart-tooltip__value--up" : "q-chart-tooltip__value--down"}`}>${f2(hov.close)}</span></div>
          <div className="q-chart-tooltip__meta">Vol {fV(hov.volume)}</div>
        </div>
      )}

      {/* S/R labels as HTML overlays for proper z-index */}
      {showSR && resistance.map((v, i) => {
        const y = yOf(v);
        return (
          <div key={`rlabel${i}`} className="q-chart-level-label q-chart-level-label--resistance" style={{ left: `${((W - PR - 18) / W) * 100}%`, top: `${(y / H) * 100}%` }}>
            R {f2(v)}
          </div>
        );
      })}
      {showSR && support.map((v, i) => {
        const y = yOf(v);
        return (
          <div key={`slabel${i}`} className="q-chart-level-label q-chart-level-label--support" style={{ left: `${((W - PR - 18) / W) * 100}%`, top: `${(y / H) * 100}%` }}>
            S {f2(v)}
          </div>
        );
      })}

      {/* Legend */}
      <div className="q-chart-legend" aria-hidden>
        <span className="q-chart-legend__item">
          <span className="q-chart-legend__swatch q-chart-legend__swatch--sma20" /> SMA20
        </span>
        <span className="q-chart-legend__item">
          <span className="q-chart-legend__swatch q-chart-legend__swatch--sma50" /> SMA50
        </span>
      </div>
    </div>
  );
}
