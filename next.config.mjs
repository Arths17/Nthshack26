/** @type {import('next').NextConfig} */
const backendProxy =
  (process.env.BACKEND_PROXY_URL && process.env.BACKEND_PROXY_URL.trim().replace(/\/$/, "")) ||
  "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async rewrites() {
    // On Vercel, `vercel.json` sends /api to Python; do not proxy to localhost.
    if (process.env.VERCEL) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendProxy}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
