const PROXY = "https://corsproxy.io/?url=";

export const fetchYF = async (symbol) => {
  const [chart, quote] = await Promise.all([
    fetch(`${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=3mo`)}`).then(r=>r.json()),
    fetch(`${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`)}`).then(r=>r.json()),
  ]);
  const res   = chart?.chart?.result?.[0];
  const meta  = res?.meta || {};
  const q     = quote?.quoteResponse?.result?.[0] || {};
  const ts    = res?.timestamp || [];
  const ohlcv = res?.indicators?.quote?.[0] || {};
  const closes=ohlcv.close||[], opens=ohlcv.open||[], highs=ohlcv.high||[], lows=ohlcv.low||[], vols=ohlcv.volume||[];
  const candles = ts.map((t,i)=>({
    date: new Date(t*1000).toLocaleDateString("en-US",{month:"short",day:"numeric"}),
    open:opens[i], high:highs[i], low:lows[i], close:closes[i], volume:vols[i],
  })).filter(c=>c.close!=null);
  return {
    symbol, candles,
    price:     meta.regularMarketPrice  ?? closes.at(-1),
    prevClose: meta.previousClose       ?? meta.chartPreviousClose,
    dayHigh:   meta.regularMarketDayHigh ?? q.dayHigh,
    dayLow:    meta.regularMarketDayLow  ?? q.dayLow,
    volume:    meta.regularMarketVolume  ?? q.regularMarketVolume,
    marketCap: q.marketCap,
    pe:        q.trailingPE,
    w52h:      q.fiftyTwoWeekHigh,
    w52l:      q.fiftyTwoWeekLow,
    name:      q.longName || q.shortName || symbol,
    sector:    q.sector || "—",
  };
};
