import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return (
    new Intl.NumberFormat("fr-BJ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " FCFA"
  );
}

export function getDiscountPercent(prix: number, prixPromo: number | null | undefined): number | null {
  if (!prixPromo || prixPromo >= prix) return null;
  return Math.round(((prix - prixPromo) / prix) * 100);
}

export function getEffectivePrice(prix: number, prixPromo: number | null | undefined): number {
  return prixPromo && prixPromo < prix ? prixPromo : prix;
}
