import { normalizeBjPhone } from "@/lib/bj-phone";

/** Identité publique Coin229 — compléter via variables d'environnement en production. */

export const SITE = {
  name: "Coin229",
  legalName:
    process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "Coin229 (activité commerciale)",
  tagline: "Toute une tenue. Les bons détails.",
  description:
    "Coin229 — montres, bijoux, sacs et lunettes sélectionnés pour votre style. Livraison à Cotonou, Porto-Novo et Godomey. Paiement à la livraison ou Mobile Money.",
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

/** Numéro d'exemple de .env.example, jamais un vrai contact */
const PLACEHOLDER_WHATSAPP = "22990000000";

/** Lien WhatsApp : vers un numéro (indicatif compris) ou, sans numéro, au choix de l'utilisateur */
export function whatsappLink(text: string, phoneDigits?: string | null): string {
  const to = phoneDigits?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

/** Contacter Coin229 sur WhatsApp */
export function whatsappHref(prefill?: string) {
  const text =
    prefill ?? "Bonjour Coin229, j'ai une question sur ma commande.";
  return whatsappLink(text, SITE.whatsapp === PLACEHOLDER_WHATSAPP ? null : SITE.whatsapp);
}

/** Écrire à un contact béninois (vendeur…) ; null si le numéro est invalide */
export function whatsappToBjContact(contact: string, text: string): string | null {
  const phone = normalizeBjPhone(contact);
  return phone ? whatsappLink(text, phone) : null;
}

/** Lien produit partagé par un vendeur (suivi UTM de la campagne) */
export function productShareUrl(productId: string, campaign: string): string {
  return `${SITE.url}/produit/${productId}?utm_source=vendor&utm_medium=share&utm_campaign=${encodeURIComponent(campaign)}`;
}
