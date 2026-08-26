import { z } from "zod";

export const checkoutSchema = z.object({
  nom: z.string().trim().min(2).max(80),
  telephone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s/g, ""))
    .refine(
      (v) => /^\+?229\d{8}$|^\d{8,10}$/.test(v),
      "Numéro invalide"
    ),
  adresse: z.string().trim().min(5).max(240),
  zone: z.enum(["cotonou", "porto_novo", "godomey"]),
  modePaiement: z.enum(["livraison", "mobile_money"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantite: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
