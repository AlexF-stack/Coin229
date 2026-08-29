"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { useWishlistStore } from "@/lib/wishlist-store";
import { getWishlistProducts } from "@/lib/actions";
import type { ProductCardData } from "@/lib/constants";

export default function FavorisPage() {
  const ids = useWishlistStore((s) => s.ids);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    setLoading(true);
    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }
    getWishlistProducts(ids)
      .then((rows) => {
        if (!cancelled) setProducts(rows);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ids, mounted]);

  if (!mounted || loading) {
    return (
      <div className="space-y-4 px-4 py-6 md:px-0">
        <div className="h-8 w-40 animate-pulse rounded bg-cream" />
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[4/5] animate-pulse rounded-[12px] bg-cream" />
          <div className="aspect-[4/5] animate-pulse rounded-[12px] bg-cream" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-5 md:py-8">
      <header className="px-4 md:px-0">
        <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">
          Favoris
        </h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} pièce{products.length !== 1 ? "s" : ""}{" "}
          sauvegardée{products.length !== 1 ? "s" : ""}
        </p>
      </header>

      {!products.length ? (
        <div className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center md:px-0">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream text-navy">
            <Heart className="h-7 w-7 stroke-[1.25]" />
          </span>
          <p className="mt-5 font-display text-2xl font-semibold text-navy">
            Votre sélection est vide.
          </p>
          <Link href="/boutique" className="btn btn-primary mt-6">
            Explorer les accessoires
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
