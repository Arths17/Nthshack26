import { useState } from "react";

const STARTING_CASH = 100_000;

export function usePortfolio() {
  const [cash, setCash] = useState(STARTING_CASH);
  const [pos,  setPos]  = useState({});
  const [log,  setLog]  = useState([]);

  const buy = (sym, qty, price) => {
    const cost = qty * price;
    if (!qty || cost > cash) return;
    setCash(c => +(c - cost).toFixed(2));
    setPos(p => ({ ...p, [sym]: (p[sym] || 0) + qty }));
    setLog(l => [{ type: "BUY", sym, qty, price, at: new Date().toLocaleTimeString() }, ...l.slice(0, 19)]);
  };

  const sell = (sym, qty, price) => {
    if (!qty || qty > (pos[sym] || 0)) return;
    setCash(c => +(c + qty * price).toFixed(2));
    setPos(p => {
      const next = (p[sym] || 0) - qty;
      if (next <= 0) { const { [sym]: _, ...rest } = p; return rest; }
      return { ...p, [sym]: next };
    });
    setLog(l => [{ type: "SELL", sym, qty, price, at: new Date().toLocaleTimeString() }, ...l.slice(0, 19)]);
  };

  const portfolioValue = (watch) =>
    cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0);

  return { cash, pos, log, buy, sell, portfolioValue, startingCash: STARTING_CASH };
}
