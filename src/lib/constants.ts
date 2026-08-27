import type { Categorie, Genre, Product, ProductStatus } from "@prisma/client";

export type ProductCardData = Pick<
  Product,
  | "id"
  | "nom"
  | "prix"
  | "prixPromo"
  | "images"
  | "categorie"
  | "genre"
  | "stockQuantite"
  | "statut"
  | "vendorId"
>;

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  montre: "Montres",
  bijou: "Bijoux",
  sac: "Sacs",
  lunette: "Lunettes",
};

export const CATEGORIES: Categorie[] = ["montre", "bijou", "sac", "lunette"];

export const GENRE_LABELS: Record<Genre, string> = {
  homme: "Homme",
  femme: "Femme",
  unisexe: "Unisexe",
};

export const ORDER_STATUS_LABELS = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
} as const;

export const ORDER_STATUS_COLORS = {
  en_attente: "bg-amber/20 text-amber border-amber/40",
  confirmee: "bg-violet/20 text-violet border-violet/40",
  en_livraison: "bg-coral/20 text-coral border-coral/40",
  livree: "bg-green/20 text-green border-green/40",
  annulee: "bg-surface text-muted border-border",
} as const;

export function isProductAvailable(statut: ProductStatus, stock: number) {
  return statut === "actif" && stock > 0;
}
