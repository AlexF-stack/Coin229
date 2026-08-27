import Link from "next/link";
import Image from "next/image";
import type { ProductCardData } from "@/lib/constants";
import { CATEGORIE_LABELS } from "@/lib/constants";
import { cn, formatPrice, getDiscountPercent, getEffectivePrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";

type Props = {
  product: ProductCardData;
  className?: string;
};

export function ProductCard({ product, className }: Props) {
  const discount = getDiscountPercent(product.prix, product.prixPromo);
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const outOfStock =
    product.statut === "rupture" || product.stockQuantite <= 0;
  const image = product.images[0] ?? "/placeholder-product.svg";

  return (
    <article
      className={cn(
        "group flex flex-col transition-transform duration-500 ease-out hover:-translate-y-1",
        className
      )}
    >
      <Link
        href={`/produit/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[0_0_0_0_rgba(43,155,255,0)] transition-[box-shadow,border-color] duration-500 group-hover:border-amber/35 group-hover:shadow-[0_16px_40px_rgba(2,11,38,0.1)]"
      >
        <Image
          src={image}
          alt={product.nom}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
          className={cn(
            "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]",
            outOfStock && "opacity-50 grayscale"
          )}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />
        <WishlistButton
          productId={product.id}
          className="absolute right-2 top-2 z-10 translate-y-0 opacity-100 transition duration-300 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        />
        {discount && (
          <span className="absolute left-2 top-2 rounded-md bg-coral px-2 py-0.5 text-xs font-semibold text-white transition-transform duration-300 group-hover:scale-105">
            -{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-navy/80 py-1.5 text-center text-xs font-medium text-white">
            Rupture de stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-amber">
            {CATEGORIE_LABELS[product.categorie]}
          </p>
          <Link href={`/produit/${product.id}`}>
            <h3 className="truncate font-display text-sm font-semibold leading-snug text-navy transition-colors group-hover:text-navy md:text-base">
              {product.nom}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="font-semibold text-amber">{formatPrice(price)}</p>
            {product.prixPromo && product.prixPromo < product.prix && (
              <p className="text-xs text-muted line-through">
                {formatPrice(product.prix)}
              </p>
            )}
          </div>
          {!outOfStock && (
            <div className="transition-transform duration-300 group-hover:scale-105">
              <AddToCartButton product={product} compact />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
