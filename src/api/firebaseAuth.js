import { auth, isFirebaseConfigured } from "./firebase";
import { devInfo, devWarn } from "../utils/logger";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import * as localAuth from "./localAuth";

/**
 * When Firebase env vars are missing, use in-browser local auth in development
 * (or when NEXT_PUBLIC_AUTH_DEV_LOCAL=true). Not a replacement for production auth.
 */
function useLocalDevAuth() {
  if (typeof window === "undefined") return false;
  if (isFirebaseConfigured) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_AUTH_DEV_LOCAL === "true"
  );
}

/** True when sign-in uses browser local storage instead of Firebase (dev / explicit opt-in). */
export function isUsingLocalDevAuth() {
  return useLocalDevAuth();
}

/**
 * Sign up new user (returns { data, error })
 */
export async function signUp(email, password, metadata = {}) {
  if (useLocalDevAuth()) {
    if (process.env.NODE_ENV === "development") {
      devInfo("[Auth] Local dev sign-up (Firebase not configured)");
    }
    return localAuth.localSignUp(email, password, metadata);
  }

  if (!isFirebaseConfigured) {
    const err = new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local (see .env.example), or set NEXT_PUBLIC_AUTH_DEV_LOCAL=true for local-only auth."
    );
    console.error("[FirebaseAuth][signUp] Aborted:", err.message);
    return { data: null, error: err };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (metadata.display_name) {
      await updateProfile(userCredential.user, { displayName: metadata.display_name });
    }
    return { data: { user: userCredential.user }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Sign in existing user (returns { data, error })
 */
export async function signIn(email, password) {
  if (useLocalDevAuth()) {
    return localAuth.localSignIn(email, password);
  }

  if (!isFirebaseConfigured) {
    const err = new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local (see .env.example), or set NEXT_PUBLIC_AUTH_DEV_LOCAL=true for local-only auth."
    );
    console.error("[FirebaseAuth][signIn] Aborted:", err.message);
    return { data: null, error: err };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { data: { user: userCredential.user }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  if (useLocalDevAuth()) {
    return localAuth.localSignOut();
  }

  if (!isFirebaseConfigured) {
    const err = new Error("Firebase not configured");
    console.error("[FirebaseAuth][signOut] Aborted:", err.message);
    return { error: err };
  }

  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  if (useLocalDevAuth()) {
    return { user: localAuth.readLocalUser(), error: null };
  }

  if (!isFirebaseConfigured) return { user: null, error: new Error("Firebase not configured") };
  const user = auth.currentUser;
  return { user, error: null };
}

/**
 * Subscribe to auth state changes. Callback receives `user` or null.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (useLocalDevAuth()) {
    return localAuth.onLocalAuthStateChange(callback);
  }

  if (!isFirebaseConfigured) {
    devWarn("[FirebaseAuth] onAuthStateChange: Firebase not configured — returning no-op unsubscribe");
    try {
      callback(null);
    } catch {
      /* ignore */
    }
    return () => {};
  }

  const unsubscribe = firebaseOnAuthStateChanged(auth, user => {
    callback(user);
  });
  return unsubscribe;
}
