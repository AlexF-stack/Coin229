import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchaseBar } from "@/components/product/product-purchase-bar";
import { ProductCard } from "@/components/product/product-card";
import { WishlistButton } from "@/components/product/wishlist-button";
import {
  JsonLd,
  breadcrumbJsonLd,
  productJsonLd,
} from "@/components/seo/json-ld";
import { fetchProductById, fetchSimilar } from "@/lib/catalog";
import { CATEGORIE_LABELS, GENRE_LABELS } from "@/lib/constants";
import { SITE } from "@/lib/site";
import {
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
} from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { product } = await fetchProductById(id);
  if (!product) {
    return { title: "Produit introuvable", robots: { index: false } };
  }
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const title = product.nom;
  const description = `${product.description.slice(0, 140)} Prix ${formatPrice(price)}. Livraison ${SITE.zones.join(", ")}.`;
  const url = `${SITE.url}/produit/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: `${product.nom} · ${SITE.name}`,
      description,
      images: product.images[0]
        ? [{ url: product.images[0], alt: product.nom }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.nom} · ${SITE.name}`,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

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
      <JsonLd
        data={[
          productJsonLd(product),
          breadcrumbJsonLd([
            { name: "Accueil", path: "/" },
            {
              name: CATEGORIE_LABELS[product.categorie],
              path: `/?categorie=${product.categorie}`,
            },
            { name: product.nom, path: `/produit/${product.id}` },
          ]),
        ]}
      />

      <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
        <div className="relative">
          <Link
            href="/"
            className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white/90 text-navy shadow-sm backdrop-blur-md md:left-0 md:top-0"
            aria-label="Retour à la boutique"
          >
            <ArrowLeft className="h-5 w-5 stroke-[1.5]" />
          </Link>
          <div className="absolute right-3 top-3 z-10 md:right-0 md:top-0">
            <WishlistButton productId={product.id} />
          </div>
          <div className="md:overflow-hidden md:rounded-sm">
            <ProductGallery images={product.images} alt={product.nom} />
          </div>
        </div>

        <div className="space-y-5 px-4 pt-5 md:px-0 md:pt-2">
          <div className="flex flex-wrap gap-2">
            <span className="border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted">
              {CATEGORIE_LABELS[product.categorie]}
            </span>
            <span className="border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted">
              {GENRE_LABELS[product.genre]}
            </span>
            {inStock ? (
              <span className="bg-green/15 px-3 py-1 text-xs text-green">
                En stock
              </span>
            ) : null}
            {discount && (
              <span className="bg-coral px-3 py-1 text-xs font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold leading-tight text-navy md:text-4xl">
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
            <p className="mt-1 text-xs text-muted">
              Prix TTC en FCFA · {SITE.currency}
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                inStock ? "text-green" : "text-coral"
              }`}
            >
              {inStock
                ? "Disponible · livraison zones Coin229"
                : "Rupture de stock"}
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

          <div className="border-t border-border pt-4 text-sm text-muted">
            <p className="font-medium text-navy">Livraison & retours</p>
            <p className="mt-1">
              Cotonou souvent le jour même · Porto-Novo / Godomey sous 48 h.{" "}
              <Link href="/livraison" className="font-medium text-amber">
                Frais
              </Link>
              {" · "}
              <Link href="/retours" className="font-medium text-amber">
                Retours 48 h
              </Link>
            </p>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10 space-y-4 px-4 md:mt-14 md:px-0">
          <h2 className="font-display text-lg font-semibold text-navy md:text-2xl">
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
