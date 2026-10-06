"use client";

import { AlertCircle, X } from "lucide-react";
import type { CartChange } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";

function describe(change: CartChange): string {
  switch (change.type) {
    case "removed":
      return `« ${change.nom} » n’est plus disponible et a été retiré du panier.`;
    case "price":
      return change.to < change.from
        ? `Bonne nouvelle : « ${change.nom} » passe de ${formatPrice(change.from)} à ${formatPrice(change.to)}.`
        : `Le prix de « ${change.nom} » a changé : ${formatPrice(change.from)} → ${formatPrice(change.to)}.`;
    case "quantity":
      return `Stock limité : la quantité de « ${change.nom} » a été ramenée à ${change.to}.`;
  }
}

/** Informe le client de ce qui a changé dans son panier depuis l'ajout */
export function CartChangesNotice({
  changes,
  onDismiss,
}: {
  changes: CartChange[];
  onDismiss: () => void;
}) {
  if (!changes.length) return null;
  return (
    <div
      role="status"
      className="relative flex gap-3 rounded-[12px] border border-amber/40 bg-amber/10 px-4 py-3 pr-10 text-sm text-fg"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-amber" />
      <div className="space-y-1">
        <p className="font-semibold">Ton panier a été mis à jour</p>
        <ul className="space-y-0.5 text-muted">
          {changes.map((c, i) => (
            <li key={i}>{describe(c)}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer"
        className="absolute right-2 top-2 rounded-full p-1.5 text-muted hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
