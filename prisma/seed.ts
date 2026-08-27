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
        "Créoles saturées rose-doré. Accessoire viral TikTok-ready — restock Cotonou.",
      categorie: "bijou" as const,
      genre: "femme" as const,
      prix: 9500,
      prixPromo: null,
      stockQuantite: 24,
      images: [
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      ],
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
    {
      id: "prod_lunette_aviator",
      nom: "Aviator Or Night",
      description:
        "Pilote doré, verres fumés. Look soirée Cotonou / clips Insta.",
      categorie: "lunette" as const,
      genre: "unisexe" as const,
      prix: 19500,
      prixPromo: 15900,
      stockQuantite: 14,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
      ],
    },
    {
      id: "prod_lunette_cat",
      nom: "Cat-Eye Rouge Soleil",
      description:
        "Monture cat-eye vive. Accessoire signature femmes — stock limité.",
      categorie: "lunette" as const,
      genre: "femme" as const,
      prix: 16800,
      prixPromo: null,
      stockQuantite: 10,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80",
      ],
    },
    {
      id: "prod_lunette_square",
      nom: "Square Noir Mat",
      description:
        "Carré mat anti-reflet. Street clean homme — résiste au soleil Atlantique.",
      categorie: "lunette" as const,
      genre: "homme" as const,
      prix: 17500,
      prixPromo: 14900,
      stockQuantite: 16,
      images: [
        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80",
      ],
    },
    {
      id: "prod_lunette_shield",
      nom: "Shield Noir Fidjrossè",
      description:
        "Masque oversized UV. Plage Fidjrossè, balades soleil, clips WhatsApp.",
      categorie: "lunette" as const,
      genre: "unisexe" as const,
      prix: 18900,
      prixPromo: 15500,
      stockQuantite: 18,
      images: [
        "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80",
      ],
    },
    {
      id: "prod_lunette_clear",
      nom: "Clear Frame Urban",
      description:
        "Monture transparente tendance. Bureau, campus, look clean Cotonou.",
      categorie: "lunette" as const,
      genre: "femme" as const,
      prix: 16500,
      prixPromo: null,
      stockQuantite: 14,
      images: [
        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80",
      ],
    },
    {
      id: "prod_sac_banane",
      nom: "Banane Zip City",
      description:
        "Banane zip sécurisée. Mains libres en zémidjan — quotidien urbain.",
      categorie: "sac" as const,
      genre: "homme" as const,
      prix: 17900,
      prixPromo: 14900,
      stockQuantite: 20,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      ],
    },
    {
      id: "prod_sac_seau",
      nom: "Seau Soft Nude",
      description:
        "Sac seau soft nude. Sorties, église, événements — look premium accessible.",
      categorie: "sac" as const,
      genre: "femme" as const,
      prix: 22500,
      prixPromo: 18900,
      stockQuantite: 12,
      images: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_hoops",
      nom: "Hoops XL Or",
      description:
        "Créoles XXL dorées. Impulse gift / layering soirée — ticket bas.",
      categorie: "bijou" as const,
      genre: "femme" as const,
      prix: 11500,
      prixPromo: null,
      stockQuantite: 28,
      images: [
        "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_cauri",
      nom: "Bracelet Stack Cauri",
      description:
        "Stack perles & cauri. Identité locale soft + street unisexe.",
      categorie: "bijou" as const,
      genre: "unisexe" as const,
      prix: 9900,
      prixPromo: null,
      stockQuantite: 30,
      images: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      ],
    },
    {
      id: "prod_bijou_bar",
      nom: "Collier Bar Minimal",
      description:
        "Barre fine dorée. Quotidien layering — simple et photo-ready.",
      categorie: "bijou" as const,
      genre: "femme" as const,
      prix: 12900,
      prixPromo: 10900,
      stockQuantite: 22,
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      ],
    },
    {
      id: "prod_montre_recta",
      nom: "Recta Gold Slim",
      description:
        "Cadran rectangle doré slim. Signature soirée / Insta femme.",
      categorie: "montre" as const,
      genre: "femme" as const,
      prix: 24500,
      prixPromo: 19900,
      stockQuantite: 10,
      images: [
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
      ],
    },
  ];

  for (const p of products) {
    const statut =
      "statut" in p && typeof p.statut === "string"
        ? (p.statut as "actif" | "rupture" | "archive")
        : p.stockQuantite > 0
          ? ("actif" as const)
          : ("rupture" as const);

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
        statut,
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
        statut,
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
