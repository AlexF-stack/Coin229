import type { Categorie, Genre } from "@prisma/client";
import { fetchProducts } from "@/lib/catalog";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { getShippingConfig, ZONE_LABELS, getZoneEta } from "@/lib/shipping";
import type { DeliveryZone } from "@prisma/client";

export type AgentPrefs = {
  budgetMax?: number;
  budgetMin?: number;
  categorie?: Categorie;
  genre?: Genre;
  mode?: "guide" | null;
};

export type ChatProductCard = {
  id: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  image: string | null;
  href: string;
  categorie: Categorie;
};

export type AgentReply = {
  text: string;
  quickReplies: string[];
  products: ChatProductCard[];
  prefs: AgentPrefs;
  whatsappHint: boolean;
};

export const CHAT_STARTERS = [
  "Aide-moi à choisir",
  "Budget 15 000",
  "Livraison",
  "Paiement",
  "Parler à un humain",
];

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

/** Extrait un budget FCFA depuis le texte libre. */
export function parseBudget(q: string): { min?: number; max?: number } | null {
  const normalized = q
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/,/g, " ");

  const between = normalized.match(
    /entre\s+(\d[\d\s.]*)\s*(k)?\s*(?:et|-|à)\s+(\d[\d\s.]*)\s*(k)?/
  );
  if (between) {
    const a = parseAmount(between[1]!, between[2]);
    const b = parseAmount(between[3]!, between[4]);
    if (a && b) return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  const under = normalized.match(
    /(?:moins de|max(?:imum)?|jusqu.?à|sous|budget\s*(?:de\s*)?|environ|vers|autour de)\s*(\d[\d\s.]*)\s*(k)?/
  );
  if (under) {
    const max = parseAmount(under[1]!, under[2]);
    if (max) return { max };
  }

  const bare = normalized.match(
    /(?:^|\s)(\d[\d\s.]*)\s*(k)?\s*(?:fcfa|f\b|francs?)?/
  );
  if (bare && /budget|fcfa|k\b|\d{4,}/.test(normalized)) {
    const max = parseAmount(bare[1]!, bare[2]);
    if (max && max >= 1000) return { max };
  }

  return null;
}

function parseAmount(raw: string, kFlag?: string | null): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  let n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (kFlag) n *= 1000;
  return n;
}

export function parseCategorie(q: string): Categorie | undefined {
  if (/montre|watch|horloge/.test(q)) return "montre";
  if (/bijou|bague|collier|bracelet|boucle/.test(q)) return "bijou";
  if (/sac|sacoche|pochett/.test(q)) return "sac";
  if (/lunette|soleil|opticien/.test(q)) return "lunette";
  return undefined;
}

export function parseGenre(q: string): Genre | undefined {
  if (/homme|garçon|masculin|lui\b|papa|père/.test(q)) return "homme";
  if (/femme|fille|féminin|elle\b|maman|mère|dame/.test(q)) return "femme";
  if (/unisexe|mixte|neutre/.test(q)) return "unisexe";
  return undefined;
}

function parseStyleHint(q: string): string | null {
  if (/cadeau|offrir|anniversaire|noël|fête/.test(q)) return "cadeau";
  if (/chic|élégant|soirée|classe|luxe/.test(q)) return "chic";
  if (/sport|casu|quotidien|simple|basique/.test(q)) return "casual";
  if (/bureau|travail|pro|formel/.test(q)) return "pro";
  return null;
}

function pageContextHint(pathname?: string): string | null {
  if (!pathname) return null;
  if (pathname.startsWith("/produit/")) {
    return "Tu es sur une fiche produit — je peux comparer avec d’autres pièces selon ton budget.";
  }
  if (pathname.startsWith("/panier")) {
    return "Tu as le panier ouvert — je peux vérifier livraison, paiement ou te proposer un accessoire complémentaire.";
  }
  if (pathname.startsWith("/commande")) {
    return "Tu es dans le tunnel de commande — je t’aide sur paiement, zones ou un doute avant de valider.";
  }
  if (pathname.startsWith("/compte")) {
    return "Sur Mon compte : suis une commande, active les notifs, ou demande un conseil shopping.";
  }
  if (pathname.startsWith("/boutique") || pathname.startsWith("/recherche")) {
    return "Tu es dans la boutique — dis-moi un budget ou un style, je te filtre les meilleures pièces.";
  }
  return null;
}

