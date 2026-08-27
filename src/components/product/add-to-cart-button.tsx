"use client";

import { Plus, Check } from "lucide-react";
import { useState } from "react";
import type { ProductCardData } from "@/lib/constants";
import { useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Props = {
  product: ProductCardData;
  quantity?: number;
  compact?: boolean;
  className?: string;
};

export function AddToCartButton({
  product,
  quantity = 1,
  compact = false,
  className,
}: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Ajouter au panier"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-amber text-white shadow-sm transition-transform active:scale-90",
          added && "animate-[pop_0.4s_ease-out]",
          className
        )}
      >
        {added ? (
          <Check className="h-4 w-4 stroke-[2]" />
        ) : (
          <Plus className="h-4 w-4 stroke-[2]" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-full bg-amber py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(43,155,255,0.25)] transition-all active:scale-[0.98]",
        added && "bg-green shadow-none animate-[pop_0.35s_ease-out]",
        className
      )}
    >
      {added ? (
        <>
          <Check className="h-5 w-5 stroke-[1.5]" />
          Ajouté
        </>
      ) : (
        <>
          <Plus className="h-5 w-5 stroke-[1.5]" />
          Ajouter au panier
        </>
      )}
    </button>
  );
}
