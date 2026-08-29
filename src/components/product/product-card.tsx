import Link from "next/link";
import Image from "next/image";
import type { ProductCardData } from "@/lib/constants";
import { CATEGORIE_LABELS } from "@/lib/constants";
import {
  cn,
  formatPrice,
  getDiscountPercent,
  getEffectivePrice,
} from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";

type Props = {
  product: ProductCardData;
  className?: string;
};

function isNewProduct(dateCreation: Date | string | undefined) {
  if (!dateCreation) return false;
  const t =
    dateCreation instanceof Date
      ? dateCreation.getTime()
      : new Date(dateCreation).getTime();
  if (!Number.isFinite(t)) return false;
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - t < fourteenDays;
}

export function ProductCard({ product, className }: Props) {
  const discount = getDiscountPercent(product.prix, product.prixPromo);
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const outOfStock =
    product.statut === "rupture" || product.stockQuantite <= 0;
  const image = product.images[0] ?? "/placeholder-product.svg";
  const isNew = !discount && isNewProduct(product.dateCreation);

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-[12px] bg-white",
        className
      )}
    >
      <Link
        href={`/produit/${product.id}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-[12px] bg-cream"
      >
        <Image
          src={image}
          alt={product.nom}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 280px"
          className={cn(
            "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]",
            outOfStock && "opacity-50 grayscale"
          )}
        />
        <WishlistButton
          productId={product.id}
          className="absolute right-2.5 top-2.5 z-10"
        />
        {discount != null && (
          <span className="badge-sale absolute left-2.5 top-2.5">
            -{discount}%
          </span>
        )}
        {isNew && (
          <span className="badge-new absolute left-2.5 top-2.5">Nouveau</span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-0 bottom-0 bg-navy/85 py-1.5 text-center text-xs font-medium text-white">
            Épuisé
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          {CATEGORIE_LABELS[product.categorie]}
        </p>
        <Link href={`/produit/${product.id}`}>
          <h3 className="line-clamp-2 font-display text-sm font-semibold leading-snug text-fg transition-colors group-hover:text-navy md:text-[15px]">
            {product.nom}
          </h3>
        </Link>

        <div className="mt-auto space-y-3 pt-1">
          <div>
            <p className="font-semibold text-fg">{formatPrice(price)}</p>
            {product.prixPromo != null && product.prixPromo < product.prix && (
              <p className="text-xs text-muted line-through">
                {formatPrice(product.prix)}
              </p>
            )}
          </div>

          {!outOfStock && (
            <div className="opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              <AddToCartButton
                product={product}
                className="btn btn-primary w-full !rounded-[10px] !py-2.5 text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
