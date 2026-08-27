import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeHero } from "@/components/catalog/home-hero";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ProductGrid } from "@/components/catalog/product-grid";
import { HowItWorks } from "@/components/trust/how-it-works";
import { Reveal } from "@/components/motion/reveal";
import { fetchProducts } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";
import type { Categorie, Genre } from "@prisma/client";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
});

type SearchParams = Promise<{
  categorie?: string;
  genre?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categorie = params.categorie as Categorie | undefined;
  const genre = params.genre as Genre | undefined;

  const { products } = await fetchProducts({
    categorie:
      categorie && CATEGORIES.includes(categorie) ? categorie : undefined,
    genre:
      genre && ["homme", "femme", "unisexe"].includes(genre)
        ? genre
        : undefined,
  });

  return (
    <div className="space-y-10 pb-4 md:space-y-14">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <HomeHero />
      </div>

      <HowItWorks />

      <div id="catalogue" className="scroll-mt-24 space-y-5">
        <Reveal>
          <div className="px-4 md:px-0">
            <h2 className="font-display text-2xl font-bold tracking-tight text-navy md:text-3xl">
              La sélection
            </h2>
            <p className="mt-1 text-sm text-muted">
              Montres, bijoux, sacs & lunettes
            </p>
          </div>
        </Reveal>

        <Suspense fallback={<div className="h-20" />}>
          <CatalogFilters />
        </Suspense>

        <ProductGrid products={products} />

        {!products.length && (
          <p className="px-4 py-8 text-center text-sm text-muted md:px-0">
            Aucun produit pour ces filtres.
          </p>
        )}
      </div>
    </div>
  );
}
