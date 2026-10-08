"use client";

import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCardData } from "@/lib/constants";
import { OTHER_VENDOR_MESSAGE, useCartStore } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";

type Props = {
  product: ProductCardData;
  quantity?: number;
  compact?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  /** Le parent affiche lui-même le refus (fiche produit) ; sinon une fenêtre s’ouvre */
  onBlocked?: (message: string) => void;
};

export function AddToCartButton({
  product,
  quantity = 1,
  compact = false,
  variant = "primary",
  className,
  onBlocked,
}: Props) {
  const router = useRouter();
  const [confirm, dialog] = useConfirm();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = addItem(
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
    if (result !== "added") {
      void showBlocked(result);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  async function showBlocked(result: "other_vendor" | "out_of_stock") {
    const message =
      result === "other_vendor" ? OTHER_VENDOR_MESSAGE : "Ce produit est en rupture de stock.";
    if (onBlocked) {
      onBlocked(message);
      return;
    }
    if (result === "out_of_stock") {
      await confirm({ title: "Rupture de stock", message, confirmLabel: "OK", cancelLabel: null });
      return;
    }
    const goToCart = await confirm({
      title: "Panier d’une autre boutique",
      message,
      confirmLabel: "Voir mon panier",
      cancelLabel: "Fermer",
    });
    if (goToCart) router.push("/panier");
  }

  if (compact) {
    return (
      <>
        {dialog}
        <button
          type="button"
          onClick={handleClick}
          aria-label="Ajouter au panier"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-control bg-primary text-white transition-transform active:scale-90",
            added && "bg-success animate-[pop_0.4s_ease-out]",
            className
          )}
        >
          {added ? (
            <Check className="h-4 w-4 stroke-[2]" />
          ) : (
            <Plus className="h-4 w-4 stroke-[2]" />
          )}
        </button>
      </>
    );
  }

  return (
    <>
      {dialog}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "btn w-full",
          variant === "secondary" ? "btn-secondary" : "btn-primary",
          added && "!bg-success !text-white shadow-none animate-[pop_0.35s_ease-out]",
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
    </>
  );
}
