import { z } from "zod";
import { BJ_PHONE_ERROR, normalizeBjPhone } from "@/lib/bj-phone";

export const checkoutSchema = z.object({
  nom: z.string().trim().min(2).max(80),
  telephone: z
    .string()
    .trim()
    .max(32)
    .refine((v) => normalizeBjPhone(v) !== null, BJ_PHONE_ERROR)
    .transform((v) => normalizeBjPhone(v)!),
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
