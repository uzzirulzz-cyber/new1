import type { NextConfig } from "next";

/** All platform URLs — every one is a real, directly linkable & indexable path. */
export const APP_PATHS = [
  "/dashboard",
  "/markets",
  "/trade/spot",
  "/trade/futures",
  "/trade/options",
  "/copy-trading",
  "/staking",
  "/launchpad",
  "/wallet",
  "/deposit",
  "/withdraw",
  "/transactions",
  "/portfolio",
  "/kyc",
  "/affiliate",
  "/support",
  "/settings",
  "/login",
  "/signup",
  "/admin",
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /**
   * URL indexing fix: legacy e-commerce URLs (/storefront, /store, /shop)
   * 301-redirect to the trading terminal (/markets) — no more 404s and
   * search equity flows to the institutional product.
   */
  async redirects() {
    return [
      { source: "/storefront", destination: "/markets", permanent: true },
      { source: "/store", destination: "/markets", permanent: true },
      { source: "/shop", destination: "/markets", permanent: true },
      { source: "/products", destination: "/markets", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  /**
   * Serve the exchange SPA for every platform path so /admin, /signup,
   * /trade/spot … resolve directly as clean URLs (no hash fragments).
   */
  async rewrites() {
    return APP_PATHS.map((source) => ({ source, destination: "/" }));
  },
};

export default nextConfig;
