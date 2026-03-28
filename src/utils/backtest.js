import { ema, smaIndicator, rsi } from "./indicators";

const INITIAL_CAPITAL = 100_000;

/**
 * Build per-bar signal arrays from a parsed strategy spec + candle data.
 * Returns { entrySignals, exitSignals } — boolean arrays aligned to candles.
 */
function buildSignals(candles, spec) {
  const closes = candles.map(c => c.close);
  const n = closes.length;

  const entrySignals = new Array(n).fill(false);
  const exitSignals  = new Array(n).fill(false);

  const { entry, exit, stopLoss, takeProfit } = spec;

  // --- compute indicator arrays ---
  let fastEma, slowEma, fastSma, slowSma, rsiArr, maArr;

  if (["ema_cross_above", "ema_cross_below"].includes(entry.type) ||
      ["ema_cross_above", "ema_cross_below"].includes(exit.type)) {
    const fp = entry.fast || exit.fast || 12;
    const sp = entry.slow || exit.slow || 26;
    fastEma = ema(closes, fp);
    slowEma = ema(closes, sp);
  }
  if (["sma_cross_above", "sma_cross_below"].includes(entry.type) ||
      ["sma_cross_above", "sma_cross_below"].includes(exit.type)) {
    const fp = entry.fast || exit.fast || 10;
    const sp = entry.slow || exit.slow || 20;
    fastSma = smaIndicator(closes, fp);
    slowSma = smaIndicator(closes, sp);
  }
  if (["rsi_below", "rsi_above"].includes(entry.type) ||
      ["rsi_below", "rsi_above"].includes(exit.type)) {
    const p = entry.period || exit.period || 14;
    rsiArr = rsi(closes, p);
  }
  if (["price_above_ema", "price_below_ema"].includes(entry.type) ||
      ["price_above_ema", "price_below_ema"].includes(exit.type)) {
    maArr = ema(closes, entry.period || exit.period || 50);
  }
  if (["price_above_sma", "price_below_sma"].includes(entry.type) ||
      ["price_above_sma", "price_below_sma"].includes(exit.type)) {
    maArr = smaIndicator(closes, entry.period || exit.period || 50);
  }

  // --- build signals bar by bar ---
  for (let i = 1; i < n; i++) {
    // Entry
    switch (entry.type) {
      case "ema_cross_above":
        entrySignals[i] = fastEma[i] !== null && slowEma[i] !== null &&
          fastEma[i] > slowEma[i] && fastEma[i-1] <= slowEma[i-1];
        break;
      case "sma_cross_above":
        entrySignals[i] = fastSma[i] !== null && slowSma[i] !== null &&
          fastSma[i] > slowSma[i] && fastSma[i-1] <= slowSma[i-1];
        break;
      case "rsi_below":
        entrySignals[i] = rsiArr[i] !== null && rsiArr[i] < (entry.threshold ?? 30) &&
          (rsiArr[i-1] === null || rsiArr[i-1] >= (entry.threshold ?? 30));
        break;
      case "price_above_ema":
      case "price_above_sma":
        entrySignals[i] = maArr[i] !== null && closes[i] > maArr[i] && closes[i-1] <= maArr[i-1];
        break;
    }

    // Exit (crossover-based)
    switch (exit.type) {
      case "ema_cross_below":
        exitSignals[i] = fastEma[i] !== null && slowEma[i] !== null &&
          fastEma[i] < slowEma[i] && fastEma[i-1] >= slowEma[i-1];
        break;
      case "sma_cross_below":
        exitSignals[i] = fastSma[i] !== null && slowSma[i] !== null &&
          fastSma[i] < slowSma[i] && fastSma[i-1] >= slowSma[i-1];
        break;
      case "rsi_above":
        exitSignals[i] = rsiArr[i] !== null && rsiArr[i] > (exit.threshold ?? 70) &&
          (rsiArr[i-1] === null || rsiArr[i-1] <= (exit.threshold ?? 70));
        break;
      case "price_below_ema":
      case "price_below_sma":
        exitSignals[i] = maArr[i] !== null && closes[i] < maArr[i] && closes[i-1] >= maArr[i-1];
        break;
    }
  }

  return { entrySignals, exitSignals, stopLoss: stopLoss || null, takeProfit: takeProfit || null };
}

