import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { fetchProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/recherche`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/livraison`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/a-propos`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/retours`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/cgv`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${base}/cookies`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    const { products } = await fetchProducts();
    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${base}/produit/${p.id}`,
      lastModified: p.dateCreation,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
