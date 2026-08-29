import { prisma } from "@/lib/prisma";
import { DEMO_PRODUCTS, filterDemoProducts } from "@/lib/demo-data";
import { allowDemoCatalog } from "@/lib/runtime-flags";
import type { Categorie, Genre } from "@prisma/client";

/** Évite que Prisma bloque indéfiniment les pages dynamiques si la DB est down. */
const DB_QUERY_TIMEOUT_MS = 4_000;

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

export function sortForCatalog<
  T extends {
    statut: string;
    stockQuantite: number;
    prixPromo: number | null;
    prix: number;
    dateCreation: Date;
  },
>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const aOk = a.statut === "actif" && a.stockQuantite > 0 ? 0 : 1;
    const bOk = b.statut === "actif" && b.stockQuantite > 0 ? 0 : 1;
    if (aOk !== bOk) return aOk - bOk;
    const aPromo = a.prixPromo && a.prixPromo < a.prix ? 0 : 1;
    const bPromo = b.prixPromo && b.prixPromo < b.prix ? 0 : 1;
    if (aPromo !== bPromo) return aPromo - bPromo;
    return b.dateCreation.getTime() - a.dateCreation.getTime();
  });
}

export async function fetchProducts(filters?: {
  categorie?: Categorie;
  genre?: Genre;
  q?: string;
  /** en_stock = actifs avec stock > 0 */
  enStock?: boolean;
  sort?: "pertinence" | "nouveautes" | "prix_asc" | "prix_desc";
}) {
  const query = filters?.q?.trim();
  const sort = filters?.sort ?? "pertinence";

  try {
    const products = await withTimeout(
      prisma.product.findMany({
        where: {
          statut: { in: ["actif", "rupture"] },
          ...(filters?.categorie ? { categorie: filters.categorie } : {}),
          ...(filters?.genre ? { genre: filters.genre } : {}),
          ...(filters?.enStock
            ? { statut: "actif", stockQuantite: { gt: 0 } }
            : {}),
          ...(query
            ? {
                OR: [
                  { nom: { contains: query, mode: "insensitive" } },
                  { description: { contains: query, mode: "insensitive" } },
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

  return { products: [], source: "db" as const };
}

export function applyCatalogSort<
  T extends {
    statut: string;
    stockQuantite: number;
    prixPromo: number | null;
    prix: number;
    dateCreation: Date;
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

export async function fetchProductById(id: string) {
  try {
    const product = await withTimeout(
      prisma.product.findUnique({
        where: { id },
        include: { vendor: true },
      })
    );
    // DB joignable : null = produit vraiment absent
    return { product, source: "db" as const };
  } catch {
    // DB indisponible / timeout
  }

  if (!allowDemoCatalog()) {
    return { product: null, source: "db" as const };
  }

  const demo = DEMO_PRODUCTS.find((p) => p.id === id);
  if (!demo) return { product: null, source: "demo" as const };
  return {
    product: {
      ...demo,
      vendor: {
        id: demo.vendorId,
        nomBoutique: "Coin229 Boutique",
        contact: "+22990000000",
        statut: "actif" as const,
        dateCreation: new Date(),
      },
    },
    source: "demo" as const,
  };
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
        where: { id: { in: ids } },
      })
    );
  } catch {
    // fallthrough
  }
  if (!allowDemoCatalog()) return [];
  return DEMO_PRODUCTS.filter((p) => ids.includes(p.id));
}
