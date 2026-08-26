import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://coin229.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/recherche`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/livraison`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/a-propos`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
