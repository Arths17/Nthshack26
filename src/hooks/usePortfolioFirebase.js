import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { devLog } from "../utils/logger";
import {
  subscribeToPortfolio,
  subscribeToTrades,
  buyStock,
  sellStock,
  getUserProfile,
} from "../api/firebase";
import { PORTFOLIO } from "../utils/constants";

/**
 * usePortfolioFirebase - Manage user portfolio with Firebase persistence
 * Handles cash, positions, and trade history from Firestore
 */
export function usePortfolioFirebase() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [cash, setCash] = useState(PORTFOLIO.STARTING_CASH);
  const [pos, setPos] = useState({});
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Refs to track unsubscribers
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    devLog("[Portfolio] Auth user:", authUser?.email || "NOT AUTHENTICATED");
  }, [authUser]);

  // Load user profile and subscribe to portfolio/trades on auth change
  useEffect(() => {
    if (!authUser) {
      setLoading(false);
      return;
    }

    async function loadUserData() {
      try {
        // Get user profile (cash)
        const { data: profile, error: profileError } = await getUserProfile(authUser.uid);
        if (profileError) throw profileError;

        if (profile) {
          setCash(profile.currentCash || PORTFOLIO.STARTING_CASH);
        } else {
          setCash(PORTFOLIO.STARTING_CASH);
        }

        setUser(authUser);

        // Subscribe to real-time portfolio updates
        const unsubPortfolio = subscribeToPortfolio(authUser.uid, (holdings) => {
          setPos(holdings);
        });
        unsubscribersRef.current.push(unsubPortfolio);

        // Subscribe to real-time trade updates
        const unsubTrades = subscribeToTrades(authUser.uid, (trades) => {
          const formattedLog = trades
            .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))
            .slice(0, PORTFOLIO.LOG_ENTRIES)
            .map((t) => ({
              type: t.type,
              sym: t.symbol,
              qty: t.quantity,
              price: t.price,
              at: t.executedAt?.toDate?.() 
                ? new Date(t.executedAt.toDate()).toLocaleString() 
                : new Date(t.executedAt).toLocaleString(),
            }));
          setLog(formattedLog);
        });
        unsubscribersRef.current.push(unsubTrades);

        setLoading(false);
        setIsHydrated(true);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadUserData();

    // Cleanup subscriptions on unmount or auth change
    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [authUser]);

  // Buy stock: update cash and add position
  const buy = useCallback(
    async (sym, qty, price) => {
      devLog("[BUY] Starting buy request:", { sym, qty, price, authUserEmail: authUser?.email, authUserUid: authUser?.uid });

      if (!authUser) {
        const msg = "Not authenticated. Please log in to trade.";
        console.error("[BUY]", msg);
        setError(msg);
        return { success: false, error: "Please log in to trade" };
      }

      if (!qty || qty <= 0) {
        const msg = "Quantity must be greater than 0";
        console.error("[BUY]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      if (!price || price <= 0) {
        const msg = "Invalid price";
        console.error("[BUY]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      const cost = qty * price;
      if (cost > cash) {
        const msg = `Insufficient funds. Need $${cost.toFixed(2)}, have $${cash.toFixed(2)}`;
        console.error("[BUY]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      try {
        devLog(`[BUY] Processing: ${qty} shares of ${sym} @ $${price} (total: $${cost.toFixed(2)})`);
        const newCash = cash - cost;
        
        // Add to portfolio and update cash in Firebase
        const { error: buyError } = await buyStock(authUser.uid, sym, qty, price, newCash);
        if (buyError) {
          console.error("[BUY] Firebase error:", buyError);
          throw buyError;
        }

        // Update local cash
        setCash(newCash);

        const msg = `Bought ${qty} shares of ${sym}`;
        devLog("[BUY]", msg);
        setError(null);
        return { success: true, error: null };
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error("[BUY] Error:", errMsg);
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    },
    [authUser, cash]
  );

  // Sell stock: update cash and reduce position
  const sell = useCallback(
    async (sym, qty, price) => {
      if (!authUser) {
        const msg = "Not authenticated";
        console.error("[SELL]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      if (!qty || qty <= 0) {
        const msg = "Quantity must be greater than 0";
        console.error("[SELL]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      if (!price || price <= 0) {
        const msg = "Invalid price";
        console.error("[SELL]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      const held = pos[sym] || 0;
      if (qty > held) {
        const msg = `Insufficient position. Own ${held}, trying to sell ${qty}`;
        console.error("[SELL]", msg);
        setError(msg);
        return { success: false, error: msg };
      }

      try {
        devLog(`[SELL] Processing: ${qty} shares of ${sym} @ $${price}`);
        const proceeds = qty * price;
        const newCash = cash + proceeds;

        // Remove from portfolio and update cash in Firebase
        const { error: sellError } = await sellStock(authUser.uid, sym, qty, price, newCash);
        if (sellError) {
          console.error("[SELL] Firebase error:", sellError);
          throw sellError;
        }

        // Update local cash
        setCash(newCash);

        const msg = `Sold ${qty} shares of ${sym}`;
        devLog("[SELL]", msg);
        setError(null);
        return { success: true, error: null };
      } catch (err) {
        const errMsg = err.message || String(err);
        console.error("[SELL] Error:", errMsg);
        setError(errMsg);
        return { success: false, error: errMsg };
      }
    },
    [authUser, pos, cash]
  );

  return {
    user,
    cash,
    pos,
    log,
    buy,
    sell,
    loading,
    error,
    isHydrated,
  };
}
