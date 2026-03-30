import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { devLog, devWarn } from '../utils/logger';

// Support both Next.js `NEXT_PUBLIC_` and Vite-style `VITE_` env names so deployment
// environments using either naming convention will work until they migrate.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || null,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || null,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || null,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || null,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || null,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || null,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID || null,
};

let app = null;
let auth = null;
let db = null;

if (typeof window !== 'undefined') {
  // Runtime safety checks for missing/invalid public env vars
  const missing = [];
  if (!firebaseConfig.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY or VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN or VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or VITE_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID or VITE_FIREBASE_APP_ID');
  if (missing.length > 0) {
    const msg = `Missing required Firebase env variables (NEXT_PUBLIC_ or VITE_): ${missing.join(', ')}.\n` +
      `Set them in Vercel Project → Settings → Environment Variables and redeploy.`;
    console.error('[Firebase][Config] ' + msg);
    console.error('[Firebase][Config] apiKey present:', Boolean(firebaseConfig.apiKey));
    // Do not throw here — allow the app to render so debug pages and other UI can load.
    // Initialization will be skipped until env vars are present at build/runtime.
  } else {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (e) {
      console.error('[Firebase] Initialization failed:', e);
      app = null;
      auth = null;
      db = null;
    }
  }
}

export const isFirebaseConfigured = Boolean(app && auth && db);

export { auth, db };

/**
 * Sign up new user with Firebase Auth
 */
export async function signUp(email, password, displayName) {
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[Firebase][signUp] Aborted:', err.message);
    return { user: null, error: err };
  }

  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Create user profile document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      displayName,
      startingCash: 100000,
      currentCash: 100000,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Sign in with Firebase Auth
 */
export async function signIn(email, password) {
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[Firebase][signIn] Aborted:', err.message);
    return { user: null, error: err };
  }

  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}

/**
 * Sign out
 */
export async function signOut() {
  if (!isFirebaseConfigured) {
    const err = new Error('Firebase not configured');
    console.error('[Firebase][signOut] Aborted:', err.message);
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
 * Get current user (async)
 */
export function getCurrentUser() {
  if (!isFirebaseConfigured) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChangeListener(callback) {
  if (!isFirebaseConfigured) {
    devWarn('[Firebase] onAuthStateChangeListener: Firebase not configured — returning no-op unsubscribe');
    // Return a no-op unsubscribe function to match the onSnapshot/onAuth API
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId) {
  try {
    devLog('[Firebase] Getting user profile for:', userId);
    if (!isFirebaseConfigured) {
      const err = new Error('Firebase not configured');
      console.error('[Firebase][getUserProfile] Aborted:', err.message);
      return { data: null, error: err };
    }

    const docSnap = await getDoc(doc(db, 'users', userId));
    devLog('[Firebase] User profile retrieved');
    return { data: docSnap.data(), error: null };
  } catch (error) {
    console.error('[Firebase] Error getting user profile:', error.message);
    return { data: null, error };
  }
}

/**
 * Get user portfolio (holdings)
 */
export function subscribeToPortfolio(userId, callback) {
  devLog('[Firebase] Subscribing to portfolio for:', userId);
  if (!isFirebaseConfigured) {
    devWarn('[Firebase] subscribeToPortfolio skipped: Firebase not configured');
    return () => {};
  }

  const q = query(collection(db, 'portfolios'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      devLog('[Firebase] Portfolio snapshot received, docs:', snapshot.docs.length);
      const holdings = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        holdings[data.symbol] = data.quantity;
      });
      callback(holdings);
    },
    (error) => {
      console.error('[Firebase] Portfolio subscription error:', error.message);
    }
  );
}

/**
 * Buy stock (add to portfolio)
 */
export async function buyStock(userId, symbol, quantity, price, newCash) {
  try {
    devLog('[Firebase] Starting buy:', { userId, symbol, quantity, price });
    if (!isFirebaseConfigured) {
      const err = new Error('Firebase not configured');
      console.error('[Firebase][buyStock] Aborted:', err.message);
      return { error: err };
    }

    const portfolioRef = doc(db, 'portfolios', `${userId}_${symbol}`);
    let docSnap;
    
    try {
      docSnap = await getDoc(portfolioRef);
      devLog('[Firebase] Portfolio doc retrieved');
    } catch (err) {
      console.error('[Firebase] Error reading portfolio doc:', err.message);
      throw new Error(`Failed to read portfolio: ${err.message}`);
    }
    
    let newQuantity = quantity;
    let newAvgCost = price;

    if (docSnap.exists()) {
      const data = docSnap.data();
      const totalCost = data.quantity * data.avgCost + quantity * price;
      newQuantity = data.quantity + quantity;
      newAvgCost = totalCost / newQuantity;
    }

    try {
      await setDoc(portfolioRef, {
        userId,
        symbol,
        quantity: newQuantity,
        avgCost: newAvgCost,
        updatedAt: serverTimestamp(),
      });
      devLog('[Firebase] Portfolio doc written');
    } catch (err) {
      console.error('[Firebase] Error writing portfolio doc:', err.message);
      throw new Error(`Failed to update portfolio: ${err.message}`);
    }

    // Log trade
    try {
      await addDoc(collection(db, 'trades'), {
        userId,
        symbol,
        type: 'BUY',
        quantity,
        price,
        totalValue: quantity * price,
        executedAt: serverTimestamp(),
      });
      devLog('[Firebase] Trade logged');
    } catch (err) {
      console.error('[Firebase] Error logging trade:', err.message);
      throw new Error(`Failed to log trade: ${err.message}`);
    }

    // Update user's cash
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentCash: newCash,
        updatedAt: serverTimestamp(),
      });
      devLog('[Firebase] User cash updated');
    } catch (err) {
      console.error('[Firebase] Error updating user cash:', err.message);
      throw new Error(`Failed to update cash: ${err.message}`);
    }

    devLog('[Firebase] Buy completed successfully');
    return { error: null };
  } catch (error) {
    console.error('[Firebase] Buy failed:', error.message);
    return { error };
  }
}

