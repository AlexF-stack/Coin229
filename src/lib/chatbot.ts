import { formatPrice } from "@/lib/utils";
import { getShippingConfig, ZONE_LABELS, getZoneEta } from "@/lib/shipping";
import type { DeliveryZone } from "@prisma/client";

export type ChatRole = "bot" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  quickReplies?: string[];
};

const WHATSAPP =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "";

export function getWhatsAppHref(prefill?: string) {
  const text =
    prefill ?? "Bonjour Coin229 👋 J’ai une question sur ma commande.";
  if (!WHATSAPP || WHATSAPP === "22990000000") {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export const CHAT_STARTERS = [
  "Livraison",
  "Paiement",
  "Zones desservies",
  "Suivre ma commande",
  "Parler à un humain",
];

function shippingBlurb() {
  const { fees, freeShippingThreshold } = getShippingConfig();
  const zones = (Object.keys(ZONE_LABELS) as DeliveryZone[])
    .map((z) => {
      const eta = getZoneEta(z);
      return `• ${ZONE_LABELS[z]} : ${formatPrice(fees[z])} — ${eta.label}`;
    })
    .join("\n");
  return `Voici nos zones et frais :\n\n${zones}\n\nLivraison offerte dès ${formatPrice(freeShippingThreshold)}.`;
}

type Reply = {
  text: string;
  quickReplies?: string[];
};

/**
 * Assistant boutique — réponses utiles sans exposer la stratégie interne.
 */
export function replyToUser(input: string): Reply {
  const q = input.trim().toLowerCase();

  if (!q) {
    return {
      text: "Dis-moi ce dont tu as besoin 😊",
      quickReplies: CHAT_STARTERS,
    };
  }

  if (
    /humain|conseiller|whatsapp|agent|appeler|contact|aide humaine/.test(q) ||
    q === "parler à un humain"
  ) {
    return {
      text: "Avec plaisir. Un conseiller Coin229 te répond sur WhatsApp.",
      quickReplies: ["Livraison", "Paiement", "Voir la boutique"],
    };
  }

  if (/livraison|livrer|délai|frais|gratuit|shipping|expédition/.test(q) || q === "livraison") {
    return {
      text: shippingBlurb(),
      quickReplies: ["Paiement", "Zones desservies", "Parler à un humain"],
    };
  }

  if (/zone|cotonou|porto|godomey|abomey|calavi|où livrez/.test(q) || q === "zones desservies") {
    return {
      text: "On livre actuellement à Cotonou, Porto-Novo et Godomey / Abomey-Calavi. Indique ta zone dans le panier pour voir le prix exact.",
      quickReplies: ["Livraison", "Paiement", "Parler à un humain"],
    };
  }

  if (/paiement|payer|mobile money|mtn|moov|espèces|cash|livraison\s*\?/.test(q) || q === "paiement") {
    return {
      text: "Tu peux payer :\n• À la livraison (recommandé)\n• Mobile Money (MTN MoMo ou Moov Money)\n\nLe choix se fait au moment de la commande.",
      quickReplies: ["Livraison", "Suivre ma commande", "Parler à un humain"],
    };
  }

  if (/commande|suivi|suivre|où est|statut|historique/.test(q) || q === "suivre ma commande") {
    return {
      text: "Pour voir tes commandes, ouvre Mon compte et connecte-toi avec ton numéro. Tu peux aussi nous écrire sur WhatsApp avec ton nom et ton numéro.",
      quickReplies: ["Parler à un humain", "Paiement", "Voir la boutique"],
    };
  }

  if (/montre|bijou|sac|catalogue|produit|prix|promo|acheter/.test(q) || q === "voir la boutique") {
    return {
      text: "On a des montres, bijoux et sacs pour hommes et femmes. Filtre par catégorie sur l’accueil, ou cherche un modèle.",
      quickReplies: ["Livraison", "Paiement", "Parler à un humain"],
    };
  }

  if (/bonjour|salut|hello|bonsoir|hey|coucou/.test(q)) {
    return {
      text: "Salut ! Je suis l’assistant Coin229. Je peux t’aider sur la livraison, le paiement ou tes commandes.",
      quickReplies: CHAT_STARTERS,
    };
  }

  if (/merci|ok|d'accord|super|parfait/.test(q)) {
    return {
      text: "Avec plaisir. Autre question ?",
      quickReplies: CHAT_STARTERS,
    };
  }

  if (/retour|échanger|rembours/.test(q)) {
    return {
      text: "Pour un échange ou un souci sur un article, contacte-nous sur WhatsApp avec ta référence de commande — on trouve une solution rapidement.",
      quickReplies: ["Parler à un humain", "Suivre ma commande"],
    };
  }

  return {
    text: "Je n’ai pas bien saisi. Tu peux choisir une option ci-dessous, ou parler à un conseiller WhatsApp.",
    quickReplies: CHAT_STARTERS,
  };
}

export function createBotMessage(
  text: string,
  quickReplies?: string[]
): ChatMessage {
  return {
    id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role: "bot",
    text,
    quickReplies,
  };
}

export function createUserMessage(text: string): ChatMessage {
  return {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    role: "user",
    text,
  };
}

export const WELCOME_MESSAGE = createBotMessage(
  "Salut ! Je suis l’assistant Coin229 ✨\nLivraison, paiement, commandes… pose ta question ou choisis une option.",
  CHAT_STARTERS
);
