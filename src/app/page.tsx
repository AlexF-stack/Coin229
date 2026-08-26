import { Suspense } from "react";
import { PromoBanner } from "@/components/catalog/promo-banner";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { ProductCard } from "@/components/product/product-card";
import { HowItWorks } from "@/components/trust/how-it-works";
import { fetchProducts } from "@/lib/catalog";
import type { Categorie, Genre } from "@prisma/client";

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
      categorie && ["montre", "bijou", "sac"].includes(categorie)
        ? categorie
        : undefined,
    genre:
      genre && ["homme", "femme", "unisexe"].includes(genre)
        ? genre
        : undefined,
  });

  return (
    <div className="space-y-6 pb-4 pt-4 md:space-y-10 md:pt-8">
      <header className="px-4 md:hidden">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
          Mode · Bénin
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Coin229
        </h1>
        <p className="mt-1 text-sm text-muted">
          Montres, bijoux & sacs
        </p>
      </header>

      <header className="hidden px-0 md:block">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber">
          Nouvelle sélection
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight lg:text-4xl">
          Accessoires qui claquent
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Pièces pour hommes et femmes — livrées à Cotonou, Porto-Novo et
          Godomey.
        </p>
      </header>

      <div className="md:px-0">
        <PromoBanner />
      </div>

      <HowItWorks />

      <Suspense fallback={<div className="h-20" />}>
        <CatalogFilters />
      </Suspense>

      <section className="grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-3 md:px-0 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      {!products.length && (
        <p className="px-4 py-8 text-center text-sm text-muted md:px-0">
          Aucun produit pour ces filtres.
        </p>
      )}
    </div>
  );
}
