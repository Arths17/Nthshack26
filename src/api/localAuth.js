/**
 * Browser-only local auth for development when Firebase is not configured.
 * Credentials are stored in localStorage (plain passwords — dev only, never for production secrets).
 */

const STORAGE_USERS = "quanta:dev:userAccounts";
const STORAGE_CURRENT = "quanta:dev:authUser";
const SESSION_KEY = "quanta:session";

const listeners = new Set();

function notify(user) {
  listeners.forEach(fn => {
    try {
      fn(user);
    } catch {
      /* ignore */
    }
  });
}

export function readLocalUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT);
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.uid && u?.email) return u;
    }
    const sess = localStorage.getItem(SESSION_KEY);
    if (sess) {
      const j = JSON.parse(sess);
      if (j?.id && j?.email) {
        return {
          uid: j.id,
          email: j.email,
          displayName: j.name || j.email.split("@")[0],
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function persistCurrentUser(user) {
  if (user) localStorage.setItem(STORAGE_CURRENT, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_CURRENT);
  notify(readLocalUser());
}

export async function localSignUp(email, password, metadata = {}) {
  const lower = email.trim().toLowerCase();
  const users = loadUsers();
  if (users.some(u => u.email === lower)) {
    return { data: null, error: new Error("Email already registered") };
  }
  const uid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? `local_${crypto.randomUUID()}`
      : `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  const displayName = metadata.display_name || email.split("@")[0];
  users.push({ email: lower, password, name: displayName, uid });
  saveUsers(users);
  const user = { uid, email: lower, displayName };
  persistCurrentUser(user);
  return { data: { user }, error: null };
}

export async function localSignIn(email, password) {
  const lower = email.trim().toLowerCase();
  const users = loadUsers();
  const row = users.find(u => u.email === lower);
  if (!row || row.password !== password) {
    return { data: null, error: new Error("Invalid email or password") };
  }
  const user = { uid: row.uid, email: row.email, displayName: row.name };
  persistCurrentUser(user);
  return { data: { user }, error: null };
}

export async function localSignOut() {
  localStorage.removeItem(STORAGE_CURRENT);
  localStorage.removeItem(SESSION_KEY);
  notify(null);
  return { error: null };
}

export function onLocalAuthStateChange(callback) {
  queueMicrotask(() => callback(readLocalUser()));
  listeners.add(callback);
  return () => listeners.delete(callback);
}
