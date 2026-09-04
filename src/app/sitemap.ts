import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://blockexchange.io";

/** All indexable platform URLs — mirrors next.config.ts rewrites. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/markets`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/trade/spot`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/trade/futures`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/trade/options`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/copy-trading`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/staking`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/launchpad`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/affiliate`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/support`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/kyc`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/deposit`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/withdraw`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/transactions`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/wallet`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
