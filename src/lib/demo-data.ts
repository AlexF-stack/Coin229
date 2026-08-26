import type { Categorie, Genre, Product } from "@prisma/client";

/** Données de démo si la base n'est pas encore branchée */
export const DEMO_VENDOR_ID = "vendor_coin229_local";

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod_montre_aurora",
    vendorId: DEMO_VENDOR_ID,
    nom: "Montre Aurora Gold",
    description:
      "Cadran minimal, bracelet acier doré. Look premium pour soirées et contenus Insta.",
    categorie: "montre",
    genre: "femme",
    prix: 28000,
    prixPromo: 22900,
    stockQuantite: 12,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-01"),
  },
  {
    id: "prod_montre_noir",
    vendorId: DEMO_VENDOR_ID,
    nom: "Chrono Noir Mat",
    description:
      "Chronographe sport chic, finition mate. Pièce signature homme Coin229.",
    categorie: "montre",
    genre: "homme",
    prix: 32000,
    prixPromo: null,
    stockQuantite: 8,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1522312346375-d1a52e194b6a?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-05"),
  },
  {
    id: "prod_bijou_chain",
    vendorId: DEMO_VENDOR_ID,
    nom: "Chaîne Cubaine Argent",
    description:
      "Mailles cubaines brillantes — layering street / soirée. Unisexe.",
    categorie: "bijou",
    genre: "unisexe",
    prix: 18000,
    prixPromo: 14900,
    stockQuantite: 20,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-08"),
  },
  {
    id: "prod_bijou_creoles",
    vendorId: DEMO_VENDOR_ID,
    nom: "Créoles Rose Éclat",
    description: "Créoles saturées rose-doré. Accessoire viral TikTok-ready.",
    categorie: "bijou",
    genre: "femme",
    prix: 9500,
    prixPromo: null,
    stockQuantite: 0,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
    ],
    statut: "rupture",
    dateCreation: new Date("2026-08-10"),
  },
  {
    id: "prod_sac_mini",
    vendorId: DEMO_VENDOR_ID,
    nom: "Mini Bag Corail",
    description:
      "Petit sac structuré, couleur corail vive. Parfait pour sorties Cotonou.",
    categorie: "sac",
    genre: "femme",
    prix: 24500,
    prixPromo: 19900,
    stockQuantite: 6,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-12"),
  },
  {
    id: "prod_sac_cross",
    vendorId: DEMO_VENDOR_ID,
    nom: "Sacoche Cross Urban",
    description: "Bandoulière réglable, compartiments pratiques. Style quotidien.",
    categorie: "sac",
    genre: "homme",
    prix: 21000,
    prixPromo: null,
    stockQuantite: 15,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-15"),
  },
  {
    id: "prod_montre_mesh",
    vendorId: DEMO_VENDOR_ID,
    nom: "Mesh Silver Slim",
    description:
      "Bracelet mesh ultra fin, cadran argenté. Look clean pour le quotidien.",
    categorie: "montre",
    genre: "unisexe",
    prix: 19500,
    prixPromo: 16900,
    stockQuantite: 14,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-16"),
  },
  {
    id: "prod_bijou_bague",
    vendorId: DEMO_VENDOR_ID,
    nom: "Bague Statement Ambre",
    description: "Pièce signature ambre — layering ou solo. Touche premium.",
    categorie: "bijou",
    genre: "femme",
    prix: 12500,
    prixPromo: null,
    stockQuantite: 9,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-17"),
  },
  {
    id: "prod_sac_tote",
    vendorId: DEMO_VENDOR_ID,
    nom: "Tote Canvas Noir",
    description:
      "Grand tote pratique, toile résistante. Idéal campus / marchés Cotonou.",
    categorie: "sac",
    genre: "unisexe",
    prix: 16500,
    prixPromo: 13900,
    stockQuantite: 18,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-18"),
  },
  {
    id: "prod_montre_sport",
    vendorId: DEMO_VENDOR_ID,
    nom: "Sport Digital Ember",
    description: "Digital rétro avec accents ambre. Vibes TikTok street.",
    categorie: "montre",
    genre: "homme",
    prix: 14200,
    prixPromo: null,
    stockQuantite: 11,
    source: "local",
    images: [
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&q=80",
    ],
    statut: "actif",
    dateCreation: new Date("2026-08-19"),
  },
];

export function filterDemoProducts(filters?: {
  categorie?: Categorie;
  genre?: Genre;
  q?: string;
}) {
  const query = filters?.q?.trim().toLowerCase();
  return DEMO_PRODUCTS.filter((p) => {
    if (filters?.categorie && p.categorie !== filters.categorie) return false;
    if (filters?.genre && p.genre !== filters.genre) return false;
    if (query) {
      const hay = `${p.nom} ${p.description} ${p.categorie}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return p.statut === "actif" || p.statut === "rupture";
  });
}
