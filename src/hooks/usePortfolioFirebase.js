import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
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
      if (!authUser) {
        setError("Not authenticated");
        return false;
      }

      const cost = qty * price;
      if (cost > cash) {
        setError("Insufficient funds");
        return false;
      }

      try {
        // Add to portfolio
        const { error: buyError } = await buyStock(authUser.uid, sym, qty, price);
        if (buyError) throw buyError;

        // Update cash
        setCash((prev) => prev - cost);

        // Cash will be persisted in the backend
        setError(null);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [authUser, cash]
  );

  // Sell stock: update cash and reduce position
  const sell = useCallback(
    async (sym, qty, price) => {
      if (!authUser) {
        setError("Not authenticated");
        return false;
      }

      const held = pos[sym] || 0;
      if (qty > held) {
        setError("Insufficient position");
        return false;
      }

      try {
        // Remove from portfolio
        const { error: sellError } = await sellStock(authUser.uid, sym, qty, price);
        if (sellError) throw sellError;

        // Update cash
        const proceeds = qty * price;
        setCash((prev) => prev + proceeds);

        // Cash will be persisted in the backend
        setError(null);
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [authUser, pos]
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
