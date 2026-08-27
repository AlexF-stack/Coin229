/** Identité publique Coin229 — compléter via variables d'environnement en production. */

export const SITE = {
  name: "Coin229",
  legalName:
    process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "Coin229 (activité commerciale)",
  tagline: "Accessoires mode livrés au Bénin",
  description:
    "Boutique en ligne d'accessoires mode au Bénin : montres, bijoux, sacs et lunettes. Livraison à Cotonou, Porto-Novo et Godomey. Paiement à la livraison ou Mobile Money (MTN MoMo, Moov).",
  locale: "fr_BJ",
  currency: "XOF",
  currencyLabel: "FCFA",
  country: "Bénin",
  url: (process.env.NEXT_PUBLIC_APP_URL ?? "https://coin229.vercel.app").replace(
    /\/$/,
    ""
  ),
  email:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "contact@coin229.bj",
  phoneDisplay:
    process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "+229 90 00 00 00",
  whatsapp:
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "22990000000",
  address:
    process.env.NEXT_PUBLIC_LEGAL_ADDRESS?.trim() ||
    "Cotonou, Littoral, République du Bénin",
  rccm: process.env.NEXT_PUBLIC_LEGAL_RCCM?.trim() || "En cours d'immatriculation",
  ifu: process.env.NEXT_PUBLIC_LEGAL_IFU?.trim() || "En cours d'attribution",
  zones: ["Cotonou", "Porto-Novo", "Godomey / Abomey-Calavi"] as const,
  social: {
    instagram:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
      "https://instagram.com/coin229",
  },
} as const;

export function whatsappHref(prefill?: string) {
  const text =
    prefill ?? "Bonjour Coin229, j'ai une question sur ma commande.";
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
