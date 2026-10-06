import type {
  Categorie,
  Genre,
  Product,
  ProductStatus,
  Vendor,
} from "@prisma/client";

/** Vendeur sans ses champs secrets (exclus par défaut, voir src/lib/prisma.ts) */
export type SafeVendor = Omit<
  Vendor,
  "passwordHash" | "resetTokenHash" | "resetTokenExpires"
>;

export type ProductCardData = Pick<
  Product,
  | "id"
  | "nom"
  | "prix"
  | "prixPromo"
  | "images"
  | "categorie"
  | "niche"
  | "genre"
  | "stockQuantite"
  | "statut"
  | "vendorId"
  | "dateCreation"
>;

export const CATEGORIE_LABELS: Record<Categorie, string> = {
  montre: "Montres",
  bijou: "Bijoux",
  sac: "Sacs",
  lunette: "Lunettes",
  chaussure: "Chaussures",
};

export const CATEGORIE_TAGLINES: Record<Categorie, string> = {
  montre: "Le temps, avec style.",
  bijou: "Les détails qui comptent.",
  sac: "Pratique, urbain, affirmé.",
  lunette: "Cadrez votre look.",
  chaussure: "Claquettes & sandales.",
};

export const CATEGORIES: Categorie[] = [
  "montre",
  "bijou",
  "sac",
  "lunette",
  "chaussure",
];

/** Ordre d’affichage catalogue (parcours prospect). */
export const CATEGORIE_SORT_ORDER: Record<Categorie, number> = {
  montre: 0,
  bijou: 1,
  chaussure: 2,
  sac: 3,
  lunette: 4,
};

/** Libellés lisibles pour les niches marketplace. */
export const NICHE_LABELS: Record<string, string> = {
  "montre luxe": "Montres luxe",
  montre: "Montres classiques",
  bijou: "Bijoux",
  "sandale luxe": "Sandales luxe",
  sandale: "Sandales",
  sac: "Sacs",
  lunette: "Lunettes",
};

export function nicheLabel(niche: string | null | undefined): string {
  const key = (niche ?? "").trim().toLowerCase();
  if (!key) return "";
  return NICHE_LABELS[key] ?? niche!.trim();
}

/** Niches rattachées à une catégorie (filtres secondaires). */
export const NICHES_BY_CATEGORIE: Partial<Record<Categorie, string[]>> = {
  montre: ["montre luxe", "montre"],
  bijou: ["bijou"],
  sac: ["sac"],
  lunette: ["lunette"],
  chaussure: ["sandale luxe", "sandale"],
};

/** Liste fixe pour l’espace vendeur — pas de texte libre. */
export const VENDOR_NICHE_OPTIONS: {
  value: string;
  label: string;
  categorie: Categorie;
}[] = [
  { value: "montre luxe", label: "Montres luxe", categorie: "montre" },
  { value: "montre", label: "Montres classiques", categorie: "montre" },
  { value: "bijou", label: "Bijoux", categorie: "bijou" },
  { value: "sandale luxe", label: "Sandales luxe", categorie: "chaussure" },
  { value: "sandale", label: "Sandales / claquettes", categorie: "chaussure" },
  { value: "sac", label: "Sacs", categorie: "sac" },
  { value: "lunette", label: "Lunettes", categorie: "lunette" },
];

export function categorieFromNiche(niche: string): Categorie {
  const key = niche.trim().toLowerCase();
  const hit = VENDOR_NICHE_OPTIONS.find((o) => o.value === key);
  return hit?.categorie ?? "sac";
}

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
