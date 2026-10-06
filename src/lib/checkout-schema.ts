import { z } from "zod";
import { BJ_PHONE_ERROR, normalizeBjPhone } from "@/lib/bj-phone";
import { MAX_ITEMS_PER_ORDER, MAX_QTY_PER_ITEM } from "@/lib/constants";

/** Messages affichés tels quels au client : toujours en français */
export const checkoutSchema = z.object({
  nom: z
    .string({ required_error: "Indique ton nom complet." })
    .trim()
    .min(2, "Ton nom doit contenir au moins 2 caractères.")
    .max(80, "Ton nom est trop long (80 caractères maximum)."),
  telephone: z
    .string({ required_error: BJ_PHONE_ERROR })
    .trim()
    .max(32, BJ_PHONE_ERROR)
    .refine((v) => normalizeBjPhone(v) !== null, BJ_PHONE_ERROR)
    .transform((v) => normalizeBjPhone(v)!),
  adresse: z
    .string({ required_error: "Indique ton adresse de livraison." })
    .trim()
    .min(5, "Précise ton adresse de livraison (quartier, rue, repère…).")
    .max(240, "Ton adresse est trop longue (240 caractères maximum)."),
  zone: z.enum(["cotonou", "porto_novo", "godomey"], {
    errorMap: () => ({ message: "Choisis une zone de livraison." }),
  }),
  modePaiement: z.enum(["livraison", "mobile_money"], {
    errorMap: () => ({ message: "Choisis un mode de paiement." }),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantite: z
          .number()
          .int("Quantité invalide.")
          .min(1, "Quantité invalide.")
          .max(
            MAX_QTY_PER_ITEM,
            `${MAX_QTY_PER_ITEM} exemplaires maximum par article et par commande.`
          ),
      })
    )
    .min(1, "Ton panier est vide.")
    .max(
      MAX_ITEMS_PER_ORDER,
      `${MAX_ITEMS_PER_ORDER} articles différents maximum par commande.`
    ),
  /** Total affiché au client : la commande est refusée s'il diffère du total serveur */
  expectedTotal: z.number().int().min(0).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
