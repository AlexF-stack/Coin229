import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** tailwind-merge connaît les tokens du design system (rounded-control, shadow-card…) */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["badge", "control", "card", "panel", "pill"],
      shadow: ["card", "raised", "overlay"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const priceFormatter = new Intl.NumberFormat("fr-BJ", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** Espace fine insécable (U+202F) d'Intl : invisible avec certaines polices / téléphones */
const NARROW_NBSP = new RegExp(String.fromCharCode(0x202f), "g");
const NBSP = String.fromCharCode(0x00a0);

/** « 21 000 FCFA » — espaces insécables classiques, jamais coupé en fin de ligne */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount).replace(NARROW_NBSP, NBSP) + NBSP + "FCFA";
}

export function getDiscountPercent(prix: number, prixPromo: number | null | undefined): number | null {
  if (!prixPromo || prixPromo >= prix) return null;
  return Math.round(((prix - prixPromo) / prix) * 100);
}

export function getEffectivePrice(prix: number, prixPromo: number | null | undefined): number {
  return prixPromo && prixPromo < prix ? prixPromo : prix;
}
