import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
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
import {
  CATEGORIE_LABELS,
  GENRE_LABELS,
  isProductAvailable,
} from "@/lib/constants";
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
  // title seul → layout applique le template « %s | Coin229 »
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
      title: `${product.nom} | ${SITE.name}`,
      description,
      images: product.images[0]
        ? [{ url: product.images[0], alt: product.nom }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.nom} | ${SITE.name}`,
      description,
      images: product.images[0] ? [product.images[0]] : undefined,
    },
  };
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border/80 py-3"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 stroke-[1.5] text-muted transition group-open:rotate-180" />
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const { product } = await fetchProductById(id);
  if (!product) notFound();

  const discount = getDiscountPercent(product.prix, product.prixPromo);
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const hasPromo =
    product.prixPromo != null && product.prixPromo < product.prix;
  const savings = hasPromo ? product.prix - product.prixPromo! : 0;
  const inStock = isProductAvailable(product.statut, product.stockQuantite);
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
              path: `/boutique?categorie=${product.categorie}`,
            },
            { name: product.nom, path: `/produit/${product.id}` },
          ]),
        ]}
      />

      <div className="md:grid md:grid-cols-2 md:gap-10 lg:gap-14">
        <div className="relative">
          <Link
            href="/boutique"
            className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white/90 text-navy shadow-sm backdrop-blur-md md:left-0 md:top-0"
            aria-label="Retour à la boutique"
          >
            <ArrowLeft className="h-5 w-5 stroke-[1.5]" />
          </Link>
          <div className="absolute right-3 top-3 z-10 md:right-0 md:top-0">
            <WishlistButton productId={product.id} />
          </div>
          <div className="md:overflow-hidden md:rounded-[12px]">
            <ProductGallery images={product.images} alt={product.nom} />
          </div>
        </div>

        <div className="space-y-5 px-4 pt-5 md:px-0 md:pt-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-amber">
              <Link
                href={`/boutique?categorie=${product.categorie}`}
                className="hover:underline"
              >
                {CATEGORIE_LABELS[product.categorie]}
              </Link>
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-navy md:text-4xl">
              {product.nom}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-2xl font-semibold text-navy md:text-3xl">
                {formatPrice(price)}
              </span>
              {hasPromo && (
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.prix)}
                </span>
              )}
              {discount != null && (
                <span className="badge badge-sale">-{discount}%</span>
              )}
            </div>

            {hasPromo && savings > 0 && (
              <p className="mt-1 text-sm font-medium text-green">
                Vous économisez {formatPrice(savings)}
              </p>
            )}

            <p className="mt-1 text-xs text-muted">
              Prix TTC en FCFA · {SITE.currency}
            </p>

            <p
              className={`mt-3 text-sm font-medium ${
                inStock ? "text-green" : "text-coral"
              }`}
            >
              {inStock
                ? product.stockQuantite <= 5
                  ? `Disponible · ${product.stockQuantite} en stock`
                  : "Disponible"
                : product.statut !== "actif"
                  ? "Indisponible"
                  : "Rupture de stock"}
            </p>
          </div>

          {inStock && (
            <div className="md:max-w-md">
              <ProductPurchaseBar product={product} />
            </div>
          )}

          <div className="border-t border-border pt-1">
            <AccordionItem title="Description" defaultOpen>
              <p className="whitespace-pre-line">{product.description}</p>
            </AccordionItem>

            <AccordionItem title="Détails">
              <dl className="space-y-2">
                <div className="flex justify-between gap-4">
                  <dt>Catégorie</dt>
                  <dd className="font-medium text-navy">
                    <Link
                      href={`/boutique?categorie=${product.categorie}`}
                      className="hover:underline"
                    >
                      {CATEGORIE_LABELS[product.categorie]}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Genre</dt>
                  <dd className="font-medium text-navy">
                    {GENRE_LABELS[product.genre]}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Stock</dt>
                  <dd className="font-medium text-navy">
                    {product.statut === "actif"
                      ? product.stockQuantite > 0
                        ? `${product.stockQuantite} disponible${product.stockQuantite > 1 ? "s" : ""}`
                        : "Épuisé"
                      : "Indisponible"}
                  </dd>
                </div>
              </dl>
            </AccordionItem>

            <AccordionItem title="Livraison">
              <p>
                Zones {SITE.zones.join(", ")}. Frais et délais selon votre zone.{" "}
                <Link href="/livraison" className="font-medium text-amber">
                  Voir la livraison
                </Link>
              </p>
            </AccordionItem>

            <AccordionItem title="Retours">
              <p>
                Conditions d&apos;échange et de retour détaillées sur notre page
                dédiée.{" "}
                <Link href="/retours" className="font-medium text-amber">
                  Voir les retours
                </Link>
              </p>
            </AccordionItem>

            <AccordionItem title="Paiement">
              <ul className="list-disc space-y-1 pl-4">
                <li>Paiement à la livraison (espèces)</li>
                <li>Mobile Money (MTN MoMo ou Moov Money)</li>
              </ul>
            </AccordionItem>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10 space-y-4 px-4 md:mt-14 md:px-0">
          <h2 className="font-display text-lg font-semibold text-navy md:text-2xl">
            Vous pourriez aussi aimer
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
