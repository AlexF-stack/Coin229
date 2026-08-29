"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCardData } from "@/lib/constants";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice, getEffectivePrice } from "@/lib/utils";

type Props = {
  product: ProductCardData;
};

/** CTA qui convertissent : panier + achat immédiat */
export function ProductPurchaseBar({ product }: Props) {
  const [qty, setQty] = useState(1);
  const max = Math.max(1, product.stockQuantite);
  const addItem = useCartStore((s) => s.addItem);
  const prepareCheckout = useCartStore((s) => s.prepareCheckout);
  const router = useRouter();
  const price = getEffectivePrice(product.prix, product.prixPromo);

  function buyNow() {
    addItem(
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
    prepareCheckout([product.id]);
    router.push("/commande");
  }

  return (
    <>
      <div className="space-y-3 max-md:pb-28">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Quantité</span>
          <QuantitySelector value={qty} max={max} onChange={setQty} />
        </div>
        <div className="hidden md:block">
          <AddToCartButton product={product} quantity={qty} variant="secondary" />
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
        <div className="mx-auto flex max-w-lg gap-2 pb-2">
          <AddToCartButton
            product={product}
            quantity={qty}
            variant="secondary"
            className="flex-1"
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
