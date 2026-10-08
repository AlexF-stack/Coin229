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

/** Quantité maximale par article et par commande (aussi vérifiée côté serveur) */
export const MAX_QTY_PER_ITEM = 20;
/** Nombre maximal d'articles différents par commande */
export const MAX_ITEMS_PER_ORDER = 30;

/** Quantité commandable : limitée par le stock ET par le plafond par commande */
export function maxOrderQty(stockQuantite: number): number {
  return Math.max(0, Math.min(stockQuantite, MAX_QTY_PER_ITEM));
}

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

/**
 * Niches marketplace — SOURCE UNIQUE. Libellés, filtres par catégorie, choix
 * de l'espace vendeur et ordre du catalogue en découlent.
 */
export const NICHES: readonly {
  value: string;
  label: string;
  /** Libellé plus précis dans le formulaire vendeur */
  vendorLabel?: string;
  categorie: Categorie;
}[] = [
  { value: "montre luxe", label: "Montres luxe", categorie: "montre" },
  { value: "montre", label: "Montres classiques", categorie: "montre" },
  { value: "bijou", label: "Bijoux", categorie: "bijou" },
  { value: "sandale luxe", label: "Sandales luxe", categorie: "chaussure" },
  { value: "sandale", label: "Sandales", vendorLabel: "Sandales / claquettes", categorie: "chaussure" },
  { value: "sac", label: "Sacs", categorie: "sac" },
  { value: "lunette", label: "Lunettes", categorie: "lunette" },
];

/** Libellés lisibles pour les niches marketplace. */
export const NICHE_LABELS: Record<string, string> = Object.fromEntries(
  NICHES.map((n) => [n.value, n.label])
);

export function nicheLabel(niche: string | null | undefined): string {
  const key = (niche ?? "").trim().toLowerCase();
  if (!key) return "";
  return NICHE_LABELS[key] ?? niche!.trim();
}

/** Niches rattachées à une catégorie (filtres secondaires). */
export const NICHES_BY_CATEGORIE: Partial<Record<Categorie, string[]>> = {};
for (const n of NICHES) (NICHES_BY_CATEGORIE[n.categorie] ??= []).push(n.value);

/** Liste fixe pour l’espace vendeur — pas de texte libre. */
export const VENDOR_NICHE_OPTIONS = NICHES.map((n) => ({
  value: n.value,
  label: n.vendorLabel ?? n.label,
  categorie: n.categorie,
}));

/** Catégorie d'une niche (liste fixe, puis mots-clés des anciens produits en texte libre) */
export function categorieFromNiche(niche: string): Categorie {
  const n = niche.trim().toLowerCase();
  const hit = NICHES.find((o) => o.value === n);
  if (hit) return hit.categorie;
  if (/montre|watch|horloge/.test(n)) return "montre";
  if (/bijou|bague|collier|bracelet|boucle/.test(n)) return "bijou";
  if (/lunette|soleil|optic/.test(n)) return "lunette";
  if (/chaussure|sandale|claquette|mule|slipper|sneaker|basket/.test(n)) return "chaussure";
  return "sac";
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
  en_attente: "bg-accent/20 text-accent border-accent/40",
  confirmee: "bg-info/20 text-info border-info/40",
  en_livraison: "bg-error/20 text-error border-error/40",
  livree: "bg-success/20 text-success border-success/40",
  annulee: "bg-background text-muted border-border",
} as const;

export function isProductAvailable(statut: ProductStatus, stock: number) {
  return statut === "actif" && stock > 0;
}