async function recommend(prefs: AgentPrefs, limit = 4): Promise<ChatProductCard[]> {
  const { products } = await fetchProducts({
    categorie: prefs.categorie,
    genre: prefs.genre,
    enStock: true,
    sort: "pertinence",
  });

  let list = products.map((p) => ({
    id: p.id,
    nom: p.nom,
    prix: p.prix,
    prixPromo: p.prixPromo,
    image: p.images?.[0] ?? null,
    href: `/produit/${p.id}`,
    categorie: p.categorie,
    effective: getEffectivePrice(p.prix, p.prixPromo),
  }));

  if (prefs.budgetMax != null) {
    list = list.filter((p) => p.effective <= prefs.budgetMax!);
  }
  if (prefs.budgetMin != null) {
    list = list.filter((p) => p.effective >= prefs.budgetMin!);
  }

  // Style soft-ranking
  return list.slice(0, limit).map(({ effective: _, ...card }) => card);
}

function mergePrefs(base: AgentPrefs, q: string): AgentPrefs {
  const next = { ...base };
  const budget = parseBudget(q);
  if (budget?.max) next.budgetMax = budget.max;
  if (budget?.min) next.budgetMin = budget.min;
  const cat = parseCategorie(q);
  if (cat) next.categorie = cat;
  const genre = parseGenre(q);
  if (genre) next.genre = genre;
  if (/aide.?moi|choisir|conseille|idée|recommande|quoi acheter|guide/.test(q)) {
    next.mode = "guide";
  }
  return next;
}

function prefsSummary(prefs: AgentPrefs): string {
  const bits: string[] = [];
  if (prefs.categorie) bits.push(prefs.categorie + "s");
  if (prefs.genre) bits.push(`pour ${prefs.genre}`);
  if (prefs.budgetMax) bits.push(`≤ ${formatPrice(prefs.budgetMax)}`);
  if (prefs.budgetMin && !prefs.budgetMax) bits.push(`≥ ${formatPrice(prefs.budgetMin)}`);
  if (prefs.budgetMin && prefs.budgetMax) {
    /* already have max */
  }
  return bits.length ? bits.join(" · ") : "sélection du moment";
}

/**
 * Mini-agent boutique : FAQ + guidage budget/style + vrais produits catalogue.
 */
