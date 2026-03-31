/**
 * Backend origin for `/api/*` calls.
 * - If NEXT_PUBLIC_API_URL is set → use it (trimmed, no trailing slash).
 * - Else → "" (same-origin).
 *
 * Locally, `next.config.mjs` rewrites `/api/py/*` → FastAPI (default http://127.0.0.1:8000)
 * so the browser never cross-origin fetches — avoids "Failed to fetch" from CORS/mixed
 * host issues (IPv6, LAN hostname, port changes).
 * On Vercel, `vercel.json` routes `/api` to the Python serverless app.
 */
function isLoopbackHostname(h) {
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h === "[::1]"
  );
}

export function getApiBase() {
  const raw = typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL != null
    ? String(process.env.NEXT_PUBLIC_API_URL)
    : "";
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed) {
    // Old templates pointed the browser at http://localhost:8000 — that cross-origin fetch
    // often surfaces as "Failed to fetch". If both page and API host are loopback, use /api proxy.
    if (typeof window !== "undefined") {
      try {
        const apiHost = new URL(trimmed).hostname;
        if (isLoopbackHostname(apiHost) && isLoopbackHostname(window.location.hostname)) {
          return "";
        }
      } catch {
        /* ignore invalid URL */
      }
    }
    return trimmed;
  }
  return "";
}
