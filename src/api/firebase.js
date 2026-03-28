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

const firebaseConfig = {
  apiKey: "AIzaSyBcLIctNBdUzWg0BFNkxr0oLPK2xB_nMco",
  authDomain: "quant-82fa3.firebaseapp.com",
  projectId: "quant-82fa3",
  storageBucket: "quant-82fa3.firebasestorage.app",
  messagingSenderId: "865884350665",
  appId: "1:865884350665:web:7581cbb2fdb884d12a4518",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Sign up new user with Firebase Auth
 */
export async function signUp(email, password, displayName) {
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
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId) {
  try {
    console.log('[Firebase] Getting user profile for:', userId);
    const docSnap = await getDoc(doc(db, 'users', userId));
    console.log('[Firebase] User profile retrieved');
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
  console.log('[Firebase] Subscribing to portfolio for:', userId);
  const q = query(collection(db, 'portfolios'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      console.log('[Firebase] Portfolio snapshot received, docs:', snapshot.docs.length);
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
    console.log('[Firebase] Starting buy:', { userId, symbol, quantity, price });
    
    const portfolioRef = doc(db, 'portfolios', `${userId}_${symbol}`);
    let docSnap;
    
    try {
      docSnap = await getDoc(portfolioRef);
      console.log('[Firebase] Portfolio doc retrieved');
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
      console.log('[Firebase] Portfolio doc written');
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
      console.log('[Firebase] Trade logged');
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
      console.log('[Firebase] User cash updated');
    } catch (err) {
      console.error('[Firebase] Error updating user cash:', err.message);
      throw new Error(`Failed to update cash: ${err.message}`);
    }

    console.log('[Firebase] Buy completed successfully');
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
    console.log('[Firebase] Starting sell:', { userId, symbol, quantity, price });
    
    const portfolioRef = doc(db, 'portfolios', `${userId}_${symbol}`);
    let docSnap;
    
    try {
      docSnap = await getDoc(portfolioRef);
      console.log('[Firebase] Portfolio doc retrieved');
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
        console.log('[Firebase] Position deleted');
      } else {
        await updateDoc(portfolioRef, {
          quantity: newQuantity,
          updatedAt: serverTimestamp(),
        });
        console.log('[Firebase] Position updated');
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
      console.log('[Firebase] Trade logged');
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
      console.log('[Firebase] User cash updated');
    } catch (err) {
      console.error('[Firebase] Error updating user cash:', err.message);
      throw new Error(`Failed to update cash: ${err.message}`);
    }

    console.log('[Firebase] Sell completed successfully');
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