/**
 * Sell stock (reduce from portfolio)
 */
export async function sellStock(userId, symbol, quantity, price, newCash) {
  try {
    devLog('[Firebase] Starting sell:', { userId, symbol, quantity, price });
    if (!isFirebaseConfigured) {
      const err = new Error('Firebase not configured');
      console.error('[Firebase][sellStock] Aborted:', err.message);
      return { error: err };
    }

    const portfolioRef = doc(db, 'portfolios', `${userId}_${symbol}`);
    let docSnap;
    
    try {
      docSnap = await getDoc(portfolioRef);
      devLog('[Firebase] Portfolio doc retrieved');
    } catch (err) {
      console.error('[Firebase] Error reading portfolio doc:', err.message);
      throw new Error(`Failed to read portfolio: ${err.message}`);
    }

    if (!docSnap.exists()) {
      return { error: new Error('Position does not exist') };
    }

    const data = docSnap.data();
    const newQuantity = data.quantity - quantity;

    try {
      if (newQuantity <= 0) {
        await deleteDoc(portfolioRef);
        devLog('[Firebase] Position deleted');
      } else {
        await updateDoc(portfolioRef, {
          quantity: newQuantity,
          updatedAt: serverTimestamp(),
        });
        devLog('[Firebase] Position updated');
      }
    } catch (err) {
      console.error('[Firebase] Error updating portfolio doc:', err.message);
      throw new Error(`Failed to update portfolio: ${err.message}`);
    }

    // Log trade
    try {
      await addDoc(collection(db, 'trades'), {
        userId,
        symbol,
        type: 'SELL',
        quantity,
        price,
        totalValue: quantity * price,
        executedAt: serverTimestamp(),
      });
      devLog('[Firebase] Trade logged');
    } catch (err) {
      console.error('[Firebase] Error logging trade:', err.message);
      throw new Error(`Failed to log trade: ${err.message}`);
    }

    // Update user's cash
    try {
      await updateDoc(doc(db, 'users', userId), {
        currentCash: newCash,
        updatedAt: serverTimestamp(),
      });
      devLog('[Firebase] User cash updated');
    } catch (err) {
      console.error('[Firebase] Error updating user cash:', err.message);
      throw new Error(`Failed to update cash: ${err.message}`);
    }

    devLog('[Firebase] Sell completed successfully');
    return { error: null };
  } catch (error) {
    console.error('[Firebase] Sell failed:', error.message);
    return { error };
  }
}

/**
 * Get user trades
 */
export function subscribeToTrades(userId, callback) {
  if (!isFirebaseConfigured) {
    devWarn('[Firebase] subscribeToTrades skipped: Firebase not configured');
    return () => {};
  }

  const q = query(collection(db, 'trades'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const trades = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(trades);
  });
}

/**
 * Create alert
 */
export async function createAlert(userId, symbol, alertType, threshold) {
  try {
    if (!isFirebaseConfigured) {
      const err = new Error('Firebase not configured');
      console.error('[Firebase][createAlert] Aborted:', err.message);
      return { id: null, error: err };
    }

    const docRef = await addDoc(collection(db, 'alerts'), {
      userId,
      symbol,
      alertType,
      threshold,
      isActive: true,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
}

/**
 * Get user alerts
 */
export function subscribeToAlerts(userId, callback) {
  if (!isFirebaseConfigured) {
    devWarn('[Firebase] subscribeToAlerts skipped: Firebase not configured');
    return () => {};
  }

  const q = query(collection(db, 'alerts'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(alerts);
  });
}

/**
 * Delete alert
 */
export async function deleteAlert(alertId) {
  try {
    if (!isFirebaseConfigured) {
      const err = new Error('Firebase not configured');
      console.error('[Firebase][deleteAlert] Aborted:', err.message);
      return { error: err };
    }

    await deleteDoc(doc(db, 'alerts', alertId));
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Toggle alert active status
 */
export async function toggleAlert(alertId, isActive) {
  try {
    await updateDoc(doc(db, 'alerts', alertId), { isActive });
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Update user's cash balance
 */
export async function updateUserCash(userId, newCash) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      currentCash: newCash,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
}
