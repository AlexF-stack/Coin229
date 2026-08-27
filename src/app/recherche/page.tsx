import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { SearchBoxFromParams } from "@/components/catalog/search-box";
import { fetchProducts } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/seo";

type SearchParams = Promise<{ q?: string }>;

export const metadata: Metadata = buildPageMetadata({
  title: "Recherche",
  description:
    "Recherche montres, bijoux, sacs et lunettes Coin229 — accessoires mode au Bénin, prix en FCFA.",
  path: "/recherche",
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { products } = query
    ? await fetchProducts({ q: query })
    : { products: [] };

  return (
    <div className="space-y-5 px-0 py-5 md:space-y-6 md:py-8">
      <header className="px-4 md:px-0">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Recherche</h1>
        <p className="mt-1 text-sm text-muted">
          Trouve ta prochaine pièce parmi montres, bijoux, sacs et lunettes.
        </p>
      </header>

      <Suspense fallback={null}>
        <SearchBoxFromParams />
      </Suspense>

      {query && (
        <p className="px-4 text-sm text-muted md:px-0">
          {products.length} résultat(s) pour « {query} »
        </p>
      )}

      {!query && (
        <p className="px-4 text-sm text-muted md:px-0">
          Tape un mot-clé pour lancer la recherche.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-3 md:px-0 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </div>
  );
}
