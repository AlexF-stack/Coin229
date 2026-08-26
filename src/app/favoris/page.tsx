"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { useWishlistStore } from "@/lib/wishlist-store";
import type { ProductCardData } from "@/lib/constants";
import { DEMO_PRODUCTS } from "@/lib/demo-data";

export default function FavorisPage() {
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Catalogue démo + éventuels IDs persistés
    setProducts(DEMO_PRODUCTS.filter((p) => ids.includes(p.id)));
  }, [ids, mounted]);

  if (!mounted) {
    return (
      <div className="space-y-4 px-4 py-6">
        <div className="h-8 w-40 animate-pulse rounded bg-card" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[4/5] animate-pulse rounded-[16px] bg-card" />
          <div className="aspect-[4/5] animate-pulse rounded-[16px] bg-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-5 md:py-8">
      <header className="px-4 md:px-0">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Favoris</h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} pièce(s) sauvegardée(s)
        </p>
      </header>

      {!products.length ? (
        <div className="mx-4 rounded-[16px] bg-card p-8 text-center shadow-card md:mx-0">
          <p className="font-medium">Aucun favori pour l&apos;instant</p>
          <p className="mt-1 text-sm text-muted">
            Tape le cœur sur une fiche produit pour la retrouver ici.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-[16px] bg-amber px-5 py-3 text-sm font-semibold text-bg"
          >
            Voir le catalogue
          </Link>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-3 px-4 sm:gap-4 md:grid-cols-3 md:px-0 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
