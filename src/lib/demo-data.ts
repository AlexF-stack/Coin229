import type { Categorie, Genre, Product } from "@prisma/client";

/** Identifiant vendeur plateforme (fallback hors DB). */
export const DEMO_VENDOR_ID = "vendor_coin229_local";

/**
 * Plus de catalogue fictif Unsplash.
 * En local sans DB, la boutique reste vide plutôt que d’afficher de faux produits.
 */
export const DEMO_PRODUCTS: Product[] = [];

export function filterDemoProducts(filters?: {
  categorie?: Categorie;
  genre?: Genre;
  niche?: string;
  q?: string;
}) {
  const query = filters?.q?.trim().toLowerCase();
  return DEMO_PRODUCTS.filter((p) => {
    if (filters?.categorie && p.categorie !== filters.categorie) return false;
    if (filters?.niche && p.niche.toLowerCase() !== filters.niche.toLowerCase())
      return false;
    if (filters?.genre && p.genre !== filters.genre) return false;
    if (query) {
      const hay =
        `${p.nom} ${p.description} ${p.categorie} ${p.niche}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return p.statut === "actif" || p.statut === "rupture";
  });
}
