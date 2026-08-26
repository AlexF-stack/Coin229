import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchaseBar } from "@/components/product/product-purchase-bar";
import { ProductCard } from "@/components/product/product-card";
import { WishlistButton } from "@/components/product/wishlist-button";
import { fetchProductById, fetchSimilar } from "@/lib/catalog";
import { CATEGORIE_LABELS, GENRE_LABELS } from "@/lib/constants";
import {
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
} from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { product } = await fetchProductById(id);
  if (!product) notFound();

  const discount = getDiscountPercent(product.prix, product.prixPromo);
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const inStock = product.statut === "actif" && product.stockQuantite > 0;
  const similar = await fetchSimilar(product.id, product.categorie);

  return (
    <div className="pb-8 md:pb-12 md:pt-6">
      <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
        <div className="relative">
          <Link
            href="/"
            className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-bg/70 text-fg backdrop-blur-md md:left-0 md:top-0 md:bg-card md:shadow-card"
            aria-label="Retour"
          >
            <ArrowLeft className="h-5 w-5 stroke-[1.5]" />
          </Link>
          <div className="absolute right-3 top-3 z-10 md:right-0 md:top-0">
            <WishlistButton productId={product.id} />
          </div>
          <div className="md:overflow-hidden md:rounded-[20px] md:shadow-card">
            <ProductGallery images={product.images} alt={product.nom} />
          </div>
        </div>

        <div className="space-y-5 px-4 pt-5 md:px-0 md:pt-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-[20px] bg-card px-3 py-1 text-xs text-muted shadow-card md:border md:border-border">
              {CATEGORIE_LABELS[product.categorie]}
            </span>
            <span className="rounded-[20px] bg-card px-3 py-1 text-xs text-muted shadow-card md:border md:border-border">
              {GENRE_LABELS[product.genre]}
            </span>
            {inStock ? (
              <span className="rounded-[20px] bg-green/15 px-3 py-1 text-xs text-green">
                En stock
              </span>
            ) : null}
            {discount && (
              <span className="rounded-[20px] bg-coral px-3 py-1 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold leading-tight md:text-4xl">
              {product.nom}
            </h1>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-amber md:text-3xl">
                {formatPrice(price)}
              </span>
              {product.prixPromo && product.prixPromo < product.prix && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.prix)}
                </span>
              )}
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                inStock ? "text-green" : "text-coral"
              }`}
            >
              {inStock ? "Disponible · livraison rapide" : "Rupture de stock"}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted md:text-base">
            {product.description}
          </p>

          {inStock && (
            <div className="md:max-w-md">
              <ProductPurchaseBar product={product} />
            </div>
          )}

          <div className="rounded-[16px] border border-border bg-card p-4 text-sm text-muted shadow-card">
            <p className="font-medium text-fg">Livraison</p>
            <p className="mt-1">
              Cotonou souvent le jour même · Porto-Novo / Godomey sous 48h.{" "}
              <Link href="/livraison" className="font-medium text-amber">
                Voir les frais
              </Link>
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10 space-y-4 px-4 md:mt-14 md:px-0">
          <h2 className="font-display text-lg font-semibold md:text-2xl">
            Similaires
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