export async function runShopAgent(input: {
  message: string;
  prefs?: AgentPrefs;
  pathname?: string;
}): Promise<AgentReply> {
  const raw = input.message.trim();
  const q = raw.toLowerCase();
  let prefs = mergePrefs(input.prefs ?? {}, q);
  const ctx = pageContextHint(input.pathname);
  const style = parseStyleHint(q);

  if (!q) {
    return {
      text: ctx
        ? `${ctx}\n\nDis-moi un budget, une catégorie, ou choisis une option.`
        : "Dis-moi ce dont tu as besoin — budget, style, livraison…",
      quickReplies: CHAT_STARTERS,
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  // Humain
  if (
    /humain|conseiller|whatsapp|appeler|contact|aide humaine/.test(q) ||
    q === "parler à un humain"
  ) {
    return {
      text: "Avec plaisir. Un conseiller Coin229 te répond sur WhatsApp — tu peux aussi continuer ici pour un conseil produit.",
      quickReplies: ["Aide-moi à choisir", "Livraison", "Voir la boutique"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (/livraison|livrer|délai|frais|gratuit|shipping|expédition/.test(q)) {
    return {
      text: (ctx ? ctx + "\n\n" : "") + shippingBlurb(),
      quickReplies: ["Paiement", "Zones desservies", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/zone|cotonou|porto|godomey|abomey|calavi|où livrez/.test(q)) {
    return {
      text: "On livre à Cotonou, Porto-Novo et Godomey / Abomey-Calavi. Choisis ta zone dans le panier pour le prix exact.",
      quickReplies: ["Livraison", "Paiement", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/paiement|payer|mobile money|mtn|moov|espèces|cash/.test(q)) {
    return {
      text: "Tu peux payer :\n• À la livraison (recommandé)\n• Mobile Money (MTN MoMo ou Moov Money)\n\nLe choix se fait au checkout.",
      quickReplies: ["Livraison", "Suivre ma commande", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/commande|suivi|suivre|où est|statut|historique/.test(q)) {
    return {
      text: "Pour le suivi : ouvre Mon compte et connecte-toi (SMS ou Google). Sinon WhatsApp avec ton nom + numéro.",
      quickReplies: ["Parler à un humain", "Aide-moi à choisir", "Paiement"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (/retour|échanger|rembours/.test(q)) {
    return {
      text: "Retours sous 48 h si l’article n’est pas porté. Détails sur la page Retours, ou WhatsApp avec ta commande.",
      quickReplies: ["Parler à un humain", "Livraison", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (/bonjour|salut|hello|bonsoir|hey|coucou/.test(q)) {
    return {
      text:
        (ctx ? ctx + "\n\n" : "") +
        "Salut ! Je suis l’assistant Coin229. Je te guide selon ton budget et ton style, ou je réponds sur livraison / paiement.",
      quickReplies: CHAT_STARTERS,
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/merci|ok|d'accord|super|parfait/.test(q)) {
    return {
      text: "Avec plaisir. Tu veux une autre idée produit, ou une info livraison ?",
      quickReplies: CHAT_STARTERS,
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  // Guided shopping
  const wantsGuide =
    prefs.mode === "guide" ||
    /aide.?moi|choisir|conseille|idée|recommande|quoi acheter|guide|cadeau/.test(
      q
    ) ||
    Boolean(prefs.budgetMax || prefs.categorie || prefs.genre || style);

  if (wantsGuide) {
    prefs = { ...prefs, mode: "guide" };

    if (style === "cadeau" && !prefs.genre && !prefs.categorie) {
      return {
        text: "Un cadeau, parfait. Pour qui ? Et tu as un budget en tête ?",
        quickReplies: [
          "Pour elle · 15 000",
          "Pour lui · 25 000",
          "Budget 10 000",
          "Montres",
        ],
        products: [],
        prefs,
        whatsappHint: false,
      };
    }

    if (!prefs.budgetMax && !prefs.budgetMin && !prefs.categorie) {
      return {
        text:
          (ctx ? ctx + "\n\n" : "") +
          "Je te trouve les meilleures pièces. Quel budget max (FCFA) ?",
        quickReplies: [
          "Budget 10 000",
          "Budget 15 000",
          "Budget 25 000",
          "Budget 50 000",
        ],
        products: [],
        prefs,
        whatsappHint: false,
      };
    }

    if (prefs.budgetMax && !prefs.categorie && !parseCategorie(q)) {
      // Ask category unless they already said style that maps
      if (style === "chic" || style === "pro") {
        prefs.categorie = prefs.categorie ?? "montre";
      } else if (style === "casual") {
        prefs.categorie = prefs.categorie ?? "lunette";
      } else {
        return {
          text: `Budget ≤ ${formatPrice(prefs.budgetMax)}. Tu cherches plutôt…`,
          quickReplies: ["Montres", "Bijoux", "Sacs", "Lunettes"],
          products: [],
          prefs,
          whatsappHint: false,
        };
      }
    }

    const products = await recommend(prefs, 4);
    if (!products.length) {
      return {
        text: `Rien en stock pour « ${prefsSummary(prefs)} ». On élargit le budget ou on change de catégorie ?`,
        quickReplies: [
          "Budget 25 000",
          "Budget 50 000",
          "Voir la boutique",
          "Parler à un humain",
        ],
        products: [],
        prefs: { ...prefs, budgetMax: undefined },
        whatsappHint: true,
      };
    }

    const styleNote = style
      ? ` Style ${style} pris en compte.`
      : "";
    return {
      text: `Voici ${products.length} idée(s) pour toi (${prefsSummary(prefs)}).${styleNote}\nTape sur une pièce, ou affine (ex. « homme », « lunettes », « 20k »).`,
      quickReplies: [
        "Autre suggestion",
        "Voir la boutique",
        "Livraison",
        "Parler à un humain",
      ],
      products,
      prefs,
      whatsappHint: false,
    };
  }

  // Direct catalog keywords without guide mode
  if (/montre|bijou|sac|lunette|catalogue|produit|promo|acheter|boutique/.test(q)) {
    prefs = mergePrefs(prefs, q);
    const products = await recommend(
      { ...prefs, mode: "guide" },
      4
    );
    if (products.length) {
      return {
        text: `Voici ce que j’ai trouvé (${prefsSummary({ ...prefs, mode: "guide" })}). Tu peux préciser un budget pour affiner.`,
        quickReplies: [
          "Budget 15 000",
          "Aide-moi à choisir",
          "Voir la boutique",
          "Livraison",
        ],
        products,
        prefs: { ...prefs, mode: "guide" },
        whatsappHint: false,
      };
    }
  }

  if (/autre suggestion|encore|autres idées/.test(q)) {
    prefs = { ...prefs, mode: "guide" };
    const products = await recommend(prefs, 4);
    return {
      text: products.length
        ? "D’autres options dans la même logique :"
        : "Je n’ai plus d’autres pièces sur ce filtre. Change budget ou catégorie ?",
      quickReplies: products.length
        ? ["Budget 25 000", "Voir la boutique", "Parler à un humain"]
        : ["Budget 25 000", "Montres", "Bijoux", "Lunettes"],
      products,
      prefs,
      whatsappHint: !products.length,
    };
  }

  return {
    text:
      (ctx ? ctx + "\n\n" : "") +
      "Je peux te guider (budget + style), ou répondre sur livraison, paiement et commandes. Que veux-tu faire ?",
    quickReplies: CHAT_STARTERS,
    products: [],
    prefs,
    whatsappHint: true,
  };
}
