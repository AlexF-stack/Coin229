"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCardData } from "@/lib/constants";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { useCartStore } from "@/lib/cart-store";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

type Props = {
  product: ProductCardData;
};

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "22990000000";

/** CTA qui convertissent : panier + achat immédiat + WhatsApp */
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

  const waHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Bonjour Coin229 👋\nJe veux : ${product.nom}\nPrix : ${formatPrice(price)}\nQuantité : ${qty}`
  )}`;

  return (
    <>
      <div className="space-y-3 max-md:pb-28">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Quantité</span>
          <QuantitySelector value={qty} max={max} onChange={setQty} />
        </div>
        <div className="hidden md:block">
          <AddToCartButton product={product} quantity={qty} />
        </div>
        <button
          type="button"
          onClick={buyNow}
          className="hidden w-full items-center justify-center rounded-full border border-amber bg-amber/10 py-3.5 font-semibold text-amber transition active:scale-[0.98] md:flex"
        >
          Acheter maintenant · {formatPrice(price * qty)}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-3 text-sm font-medium text-navy"
        >
          <MessageCircle className="h-4 w-4 stroke-[1.5] text-[#25D366]" />
          Commander sur WhatsApp
        </a>
      </div>

      <div className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-4 pt-3 shadow-[0_-8px_30px_rgba(2,11,38,0.08)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg gap-2 pb-2">
          <AddToCartButton product={product} quantity={qty} className="flex-1" />
          <button
            type="button"
            onClick={buyNow}
            className="flex-1 rounded-full bg-navy py-3.5 text-sm font-semibold text-white"
          >
            Acheter
          </button>
        </div>
      </div>
    </>
  );
}
