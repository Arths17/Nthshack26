import { useState, useEffect, useCallback } from "react";
import { supabase } from "../api/supabase";

/**
 * useAlertsSupabase - Manage price and portfolio alerts with Supabase
 */
export function useAlertsSupabase(user) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load alerts on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadAlerts() {
      try {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true);

        if (error) throw error;
        setAlerts(data || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load alerts:", err);
        setLoading(false);
      }
    }

    loadAlerts();
  }, [user]);

  // Subscribe to real-time alert updates
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .from("alerts")
      .on("*", (payload) => {
        if (payload.new.user_id === user.id) {
          if (payload.eventType === "DELETE") {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          } else {
            setAlerts((prev) => {
              const exists = prev.find((a) => a.id === payload.new.id);
              if (exists) {
                return prev.map((a) => (a.id === payload.new.id ? payload.new : a));
              }
              return [...prev, payload.new];
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [user]);

  const createAlert = useCallback(
    async (symbol, alertType, threshold) => {
      if (!user) return;
      try {
        const { data, error } = await supabase.from("alerts").insert({
          user_id: user.id,
          symbol,
          alert_type: alertType,
          threshold,
          is_active: true,
        });

        if (error) throw error;
        return { data, error: null };
      } catch (err) {
        return { data: null, error: err.message };
      }
    },
    [user]
  );

  const deleteAlert = useCallback(
    async (alertId) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from("alerts")
          .delete()
          .eq("id", alertId)
          .eq("user_id", user.id);

        if (error) throw error;
        return { error: null };
      } catch (err) {
        return { error: err.message };
      }
    },
    [user]
  );

  const toggleAlert = useCallback(
    async (alertId, isActive) => {
      if (!user) return;
      try {
        const { error } = await supabase
          .from("alerts")
          .update({ is_active: isActive })
          .eq("id", alertId)
          .eq("user_id", user.id);

        if (error) throw error;
        return { error: null };
      } catch (err) {
        return { error: err.message };
      }
    },
    [user]
  );

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    toggleAlert,
  };
}
