import { prisma } from "@/lib/prisma";
import { DEMO_PRODUCTS, filterDemoProducts } from "@/lib/demo-data";
import { allowDemoCatalog } from "@/lib/runtime-flags";
import type { Categorie, Genre } from "@prisma/client";

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
}) {
  const query = filters?.q?.trim();
  try {
    const products = await prisma.product.findMany({
      where: {
        statut: { in: ["actif", "rupture"] },
        ...(filters?.categorie ? { categorie: filters.categorie } : {}),
        ...(filters?.genre ? { genre: filters.genre } : {}),
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
    });
    if (products.length > 0) {
      return { products: sortForCatalog(products), source: "db" as const };
    }
  } catch {
    // DB indisponible
  }

  if (allowDemoCatalog()) {
    return {
      products: sortForCatalog(filterDemoProducts(filters)),
      source: "demo" as const,
    };
  }

  return { products: [], source: "db" as const };
}

export async function fetchProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });
    if (product) return { product, source: "db" as const };
  } catch {
    // fallthrough
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
    const products = await prisma.product.findMany({
      where: {
        id: { not: productId },
        categorie,
        statut: "actif",
        stockQuantite: { gt: 0 },
      },
      take: 4,
      orderBy: { dateCreation: "desc" },
    });
    if (products.length > 0) return products;
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
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
    });
    if (products.length > 0) return products;
  } catch {
    // fallthrough
  }
  if (!allowDemoCatalog()) return [];
  return DEMO_PRODUCTS.filter((p) => ids.includes(p.id));
}
