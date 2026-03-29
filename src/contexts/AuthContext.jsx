import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChange, getCurrentUser } from "../api/firebaseAuth";

const AuthContext = createContext();

/**
 * AuthProvider - Provides authentication state to entire app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via Firebase
    getCurrentUser().then(({ user }) => {
      setUser(user || null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user || null);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth - Get current user and auth state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
