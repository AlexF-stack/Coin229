import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/catalog/product-grid";
import { BoutiqueToolbar } from "@/components/catalog/boutique-toolbar";
import { fetchProducts } from "@/lib/catalog";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Categorie, Genre } from "@prisma/client";

type SearchParams = Promise<{
  q?: string;
  categorie?: string;
  genre?: string;
  sort?: string;
  enStock?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const cat = params.categorie as Categorie | undefined;
  if (cat && CATEGORIES.includes(cat)) {
    return buildPageMetadata({
      title: CATEGORIE_LABELS[cat],
      description: `${CATEGORIE_LABELS[cat]} Coin229 — accessoires mode au Bénin, prix en FCFA.`,
      path: `/boutique?categorie=${cat}`,
    });
  }
  return buildPageMetadata({
    title: "Boutique",
    description:
      "Tous les accessoires Coin229 : montres, bijoux, sacs et lunettes. Recherche, filtres et prix en FCFA.",
    path: "/boutique",
  });
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categorie =
    params.categorie && CATEGORIES.includes(params.categorie as Categorie)
      ? (params.categorie as Categorie)
      : undefined;
  const genre =
    params.genre && ["homme", "femme", "unisexe"].includes(params.genre)
      ? (params.genre as Genre)
      : undefined;
  const sortRaw = params.sort ?? "pertinence";
  const sort = (
    ["pertinence", "nouveautes", "prix_asc", "prix_desc"].includes(sortRaw)
      ? sortRaw
      : "pertinence"
  ) as "pertinence" | "nouveautes" | "prix_asc" | "prix_desc";
  const enStock = params.enStock === "1";

  const { products } = await fetchProducts({
    q: q || undefined,
    categorie,
    genre,
    sort,
    enStock: enStock || undefined,
  });

  const heading = categorie ? CATEGORIE_LABELS[categorie] : "Boutique";
  const sub = categorie
    ? "Sélection filtrée — affinez avec la recherche et le tri."
    : "Tous les accessoires, au même endroit.";

  return (
    <div className="space-y-6 py-5 md:space-y-8 md:py-8">
      {categorie ? (
        <div className="-mx-4 border-b border-border bg-navy md:-mx-6">
          <div className="px-4 py-8 md:px-6 md:py-10">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
              Collection
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
              {heading}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">{sub}</p>
            {q ? (
              <p className="mt-2 text-sm text-white/55">Recherche : « {q} »</p>
            ) : null}
          </div>
        </div>
      ) : (
        <header className="px-4 md:px-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-navy md:text-3xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted">{sub}</p>
          {q ? (
            <p className="mt-2 text-sm text-muted">Recherche : « {q} »</p>
          ) : null}
        </header>
      )}

      <Suspense fallback={<div className="h-24" />}>
        <BoutiqueToolbar resultCount={products.length} />
      </Suspense>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center">
          <p className="font-display text-xl font-semibold text-navy">
            Aucun accessoire trouvé.
          </p>
          <p className="mt-2 text-sm text-muted">
            Essayez un autre mot-clé ou explorez toute la boutique.
          </p>
          <Link href="/boutique" className="btn btn-primary mt-6">
            Voir tous les produits
          </Link>
        </div>
      )}
    </div>
  );
}
