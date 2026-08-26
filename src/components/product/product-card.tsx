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
  const isBijou = product.categorie === "bijou";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[16px] bg-card shadow-card transition-colors hover:bg-card-hover",
        className
      )}
    >
      <Link
        href={`/produit/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden"
      >
        <Image
          src={image}
          alt={product.nom}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            outOfStock && "opacity-50 grayscale"
          )}
        />
        <WishlistButton
          productId={product.id}
          className="absolute right-2 top-2 z-10"
        />
        {discount && (
          <span className="absolute left-2 top-2 rounded-[20px] bg-coral px-2.5 py-0.5 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {isBijou && !discount && (
          <span className="absolute left-2 top-2 rounded-[20px] bg-violet/90 px-2.5 py-0.5 text-xs font-medium text-white">
            Premium
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-bg/80 py-1.5 text-center text-xs font-medium text-muted">
            Rupture de stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3 md:p-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            {CATEGORIE_LABELS[product.categorie]}
          </p>
          <Link href={`/produit/${product.id}`}>
            <h3 className="truncate font-display text-sm font-semibold leading-snug text-fg md:text-base">
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
          {!outOfStock && <AddToCartButton product={product} compact />}
        </div>
      </div>
    </article>
  );
}
