import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChangeListener } from "../api/firebase";

const AuthContext = createContext();

/**
 * AuthProvider - Provides authentication state to entire app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthContext] Initializing auth listener");
    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChangeListener((authUser) => {
      console.log("[AuthContext] Auth state changed:", authUser?.email || "NOT LOGGED IN");
      setUser(authUser || null);
      setLoading(false);
    });

    return () => {
      console.log("[AuthContext] Cleaning up auth listener");
      unsubscribe();
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
