"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { maxOrderQty, type ProductCardData } from "@/lib/constants";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { OTHER_VENDOR_MESSAGE, useCartStore } from "@/lib/cart-store";
import { formatPrice, getEffectivePrice } from "@/lib/utils";

type Props = {
  product: ProductCardData;
};

/** CTA qui convertissent : panier + achat immédiat */
export function ProductPurchaseBar({ product }: Props) {
  const [qty, setQty] = useState(1);
  const max = Math.max(1, maxOrderQty(product.stockQuantite));
  const buyNowInCart = useCartStore((s) => s.buyNow);
  const router = useRouter();
  const price = getEffectivePrice(product.prix, product.prixPromo);
  const [blocked, setBlocked] = useState<string | null>(null);

  function buyNow() {
    const result = buyNowInCart(
      {
        productId: product.id,
        nom: product.nom,
        image: product.images[0] ?? "",
        prix: product.prix,
        prixPromo: product.prixPromo,
        vendorId: product.vendorId,
        stockQuantite: product.stockQuantite,
      },
      qty
    );
    if (result === "other_vendor") {
      setBlocked(OTHER_VENDOR_MESSAGE);
      return;
    }
    if (result === "out_of_stock") {
      setBlocked("Ce produit est en rupture de stock.");
      return;
    }
    setBlocked(null);
    router.push("/commande");
  }

  const blockedNotice = blocked && (
    <p role="alert" className="rounded-[10px] bg-error/10 px-3 py-2 text-sm text-error">
      {blocked}{" "}
      <Link href="/panier" className="font-semibold underline">
        Voir mon panier
      </Link>
    </p>
  );

  return (
    <>
      <div className="space-y-3 max-md:pb-28">
        {blockedNotice}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Quantité</span>
          <QuantitySelector value={qty} max={max} onChange={setQty} />
        </div>
        <div className="hidden md:block">
          <AddToCartButton product={product} quantity={qty} variant="secondary" onBlocked={setBlocked} />
        </div>
        <button
          type="button"
          onClick={buyNow}
          className="btn btn-primary hidden w-full md:inline-flex"
        >
          Acheter maintenant · {formatPrice(price * qty)}
        </button>
      </div>

      <div className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(15,45,38,0.08)] backdrop-blur-md md:hidden">
        {blocked && <div className="mx-auto mb-2 max-w-lg">{blockedNotice}</div>}
        <div className="mx-auto flex max-w-lg gap-2 pb-2">
          <AddToCartButton
            product={product}
            quantity={qty}
            variant="secondary"
            className="flex-1"
            onBlocked={setBlocked}
          />
          <button
            type="button"
            onClick={buyNow}
            className="btn btn-primary flex-1"
          >
            Acheter
          </button>
        </div>
      </div>
    </>
  );
}
