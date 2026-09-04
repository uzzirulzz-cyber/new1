import type { NextConfig } from "next";

/** All BLOCKEXCHANGE URLs — real, directly linkable paths (rewritten to the app shell). */
export const APP_PATHS = [
  "/markets", "/watchlist", "/trade", "/assets", "/deposit", "/withdraw",
  "/wallet", "/history", "/profile", "/notifications", "/settings", "/support",
  "/login", "/signup", "/staff/login", "/admin", "/agent",
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/storefront", destination: "/markets", permanent: true },
      { source: "/store", destination: "/markets", permanent: true },
      { source: "/shop", destination: "/markets", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
      // legacy hash links from v1
      { source: "/dashboard", destination: "/assets", permanent: true },
      { source: "/trade/spot", destination: "/trade", permanent: true },
      { source: "/trade/futures", destination: "/trade", permanent: true },
      { source: "/trade/options", destination: "/trade", permanent: true },
      { source: "/copy-trading", destination: "/markets", permanent: true },
      { source: "/staking", destination: "/assets", permanent: true },
      { source: "/launchpad", destination: "/markets", permanent: true },
      { source: "/kyc", destination: "/profile", permanent: true },
      { source: "/affiliate", destination: "/support", permanent: true },
      { source: "/transactions", destination: "/wallet", permanent: true },
      { source: "/portfolio", destination: "/assets", permanent: true },
    ];
  },
  async rewrites() {
    return APP_PATHS.map((source) => ({ source, destination: "/" }));
  },
};

export default nextConfig;
