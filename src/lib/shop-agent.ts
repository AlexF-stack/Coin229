import type { Categorie, Genre } from "@prisma/client";
import { fetchActiveCategories, fetchProducts } from "@/lib/catalog";
import { CATEGORIE_LABELS } from "@/lib/constants";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { getShippingConfig, ZONE_LABELS, getZoneEta } from "@/lib/shipping";
import type { DeliveryZone } from "@prisma/client";

export type AgentPrefs = {
  budgetMax?: number;
  budgetMin?: number;
  categorie?: Categorie;
  genre?: Genre;
  mode?: "guide" | null;
  /** Nombre de suggestions déjà montrées (« Autre suggestion » → les suivantes) */
  offset?: number;
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
  // « 15 000 » écrit avec espace compte aussi comme un montant
  if (bare && /budget|fcfa|k\b|\d{4,}|\d{1,3}(?:[\s.]\d{3})+/.test(normalized)) {
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
  if (/chaussure|sandale|claquette|mule|slipper/.test(q)) return "chaussure";
  return undefined;
}

/** Produits que Coin229 ne vend pas (réponse honnête au lieu d'une recherche vide) */
export function parseOutOfScope(q: string): string | undefined {
  if (/cosm[ée]ti|beaut[ée]|maquillage|parfum|skincare/.test(q)) return "cosmétiques";
  if (/électronique|electronique|smartphone|\bt[ée]l[ée]phone|gadget|écouteur/.test(q)) return "électronique";
  if (/\bkids\b|enfant|bébé|jouet/.test(q)) return "articles pour enfants";
  if (/\bmaison\b|déco|cuisine/.test(q)) return "articles pour la maison";
  if (/vêtement|\brobe|chemise|pantalon|t-shirt|tee-shirt/.test(q)) return "vêtements";
  return undefined;
}

export function parseGenre(q: string): Genre | undefined {
  if (/homme|garçon|masculin|\blui\b|papa|(?:^|\s)père\b/.test(q)) return "homme";
  if (/femme|fille|féminin|\belle\b|maman|(?:^|\s)mère\b|dame/.test(q)) return "femme";
  if (/unisexe|mixte|neutre/.test(q)) return "unisexe";
  return undefined;
}

function parseStyleHint(q: string): string | null {
  if (/cadeau|offrir|anniversaire|noël|fête/.test(q)) return "cadeau";
  if (/chic|élégant|soirée|classe|luxe/.test(q)) return "chic";
  if (/\bsport|casu|quotidien|simple|basique/.test(q)) return "casual";
  if (/bureau|travail|\bpro\b|professionnel|formel/.test(q)) return "pro";
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
  const offset = prefs.offset ?? 0;
  return list.slice(offset, offset + limit).map(({ effective, ...card }) => {
    void effective; // champ de tri interne, pas envoyé au client
    return card;
  });
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
  // Nouveau critère → on repart des premières suggestions
  if (budget || cat || genre) next.offset = 0;
  if (/aide.?moi|choisir|conseille|idée|recommande|quoi acheter|guide/.test(q)) {
    next.mode = "guide";
  }
  return next;
}

function prefsSummary(prefs: AgentPrefs): string {
  const bits: string[] = [];
  if (prefs.categorie) bits.push(CATEGORIE_LABELS[prefs.categorie].toLowerCase());
  if (prefs.genre) bits.push(`pour ${prefs.genre}`);
  if (prefs.budgetMax) bits.push(`≤ ${formatPrice(prefs.budgetMax)}`);
  if (prefs.budgetMin && !prefs.budgetMax) bits.push(`≥ ${formatPrice(prefs.budgetMin)}`);
  if (prefs.budgetMin && prefs.budgetMax) {
    /* already have max */
  }
  return bits.length ? bits.join(" · ") : "sélection du moment";
}

/** « Bonjour », « salut »… en début de message */
const GREETING = /^(?:bonjour|bonsoir|salut|hello|hey|coucou)\b[\s,!.]*/;
/** Message qui n'est QUE un remerciement / acquiescement (« ok merci », « super ! ») */
const ACK = /^(?:(?:merci|ok|okay|d'accord|d’accord|super|parfait|cool|top|beaucoup|bien)[\s,!.]*)+$/;
const MORE = /autre suggestion|autres? id[ée]es?|d'autres|d’autres|encore|autre chose/;

function categoryReplies(active: Categorie[]): string[] {
  return active.map((c) => CATEGORIE_LABELS[c]);
}

/** Catégorie par défaut d'un style, parmi celles qui ont des produits */
function styleCategorie(style: string | null, active: Categorie[]): Categorie | undefined {
  const order: Categorie[] =
    style === "chic" || style === "pro"
      ? ["montre", "bijou"]
      : style === "casual"
        ? ["chaussure", "lunette", "sac"]
        : [];
  return order.find((c) => active.includes(c));
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
  const full = raw.toLowerCase();
  // Une salutation ne doit pas masquer la vraie demande (« Bonjour, une montre à 20k »)
  const greeted = GREETING.test(full);
  const q = greeted ? full.replace(GREETING, "").trim() : full;
  const hello = greeted ? "Bonjour ! " : "";
  let prefs = mergePrefs(input.prefs ?? {}, q);
  const ctx = pageContextHint(input.pathname);
  const style = parseStyleHint(q);
  const active = await fetchActiveCategories();

  if (!full) {
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

  // Salutation seule (ou « ça va ? »)
  if (greeted && (!q || /^(?:ça va|ca va|comment (?:ça|ca) va)\s*\??[\s!.]*$/.test(q))) {
    return {
      text:
        (ctx ? ctx + "\n\n" : "") +
        "Hello — je t’aide à choisir. Budget, style, livraison ou paiement : par où on commence ?",
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
      text: hello + "Avec plaisir. Un conseiller Coin229 te répond sur WhatsApp — tu peux aussi continuer ici pour un conseil produit.",
      quickReplies: ["Aide-moi à choisir", "Livraison", "Voir la boutique"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (/livraison|livrer|délai|frais|gratuit|shipping|expédition/.test(q)) {
    return {
      text: hello + (ctx ? ctx + "\n\n" : "") + shippingBlurb(),
      quickReplies: ["Paiement", "Zones desservies", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/zone|cotonou|porto|godomey|abomey|calavi|où livrez/.test(q)) {
    return {
      text: hello + "On livre à Cotonou, Porto-Novo et Godomey / Abomey-Calavi. Choisis ta zone dans le panier pour le prix exact.",
      quickReplies: ["Livraison", "Paiement", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  if (/paiement|payer|mobile money|\bmtn\b|\bmoov\b|espèces|cash/.test(q)) {
    return {
      text: hello + "Tu peux payer :\n• À la livraison (recommandé)\n• Mobile Money (MTN MoMo ou Moov Money)\n\nLe choix se fait au checkout.",
      quickReplies: ["Livraison", "Suivre ma commande", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  // Suivi (« commander une montre » n'est pas une question de suivi)
  if (/suivi|suivre|où est|ma commande|mes commandes|statut|historique/.test(q)) {
    return {
      text: hello + "Pour le suivi : ouvre Mon compte et connecte-toi (SMS ou Google). Sinon WhatsApp avec ton nom + numéro.",
      quickReplies: ["Parler à un humain", "Aide-moi à choisir", "Paiement"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (/retour|échanger|rembours/.test(q)) {
    return {
      text: hello + "Retours sous 48 h si l’article n’est pas porté. Détails sur la page Retours, ou WhatsApp avec ta commande.",
      quickReplies: ["Parler à un humain", "Livraison", "Aide-moi à choisir"],
      products: [],
      prefs,
      whatsappHint: true,
    };
  }

  if (ACK.test(q)) {
    return {
      text: "Avec plaisir. Tu veux une autre idée produit, ou une info livraison ?",
      quickReplies: CHAT_STARTERS,
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  // Ce que Coin229 ne vend pas
  const outOfScope = parseOutOfScope(q);
  const askedCategorie = parseCategorie(q);
  if (outOfScope && !askedCategorie) {
    return {
      text: `${hello}Coin229 ne propose pas de ${outOfScope} pour l’instant. On a : ${categoryReplies(active).join(", ").toLowerCase()}.`,
      quickReplies: [...categoryReplies(active), "Parler à un humain"],
      products: [],
      prefs,
      whatsappHint: false,
    };
  }
  // Rayon sans produit (ex. sacs)
  if (askedCategorie && !active.includes(askedCategorie)) {
    prefs = { ...prefs, categorie: undefined };
    return {
      text: `${hello}Pas encore de ${CATEGORIE_LABELS[askedCategorie].toLowerCase()} en boutique. Je peux te montrer : ${categoryReplies(active).join(", ").toLowerCase()}.`,
      quickReplies: categoryReplies(active),
      products: [],
      prefs,
      whatsappHint: false,
    };
  }

  // « Autre suggestion » : les pièces suivantes, pas les mêmes
  if (MORE.test(q)) {
    prefs = { ...prefs, mode: "guide", offset: (prefs.offset ?? 0) + 4 };
    const products = await recommend(prefs, 4);
    if (!products.length) prefs = { ...prefs, offset: 0 };
    return {
      text: products.length
        ? "D’autres options dans la même logique :"
        : "J’ai fait le tour de ce filtre. Change de budget ou de catégorie ?",
      quickReplies: products.length
        ? ["Autre suggestion", "Voir la boutique", "Parler à un humain"]
        : ["Budget 25 000", ...categoryReplies(active)],
      products,
      prefs,
      whatsappHint: !products.length,
    };
  }

  // Guided shopping
  const wantsGuide =
    prefs.mode === "guide" ||
    /aide.?moi|choisir|conseille|idée|recommande|quoi acheter|guide|cadeau/.test(q) ||
    Boolean(prefs.budgetMax || prefs.categorie || prefs.genre || style);

  if (wantsGuide) {
    prefs = { ...prefs, mode: "guide" };

    if (style === "cadeau" && !prefs.genre && !prefs.categorie) {
      return {
        text: hello + "Un cadeau, parfait. Pour qui ? Et tu as un budget en tête ?",
        quickReplies: ["Pour elle · 15 000", "Pour lui · 25 000", "Budget 10 000", ...categoryReplies(active).slice(0, 1)],
        products: [],
        prefs,
        whatsappHint: false,
      };
    }

    if (!prefs.budgetMax && !prefs.budgetMin && !prefs.categorie) {
      return {
        text:
          hello +
          (ctx ? ctx + "\n\n" : "") +
          "Je te trouve les meilleures pièces. Quel budget max (FCFA) ?",
        quickReplies: ["Budget 10 000", "Budget 15 000", "Budget 25 000", "Budget 50 000"],
        products: [],
        prefs,
        whatsappHint: false,
      };
    }

    if (prefs.budgetMax && !prefs.categorie) {
      const fromStyle = styleCategorie(style, active);
      if (fromStyle) {
        prefs.categorie = fromStyle;
      } else {
        return {
          text: `${hello}Budget ≤ ${formatPrice(prefs.budgetMax)}. Tu cherches plutôt…`,
          quickReplies: categoryReplies(active),
          products: [],
          prefs,
          whatsappHint: false,
        };
      }
    }

    const products = await recommend(prefs, 4);
    if (!products.length) {
      return {
        text: `${hello}Rien en stock pour « ${prefsSummary(prefs)} ». On élargit le budget ou on change de catégorie ?`,
        quickReplies: ["Budget 25 000", "Budget 50 000", "Voir la boutique", "Parler à un humain"],
        products: [],
        prefs: { ...prefs, budgetMax: undefined, offset: 0 },
        whatsappHint: true,
      };
    }

    const styleNote = style ? ` Style ${style} pris en compte.` : "";
    return {
      text: `${hello}Voici ${products.length} idée(s) pour toi (${prefsSummary(prefs)}).${styleNote}\nTape sur une pièce, ou affine (ex. « homme », « bijoux », « 20k »).`,
      quickReplies: ["Autre suggestion", "Voir la boutique", "Livraison", "Parler à un humain"],
      products,
      prefs,
      whatsappHint: false,
    };
  }

  // Mots du catalogue sans mode guidé
  if (/montre|bijou|sac|lunette|chaussure|sandale|claquette|catalogue|produit|promo|acheter|commander|boutique/.test(q)) {
    const products = await recommend({ ...prefs, mode: "guide" }, 4);
    if (products.length) {
      return {
        text: `${hello}Voici ce que j’ai trouvé (${prefsSummary({ ...prefs, mode: "guide" })}). Tu peux préciser un budget pour affiner.`,
        quickReplies: ["Budget 15 000", "Autre suggestion", "Voir la boutique", "Livraison"],
        products,
        prefs: { ...prefs, mode: "guide" },
        whatsappHint: false,
      };
    }
  }

  return {
    text:
      hello +
      (ctx ? ctx + "\n\n" : "") +
      "Je peux te guider (budget + style), ou répondre sur livraison, paiement et commandes. Que veux-tu faire ?",
    quickReplies: CHAT_STARTERS,
    products: [],
    prefs,
    whatsappHint: true,
  };
}
