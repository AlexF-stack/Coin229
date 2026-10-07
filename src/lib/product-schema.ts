/**
 * Validation serveur des produits (vendeur et admin) et des images.
 * Messages en français, affichés tels quels.
 */
import { z } from "zod";
import { Genre, ProductSource, ProductStatus } from "@prisma/client";

/**
 * Images autorisées = celles que next/image sait afficher (next.config.ts →
 * remotePatterns) : fichiers du site, stockage Supabase, Unsplash.
 * Toute autre URL ferait planter l'affichage des pages produit / vitrine.
 */
export function isAllowedImageUrl(raw: string): boolean {
  const url = raw.trim();
  if (url.startsWith("/") && !url.startsWith("//")) return !url.includes("..");
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname === "images.unsplash.com" || u.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

const imageUrl = z
  .string()
  .trim()
  .max(1000, "Adresse d’image trop longue.")
  .refine(isAllowedImageUrl, "Image non autorisée : utilise une photo envoyée depuis ton espace.");

export const productInputSchema = z
  .object({
    nom: z
      .string()
      .trim()
      .min(2, "Le nom du produit doit contenir au moins 2 caractères.")
      .max(120, "Nom du produit trop long (120 caractères maximum)."),
    description: z
      .string()
      .trim()
      .max(4000, "Description trop longue (4 000 caractères maximum)."),
    genre: z.nativeEnum(Genre, { errorMap: () => ({ message: "Genre invalide." }) }),
    prix: z
      .number({ invalid_type_error: "Prix invalide." })
      .int("Le prix doit être un montant entier en FCFA.")
      .min(100, "Prix minimum : 100 FCFA.")
      .max(50_000_000, "Prix trop élevé."),
    prixPromo: z
      .number({ invalid_type_error: "Prix promo invalide." })
      .int("Le prix promo doit être un montant entier en FCFA.")
      .min(1, "Prix promo invalide.")
      .nullable()
      .optional(),
    stockQuantite: z
      .number({ invalid_type_error: "Stock invalide." })
      .int("Le stock doit être un nombre entier.")
      .min(0, "Le stock ne peut pas être négatif.")
      .max(100_000, "Stock trop élevé."),
    source: z.nativeEnum(ProductSource).optional(),
    images: z
      .array(imageUrl)
      .min(1, "Ajoute au moins une photo.")
      .max(8, "8 photos maximum."),
    statut: z.nativeEnum(ProductStatus, {
      errorMap: () => ({ message: "Statut invalide." }),
    }),
  })
  .refine((d) => d.prixPromo == null || d.prixPromo < d.prix, {
    message: "Le prix promo doit être inférieur au prix normal.",
    path: ["prixPromo"],
  });

export type ProductInput = z.infer<typeof productInputSchema>;

/** Valide et renvoie soit les données propres, soit le 1er message d'erreur */
export function parseProductInput(
  data: unknown
): { ok: true; data: ProductInput } | { ok: false; error: string } {
  const parsed = productInputSchema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Données produit invalides." };
}
