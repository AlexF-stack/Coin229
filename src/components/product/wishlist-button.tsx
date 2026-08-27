"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Props = {
  productId: string;
  className?: string;
};

export function WishlistButton({ productId, className }: Props) {
  const toggle = useWishlistStore((s) => s.toggle);
  const ids = useWishlistStore((s) => s.ids);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(ids.includes(productId));
  }, [ids, productId]);

  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white/90 text-navy shadow-sm backdrop-blur-md transition active:scale-95",
        active && "border-rose/30 text-rose",
        className
      )}
    >
      <Heart
        className={cn("h-4 w-4 stroke-[1.5]", active && "fill-rose")}
      />
    </button>
  );
}
