import { auth } from "./firebase";
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
  const user = auth.currentUser;
  return { user, error: null };
}

/**
 * Subscribe to auth state changes. Callback receives `user` or null.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const unsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
    callback(user);
  });
  return unsubscribe;
}