/**
 * Simulate trades and compute performance metrics.
 */
export function runBacktest(candles, strategySpec) {
  if (!candles || candles.length < 10) {
    return null;
  }

  const { entrySignals, exitSignals, stopLoss, takeProfit } = buildSignals(candles, strategySpec);
  const closes = candles.map(c => c.close);
  const n = closes.length;

  let capital = INITIAL_CAPITAL;
  let inTrade = false;
  let entryPrice = 0;
  let shares = 0;
  let entryBar = 0;

  const trades = [];
  const equity = [INITIAL_CAPITAL]; // equity curve, one value per candle

  for (let i = 1; i < n; i++) {
    const price = closes[i];

    if (inTrade) {
      // Check stop-loss / take-profit first
      let forceExit = false;
      if (stopLoss  && price <= entryPrice * (1 - stopLoss))  forceExit = true;
      if (takeProfit && price >= entryPrice * (1 + takeProfit)) forceExit = true;

      if (forceExit || exitSignals[i]) {
        const pnl = (price - entryPrice) * shares;
        capital += shares * price;
        trades.push({
          entry: entryPrice,
          exit: price,
          entryDate: candles[entryBar].date,
          exitDate: candles[i].date,
          pnl,
          pnlPct: ((price - entryPrice) / entryPrice) * 100,
          bars: i - entryBar,
        });
        inTrade = false;
        shares = 0;
      }
    }

    if (!inTrade && entrySignals[i]) {
      shares = Math.floor(capital / price);
      if (shares > 0) {
        capital -= shares * price;
        entryPrice = price;
        entryBar = i;
        inTrade = true;
      }
    }

    equity.push(inTrade ? capital + shares * price : capital);
  }

  // Close any open trade at last price
  if (inTrade) {
    const price = closes[n - 1];
    const pnl = (price - entryPrice) * shares;
    capital += shares * price;
    trades.push({
      entry: entryPrice,
      exit: price,
      entryDate: candles[entryBar].date,
      exitDate: candles[n - 1].date,
      pnl,
      pnlPct: ((price - entryPrice) / entryPrice) * 100,
      bars: n - 1 - entryBar,
      open: true,
    });
  }

  const finalCapital = capital;
  const totalReturn  = ((finalCapital - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100;
  const wins         = trades.filter(t => t.pnl > 0);
  const winRate      = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin       = wins.length ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
  const losses       = trades.filter(t => t.pnl <= 0);
  const avgLoss      = losses.length ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;
  const profitFactor = losses.reduce((s, t) => s - t.pnl, 0) === 0
    ? Infinity
    : wins.reduce((s, t) => s + t.pnl, 0) / Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  // Max drawdown on equity curve
  let peak = equity[0], maxDD = 0;
  for (const val of equity) {
    if (val > peak) peak = val;
    const dd = (peak - val) / peak * 100;
    if (dd > maxDD) maxDD = dd;
  }

  // Sharpe ratio (daily returns, annualised)
  const dailyReturns = equity.slice(1).map((v, i) => (v - equity[i]) / equity[i]);
  const meanR = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const stdR  = Math.sqrt(dailyReturns.reduce((s, r) => s + (r - meanR) ** 2, 0) / dailyReturns.length);
  const sharpe = stdR === 0 ? 0 : (meanR / stdR) * Math.sqrt(252);

  return {
    totalReturn: +totalReturn.toFixed(2),
    finalCapital: +finalCapital.toFixed(2),
    sharpe: +sharpe.toFixed(2),
    winRate: +winRate.toFixed(1),
    maxDrawdown: +maxDD.toFixed(2),
    profitFactor: isFinite(profitFactor) ? +profitFactor.toFixed(2) : null,
    totalTrades: trades.length,
    avgWin: +avgWin.toFixed(2),
    avgLoss: +avgLoss.toFixed(2),
    trades,
    equity,
    bars: n,
  };
}
