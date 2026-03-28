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
    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChangeListener((authUser) => {
      setUser(authUser || null);
      setLoading(false);
    });

    return () => unsubscribe();
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
