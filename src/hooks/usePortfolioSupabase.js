import { useState, useEffect, useCallback } from "react";
import { supabase, getCurrentUser } from "../api/supabase";
import { PORTFOLIO } from "../utils/constants";

/**
 * usePortfolioSupabase - Manage user portfolio with Supabase persistence
 * Handles cash, positions, and trade history from Supabase database
 */
export function usePortfolioSupabase() {
  const [user, setUser] = useState(null);
  const [cash, setCash] = useState(PORTFOLIO.STARTING_CASH);
  const [pos, setPos] = useState({});
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user session and portfolio on mount
  useEffect(() => {
    async function loadUserPortfolio() {
      try {
        const { user, error: userError } = await getCurrentUser();
        if (userError) throw userError;
        
        if (!user) {
          setLoading(false);
          return;
        }

        setUser(user);

        // Load user profile (cash)
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") throw profileError;

        if (profile) {
          setCash(profile.current_cash || PORTFOLIO.STARTING_CASH);
        } else {
          // Create first-time user profile
          await supabase.from("user_profiles").insert({
            id: user.id,
            email: user.email,
            current_cash: PORTFOLIO.STARTING_CASH,
          });
          setCash(PORTFOLIO.STARTING_CASH);
        }

        // Load portfolio positions
        const { data: positions, error: posError } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id);

        if (posError) throw posError;

        const posMap = {};
        positions?.forEach((p) => {
          if (p.quantity > 0) posMap[p.symbol] = p.quantity;
        });
        setPos(posMap);

        // Load trade history
        const { data: trades, error: tradesError } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("executed_at", { ascending: false })
          .limit(PORTFOLIO.LOG_ENTRIES);

        if (tradesError) throw tradesError;

        const formattedLog = trades?.map((t) => ({
          type: t.type,
          sym: t.symbol,
          qty: t.quantity,
          price: t.price,
          at: new Date(t.executed_at).toLocaleString(),
        })) || [];

        setLog(formattedLog);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    loadUserPortfolio();
  }, []);

  // Subscribe to real-time portfolio updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .from("portfolios")
      .on("*", (payload) => {
        if (payload.new.user_id === user.id) {
          setPos((prev) => {
            const updated = { ...prev };
            if (payload.new.quantity > 0) {
              updated[payload.new.symbol] = payload.new.quantity;
            } else {
              delete updated[payload.new.symbol];
            }
            return updated;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [user]);

  const buy = useCallback(
    async (sym, qty, price) => {
      if (!user) return;
      try {
        const totalCost = qty * price;
        if (totalCost > cash) throw new Error("Insufficient cash");

        // Update cash
        const newCash = cash - totalCost;
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ current_cash: newCash })
          .eq("id", user.id);

        if (profileError) throw profileError;
        setCash(newCash);

        // Get or create position
        const { data: existing } = await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user.id)
          .eq("symbol", sym)
          .single();

        if (existing) {
          const newQty = existing.quantity + qty;
          const newAvgCost =
            (existing.avg_cost * existing.quantity + price * qty) / newQty;
          await supabase
            .from("portfolios")
            .update({ quantity: newQty, avg_cost: newAvgCost })
            .eq("id", existing.id);
        } else {
          await supabase.from("portfolios").insert({
            user_id: user.id,
            symbol: sym,
            quantity: qty,
            avg_cost: price,
          });
        }

        // Log trade
        const { error: logError } = await supabase.from("trades").insert({
          user_id: user.id,
          symbol: sym,
          type: "BUY",
          quantity: qty,
          price,
          total_value: totalCost,
        });

        if (logError) throw logError;

        // Update local state
        setPos((prev) => ({
          ...prev,
          [sym]: (prev[sym] || 0) + qty,
        }));

        setLog((prev) => [
          {
            type: "BUY",
            sym,
            qty,
            price,
            at: new Date().toLocaleString(),
          },
          ...prev.slice(0, PORTFOLIO.LOG_ENTRIES - 1),
        ]);
      } catch (err) {
        setError(err.message);
      }
    },
    [user, cash]
  );

  const sell = useCallback(
    async (sym, qty, price) => {
      if (!user) return;
      try {
        const currentQty = pos[sym] || 0;
        if (qty > currentQty) throw new Error("Not enough shares to sell");

        const totalValue = qty * price;

        // Update cash
        const newCash = cash + totalValue;
        const { error: profileError } = await supabase
          .from("user_profiles")
          .update({ current_cash: newCash })
          .eq("id", user.id);

        if (profileError) throw profileError;
        setCash(newCash);

        // Update position
        const newQty = currentQty - qty;
        if (newQty > 0) {
          const { data: existing } = await supabase
            .from("portfolios")
            .select("*")
            .eq("user_id", user.id)
            .eq("symbol", sym)
            .single();

          await supabase
            .from("portfolios")
            .update({ quantity: newQty })
            .eq("id", existing.id);
        }

        // Log trade
        const { error: logError } = await supabase.from("trades").insert({
          user_id: user.id,
          symbol: sym,
          type: "SELL",
          quantity: qty,
          price,
          total_value: totalValue,
        });

        if (logError) throw logError;

        // Update local state
        setPos((prev) => {
          const updated = { ...prev };
          updated[sym] = newQty;
          if (updated[sym] <= 0) delete updated[sym];
          return updated;
        });

        setLog((prev) => [
          {
            type: "SELL",
            sym,
            qty,
            price,
            at: new Date().toLocaleString(),
          },
          ...prev.slice(0, PORTFOLIO.LOG_ENTRIES - 1),
        ]);
      } catch (err) {
        setError(err.message);
      }
    },
    [user, pos, cash]
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
    isHydrated: !!user,
  };
}
