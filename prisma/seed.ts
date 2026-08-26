import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendor.upsert({
    where: { id: "vendor_coin229_local" },
    update: {
      nomBoutique: "Coin229 Boutique",
      contact: "+22990000000",
      statut: "actif",
    },
    create: {
      id: "vendor_coin229_local",
      nomBoutique: "Coin229 Boutique",
      contact: "+22990000000",
      statut: "actif",
    },
  });

  const products = [
    {
      id: "prod_montre_aurora",
      nom: "Montre Aurora Gold",
      description:
        "Cadran minimal, bracelet acier doré. Look premium pour soirées et contenus Insta.",
      categorie: "montre" as const,
      genre: "femme" as const,
      prix: 28000,
      prixPromo: 22900,
      stockQuantite: 12,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
      ],
    },
    {
      id: "prod_montre_noir",
      nom: "Chrono Noir Mat",
      description:
        "Chronographe sport chic, finition mate. Pièce signature homme Coin229.",
      categorie: "montre" as const,
      genre: "homme" as const,
      prix: 32000,
      prixPromo: null as number | null,
      stockQuantite: 8,
      images: [
        "https://images.unsplash.com/photo-1522312346375-d1a52e194b6a?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_chain",
      nom: "Chaîne Cubaine Argent",
      description:
        "Mailles cubaines brillantes — layering street / soirée. Unisexe.",
      categorie: "bijou" as const,
      genre: "unisexe" as const,
      prix: 18000,
      prixPromo: 14900,
      stockQuantite: 20,
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_creoles",
      nom: "Créoles Rose Éclat",
      description:
        "Créoles saturées rose-doré. Accessoire viral TikTok-ready.",
      categorie: "bijou" as const,
      genre: "femme" as const,
      prix: 9500,
      prixPromo: null,
      stockQuantite: 0,
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      ],
      statut: "rupture" as const,
    },
    {
      id: "prod_sac_mini",
      nom: "Mini Bag Corail",
      description:
        "Petit sac structuré, couleur corail vive. Parfait pour sorties Cotonou.",
      categorie: "sac" as const,
      genre: "femme" as const,
      prix: 24500,
      prixPromo: 19900,
      stockQuantite: 6,
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
      ],
    },
    {
      id: "prod_sac_cross",
      nom: "Sacoche Cross Urban",
      description:
        "Bandoulière réglable, compartiments pratiques. Style quotidien.",
      categorie: "sac" as const,
      genre: "homme" as const,
      prix: 21000,
      prixPromo: null,
      stockQuantite: 15,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      ],
    },
    {
      id: "prod_montre_mesh",
      nom: "Mesh Silver Slim",
      description:
        "Bracelet mesh ultra fin, cadran argenté. Look clean pour le quotidien.",
      categorie: "montre" as const,
      genre: "unisexe" as const,
      prix: 19500,
      prixPromo: 16900,
      stockQuantite: 14,
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_bague",
      nom: "Bague Statement Ambre",
      description: "Pièce signature ambre — layering ou solo. Touche premium.",
      categorie: "bijou" as const,
      genre: "femme" as const,
      prix: 12500,
      prixPromo: null,
      stockQuantite: 9,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
      ],
    },
    {
      id: "prod_sac_tote",
      nom: "Tote Canvas Noir",
      description:
        "Grand tote pratique, toile résistante. Idéal campus / marchés Cotonou.",
      categorie: "sac" as const,
      genre: "unisexe" as const,
      prix: 16500,
      prixPromo: 13900,
      stockQuantite: 18,
      images: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
      ],
    },
    {
      id: "prod_montre_sport",
      nom: "Sport Digital Ember",
      description: "Digital rétro avec accents ambre. Vibes TikTok street.",
      categorie: "montre" as const,
      genre: "homme" as const,
      prix: 14200,
      prixPromo: null,
      stockQuantite: 11,
      images: [
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&q=80",
      ],
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        nom: p.nom,
        description: p.description,
        categorie: p.categorie,
        genre: p.genre,
        prix: p.prix,
        prixPromo: p.prixPromo,
        stockQuantite: p.stockQuantite,
        images: p.images,
        source: "local",
        statut: "statut" in p && p.statut ? p.statut : p.stockQuantite > 0 ? "actif" : "rupture",
        vendorId: vendor.id,
      },
      create: {
        id: p.id,
        vendorId: vendor.id,
        nom: p.nom,
        description: p.description,
        categorie: p.categorie,
        genre: p.genre,
        prix: p.prix,
        prixPromo: p.prixPromo,
        stockQuantite: p.stockQuantite,
        images: p.images,
        source: "local",
        statut: "statut" in p && p.statut ? p.statut : p.stockQuantite > 0 ? "actif" : "rupture",
      },
    });
  }

  await prisma.appConfig.upsert({
    where: { cle: "FREE_SHIPPING_THRESHOLD" },
    update: { valeur: process.env.FREE_SHIPPING_THRESHOLD ?? "25000" },
    create: {
      cle: "FREE_SHIPPING_THRESHOLD",
      valeur: process.env.FREE_SHIPPING_THRESHOLD ?? "25000",
    },
  });

  console.log(`Seed OK — vendeur ${vendor.nomBoutique}, ${products.length} produits`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
