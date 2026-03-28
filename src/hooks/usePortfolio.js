import { useState, useEffect } from "react";
import { PORTFOLIO } from "../utils/constants";
import { savePortfolio, loadPortfolio } from "../utils/storage";
import { validateQuantity, validatePrice, validateCashAvailable, validatePositionExists } from "../utils/validation";

/**
 * Portfolio management hook with localStorage persistence
 * @returns {object} { cash, pos, log, buy, sell, portfolioValue, startingCash, reset }
 */
export function usePortfolio() {
  const [cash, setCash] = useState(PORTFOLIO.STARTING_CASH);
  const [pos, setPos] = useState({});
  const [log, setLog] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const { cash: savedCash, positions: savedPos, tradeLog: savedLog } = loadPortfolio();
    if (savedCash !== null) {
      setCash(savedCash);
      setPos(savedPos || {});
      setLog(savedLog || []);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever portfolio changes
  useEffect(() => {
    if (isHydrated) {
      savePortfolio(cash, pos, log);
    }
  }, [cash, pos, log, isHydrated]);

  /**
   * Execute a buy trade with validation
   * @param {string} sym - Symbol
   * @param {number} qty - Quantity to buy
   * @param {number} price - Current price
   * @returns {object} { success: boolean, error?: string }
   */
  const buy = (sym, qty, price) => {
    const qtyValidation = validateQuantity(qty);
    if (!qtyValidation.valid) return { success: false, error: qtyValidation.error };

    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) return { success: false, error: priceValidation.error };

    const cashValidation = validateCashAvailable(cash, qty, price);
    if (!cashValidation.valid) return { success: false, error: cashValidation.error };

    const cost = qty * price;
    setCash((c) => +(c - cost).toFixed(2));
    setPos((p) => ({ ...p, [sym]: (p[sym] || 0) + qty }));
    setLog((l) => [
      { type: "BUY", sym, qty, price, at: new Date().toLocaleTimeString() },
      ...l.slice(0, PORTFOLIO.MAX_TRADE_LOG_ENTRIES - 1),
    ]);

    return { success: true };
  };

  /**
   * Execute a sell trade with validation
   * @param {string} sym - Symbol
   * @param {number} qty - Quantity to sell
   * @param {number} price - Current price
   * @returns {object} { success: boolean, error?: string }
   */
  const sell = (sym, qty, price) => {
    const qtyValidation = validateQuantity(qty);
    if (!qtyValidation.valid) return { success: false, error: qtyValidation.error };

    const priceValidation = validatePrice(price);
    if (!priceValidation.valid) return { success: false, error: priceValidation.error };

    const posValidation = validatePositionExists(pos[sym], qty);
    if (!posValidation.valid) return { success: false, error: posValidation.error };

    setCash((c) => +(c + qty * price).toFixed(2));
    setPos((p) => {
      const next = (p[sym] || 0) - qty;
      if (next <= 0) {
        const { [sym]: _, ...rest } = p;
        return rest;
      }
      return { ...p, [sym]: next };
    });
    setLog((l) => [
      { type: "SELL", sym, qty, price, at: new Date().toLocaleTimeString() },
      ...l.slice(0, PORTFOLIO.MAX_TRADE_LOG_ENTRIES - 1),
    ]);

    return { success: true };
  };

  /**
   * Calculate total portfolio value
   * @param {object} watch - Watchlist data with prices
   * @returns {number} Total portfolio value
   */
  const portfolioValue = (watch) =>
    cash + Object.entries(pos).reduce((s, [k, v]) => s + v * (watch[k]?.price || 0), 0);

  const reset = () => {
    setCash(PORTFOLIO.STARTING_CASH);
    setPos({});
    setLog([]);
  };

  return { cash, pos, log, buy, sell, portfolioValue, startingCash: PORTFOLIO.STARTING_CASH, reset, isHydrated };
}
