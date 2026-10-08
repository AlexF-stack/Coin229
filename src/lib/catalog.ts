import { prisma } from "@/lib/prisma";
import { DEMO_PRODUCTS, filterDemoProducts } from "@/lib/demo-data";
import { allowDemoCatalog } from "@/lib/runtime-flags";
import { maybeReleaseExpiredReservations } from "@/lib/order-expiry";
import {
  CATEGORIES,
  CATEGORIE_SORT_ORDER,
  NICHES_BY_CATEGORIE,
} from "@/lib/constants";
import type { Categorie, Genre } from "@prisma/client";

/** Évite que Prisma bloque indéfiniment les pages dynamiques si la DB est down. */
const DB_QUERY_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, ms = DB_QUERY_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`DB query timeout after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function nicheSortKey(niche: string | null | undefined): number {
  const key = (niche ?? "").trim().toLowerCase();
  const priority = [
    "montre luxe",
    "montre",
    "bijou",
    "sandale luxe",
    "sandale",
  ];
  const idx = priority.indexOf(key);
  return idx === -1 ? 50 : idx;
}

export function sortForCatalog<
  T extends {
    statut: string;
    stockQuantite: number;
    prixPromo: number | null;
    prix: number;
    dateCreation: Date;
    categorie?: Categorie;
    niche?: string;
    nom?: string;
  },
>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const aOk = a.statut === "actif" && a.stockQuantite > 0 ? 0 : 1;
    const bOk = b.statut === "actif" && b.stockQuantite > 0 ? 0 : 1;
    if (aOk !== bOk) return aOk - bOk;

    const aCat = a.categorie
      ? (CATEGORIE_SORT_ORDER[a.categorie] ?? 99)
      : 99;
    const bCat = b.categorie
      ? (CATEGORIE_SORT_ORDER[b.categorie] ?? 99)
      : 99;
    if (aCat !== bCat) return aCat - bCat;

    const aNiche = nicheSortKey(a.niche);
    const bNiche = nicheSortKey(b.niche);
    if (aNiche !== bNiche) return aNiche - bNiche;

    const byName = (a.nom ?? "").localeCompare(b.nom ?? "", "fr", {
      sensitivity: "base",
    });
    if (byName !== 0) return byName;

    return b.dateCreation.getTime() - a.dateCreation.getTime();
  });
}

export async function fetchProducts(filters?: {
  categorie?: Categorie;
  genre?: Genre;
  niche?: string;
  q?: string;
  /** en_stock = actifs avec stock > 0 */
  enStock?: boolean;
  sort?: "pertinence" | "nouveautes" | "prix_asc" | "prix_desc";
}) {
  // Stock des réservations expirées remis en vente (au plus 1×/min)
  await maybeReleaseExpiredReservations();
  const query = filters?.q?.trim();
  const niche = filters?.niche?.trim();
  const sort = filters?.sort ?? "pertinence";

  try {
    const products = await withTimeout(
      prisma.product.findMany({
        where: {
          statut: { in: ["actif", "rupture"] },
          vendor: { statut: "actif" },
          ...(filters?.categorie ? { categorie: filters.categorie } : {}),
          ...(filters?.genre ? { genre: filters.genre } : {}),
          ...(niche
            ? { niche: { equals: niche, mode: "insensitive" } }
            : {}),
          ...(filters?.enStock
            ? { statut: "actif", stockQuantite: { gt: 0 } }
            : {}),
          ...(query
            ? {
                OR: [
                  { nom: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
                  { niche: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { dateCreation: "desc" },
      })
    );
    // DB joignable : même 0 résultat = vrai empty (ne pas masquer avec le démo)
    return {
      products: applyCatalogSort(products, sort),
      source: "db" as const,
    };
  } catch {
    // DB indisponible / timeout → démo uniquement en local
  }

  if (allowDemoCatalog()) {
    let products = filterDemoProducts(filters);
    if (filters?.enStock) {
      products = products.filter(
        (p) => p.statut === "actif" && p.stockQuantite > 0
      );
    }
    return {
      products: applyCatalogSort(products, sort),
      source: "demo" as const,
    };
  }

  // Base injoignable en production : ne pas faire passer ça pour « aucun résultat »
  return { products: [], source: "unavailable" as const };
}

export function applyCatalogSort<
  T extends {
    statut: string;
    stockQuantite: number;
    prixPromo: number | null;
    prix: number;
    dateCreation: Date;
    categorie?: Categorie;
    niche?: string;
    nom?: string;
  },
>(
  products: T[],
  sort: "pertinence" | "nouveautes" | "prix_asc" | "prix_desc" = "pertinence"
): T[] {
  if (sort === "nouveautes") {
    return [...products].sort(
      (a, b) => b.dateCreation.getTime() - a.dateCreation.getTime()
    );
  }
  if (sort === "prix_asc" || sort === "prix_desc") {
    const dir = sort === "prix_asc" ? 1 : -1;
    return [...products].sort((a, b) => {
      const pa = a.prixPromo && a.prixPromo < a.prix ? a.prixPromo : a.prix;
      const pb = b.prixPromo && b.prixPromo < b.prix ? b.prixPromo : b.prix;
      return (pa - pb) * dir;
    });
  }
  return sortForCatalog(products);
}

/** Seuls champs vendeur publics — la fiche produit est rendue côté client */
const PUBLIC_VENDOR_SELECT = {
  id: true,
  nomBoutique: true,
  slug: true,
  description: true,
  logoUrl: true,
  statut: true,
} as const;

export async function fetchProductById(id: string) {
  await maybeReleaseExpiredReservations();
  try {
    const product = await withTimeout(
      prisma.product.findUnique({
        where: { id },
        include: { vendor: { select: PUBLIC_VENDOR_SELECT } },
      })
    );
    if (product && product.vendor.statut !== "actif") {
      return { product: null, source: "db" as const };
    }
    // DB joignable : null = produit vraiment absent
    return { product, source: "db" as const };
  } catch {
    // DB indisponible / timeout
  }

  if (!allowDemoCatalog()) {
    return { product: null, source: "unavailable" as const };
  }

  const demo = DEMO_PRODUCTS.find((p) => p.id === id);
  if (!demo) return { product: null, source: "demo" as const };
  return {
    product: {
      ...demo,
      vendor: {
        id: demo.vendorId,
        nomBoutique: "Coin229 Boutique",
        slug: "coin229",
        description: null,
        logoUrl: null,
        statut: "actif" as const,
      },
    },
    source: "demo" as const,
  };
}

export async function fetchActiveNiches(
  limit = 24,
  categorie?: Categorie
): Promise<string[]> {
  try {
    const rows = await withTimeout(
      prisma.product.findMany({
        where: {
          statut: { in: ["actif", "rupture"] },
          vendor: { statut: "actif" },
          niche: { not: "" },
          ...(categorie ? { categorie } : {}),
        },
        select: { niche: true },
      })
    );
    const seen = new Set<string>();
    for (const r of rows) {
      const n = r.niche.trim();
      if (n) seen.add(n);
    }

    const preferred = categorie
      ? NICHES_BY_CATEGORIE[categorie] ?? []
      : Object.values(NICHES_BY_CATEGORIE).flat();

    const ordered: string[] = [];
    for (const n of preferred) {
      const match = [...seen].find((s) => s.toLowerCase() === n.toLowerCase());
      if (match) ordered.push(match);
    }
    for (const n of [...seen].sort((a, b) => a.localeCompare(b, "fr"))) {
      if (!ordered.some((o) => o.toLowerCase() === n.toLowerCase())) {
        ordered.push(n);
      }
    }
    return ordered.slice(0, limit);
  } catch {
    // Fallback statique pour ne jamais laisser le filtre niches vide en prod
    if (categorie) return NICHES_BY_CATEGORIE[categorie] ?? [];
    return Object.values(NICHES_BY_CATEGORIE).flat();
  }
}

/**
 * Catégories qui ont au moins un produit visible (dans l'ordre de CATEGORIES) :
 * les filtres et l'accueil ne proposent pas de rayon vide.
 */
export async function fetchActiveCategories(): Promise<Categorie[]> {
  try {
    const rows = await withTimeout(
      prisma.product.groupBy({
        by: ["categorie"],
        where: { statut: { in: ["actif", "rupture"] }, vendor: { statut: "actif" } },
      })
    );
    const present = new Set(rows.map((r) => r.categorie));
    return CATEGORIES.filter((c) => present.has(c));
  } catch {
    if (allowDemoCatalog()) {
      const present = new Set(DEMO_PRODUCTS.map((p) => p.categorie));
      return CATEGORIES.filter((c) => present.has(c));
    }
    return CATEGORIES;
  }
}

export async function fetchSimilar(productId: string, categorie: Categorie) {
  try {
    return await withTimeout(
      prisma.product.findMany({
        where: {
          id: { not: productId },
          categorie,
          statut: "actif",
          stockQuantite: { gt: 0 },
          vendor: { statut: "actif" },
        },
        take: 4,
        orderBy: { dateCreation: "desc" },
      })
    );
  } catch {
    // fallthrough
  }
  if (!allowDemoCatalog()) return [];
  return DEMO_PRODUCTS.filter(
    (p) =>
      p.id !== productId && p.categorie === categorie && p.statut === "actif"
  ).slice(0, 4);
}

export async function fetchProductsByIds(ids: string[]) {
  if (!ids.length) return [];
  try {
    return await withTimeout(
      prisma.product.findMany({
        // Mêmes règles que le catalogue : jamais un produit retiré ni d'un vendeur suspendu
        where: {
          id: { in: ids },
          statut: { in: ["actif", "rupture"] },
          vendor: { statut: "actif" },
        },
      })
    );
  } catch {
    // fallthrough
  }
  if (!allowDemoCatalog()) return [];
  return DEMO_PRODUCTS.filter((p) => ids.includes(p.id) && p.statut !== "archive");
}
