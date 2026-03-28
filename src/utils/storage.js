/**
 * localStorage utilities for persisting portfolio data
 */

import { STORAGE_KEYS } from "./constants";

/**
 * Save portfolio data to localStorage
 * @param {number} cash
 * @param {object} positions
 * @param {array} tradeLog
 */
export const savePortfolio = (cash, positions, tradeLog) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_CASH, JSON.stringify(cash));
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_POSITIONS, JSON.stringify(positions));
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_TRADE_LOG, JSON.stringify(tradeLog));
  } catch (e) {
    console.error("Failed to save portfolio to localStorage:", e);
  }
};

/**
 * Load portfolio data from localStorage
 * @returns {object} { cash, positions, tradeLog }
 */
export const loadPortfolio = () => {
  try {
    const cash = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO_CASH)) ?? null;
    const positions = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO_POSITIONS)) ?? null;
    const tradeLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.PORTFOLIO_TRADE_LOG)) ?? null;
    return { cash, positions, tradeLog };
  } catch (e) {
    console.error("Failed to load portfolio from localStorage:", e);
    return { cash: null, positions: null, tradeLog: null };
  }
};

/**
 * Clear stored portfolio data
 */
export const clearPortfolio = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_CASH);
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_POSITIONS);
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_TRADE_LOG);
  } catch (e) {
    console.error("Failed to clear portfolio from localStorage:", e);
  }
};
