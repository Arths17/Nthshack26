import { auth, isFirebaseConfigured } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
} from "firebase/auth";

/**
 * Sign up new user (returns { data, error })
 */
export async function signUp(email, password, metadata = {}) {
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[FirebaseAuth][signUp] Aborted:', err.message);
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
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[FirebaseAuth][signIn] Aborted:', err.message);
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
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[FirebaseAuth][signOut] Aborted:', err.message);
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
  if (!isFirebaseConfigured) return { user: null, error: new Error('Firebase not configured') };
  const user = auth.currentUser;
  return { user, error: null };
}

/**
 * Subscribe to auth state changes. Callback receives `user` or null.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!isFirebaseConfigured) {
    console.warn('[FirebaseAuth] onAuthStateChange: Firebase not configured — returning no-op unsubscribe');
    // call callback with null once so consumers can update UI
    try { callback(null); } catch (e) {}
    return () => {};
  }

  const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
    callback(user);
  });
  return unsubscribe;
}
