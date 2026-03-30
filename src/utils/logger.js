/**
 * Development-only logging. Avoids noisy console output in production builds.
 */
const isDev =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";

export function devLog(...args) {
  if (isDev) console.log(...args);
}

export function devWarn(...args) {
  if (isDev) console.warn(...args);
}

export function devInfo(...args) {
  if (isDev) console.info(...args);
}
