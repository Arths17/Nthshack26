/** @type {import('next').NextConfig} */
const backendProxy =
  (process.env.BACKEND_PROXY_URL && process.env.BACKEND_PROXY_URL.trim().replace(/\/$/, "")) ||
  "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /**
   * FastAPI lives under `/api/py/*` so Next.js on Vercel does not intercept `/api/*`.
   * Production (and `next start`): rewrite to the Python serverless entry at `/api/`.
   * Development: proxy straight to local uvicorn.
   * @see https://github.com/digitros/nextjs-fastapi
   */
  async rewrites() {
    const isDev = process.env.NODE_ENV === "development";
    return [
      {
        source: "/api/py/:path*",
        destination: isDev ? `${backendProxy}/api/py/:path*` : "/api/",
      },
    ];
  },
};

export default nextConfig;
