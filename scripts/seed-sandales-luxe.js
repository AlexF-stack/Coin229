const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = "/uploads/sandales-luxe";
const img = (n) => `${BASE}/sandale-${String(n).padStart(2, "0")}.jpg`;

const PRODUCTS = [
  {
    nom: "Hermès Izmir — sandales H croisées noires",
    description:
      "Sandales croisées noires texture embossée, logo H argenté et marquage HERMÈS PARIS doré sur la semelle. Photos plage / rochers.",
    niche: "sandale luxe",
    genre: "homme",
    prix: 65000,
    prixPromo: 58000,
    stockQuantite: 3,
    images: [img(1), img(5), img(13)],
  },
  {
    nom: "Hermès Chypre — sandales H noires",
    description:
      "Sandales Chypre noires, bride H découpée et sangle réglable. Vue tenue en main + photo studio fond blanc.",
    niche: "sandale luxe",
    genre: "unisexe",
    prix: 72000,
    prixPromo: 65000,
    stockQuantite: 2,
    images: [img(10), img(11)],
  },
  {
    nom: "Dior — claquettes CD cuir grainé brun",
    description:
      "Claquettes Dior brun chocolat, logo CD en relief, semelle épaisse. Vues plage.",
    niche: "sandale luxe",
    genre: "homme",
    prix: 55000,
    prixPromo: 49000,
    stockQuantite: 2,
    images: [img(3), img(9)],
  },
  {
    nom: "Timberland — claquette moulée olive",
    description:
      "Claquette Timberland olive, logo arbre métallique, semelle noire crantée. Photo profil tenue en main.",
    niche: "sandale",
    genre: "homme",
    prix: 32000,
    prixPromo: null,
    stockQuantite: 4,
    images: [img(2)],
  },
  {
    nom: "Timberland — slides olive pointure 45",
    description:
      "Paire Timberland olive / noir, pointure 45 (étiquette visible). Marquage doré sur semelle.",
    niche: "sandale",
    genre: "homme",
    prix: 38000,
    prixPromo: 34000,
    stockQuantite: 1,
    images: [img(4)],
  },
  {
    nom: "Timberland — double bride olive pointure 43",
    description:
      "Slides Timberland olive, doubles brides + pastilles logo, pointure 43. Neuf avec stuffing.",
    niche: "sandale",
    genre: "homme",
    prix: 38000,
    prixPromo: 34000,
    stockQuantite: 2,
    images: [img(8)],
  },
  {
    nom: "Pedro — slides olive boucle argent pointure 43",
    description:
      "Slides PEDRO olive / moutarde, brides croisées, boucle argentée, pointure 43.",
    niche: "sandale",
    genre: "homme",
    prix: 28000,
    prixPromo: 25000,
    stockQuantite: 2,
    images: [img(7), img(6)],
  },
  {
    nom: "Pedro — sandales plateforme camel",
    description:
      "Sandales PEDRO plateforme camel / blanc, bride large et boucle gunmetal. Neuf avec inserts mousse.",
    niche: "sandale",
    genre: "unisexe",
    prix: 30000,
    prixPromo: null,
    stockQuantite: 2,
    images: [img(16)],
  },
  {
    nom: "Zara — slides noires ornement or",
    description:
      "Slides ZARA noires croisées, accent métallique doré, semelle chunky. Photos studio.",
    niche: "sandale",
    genre: "unisexe",
    prix: 22000,
    prixPromo: 19000,
    stockQuantite: 3,
    images: [img(12), img(15)],
  },
  {
    nom: "GO ZERO — slides grises made in Netherlands",
    description:
      "Slides GO ZERO grises texture honeycomb, logo triangulaire argenté, semelle zigzag noire. Code 016—5 / 60.",
    niche: "sandale",
    genre: "homme",
    prix: 26000,
    prixPromo: null,
    stockQuantite: 2,
    images: [img(14)],
  },
];

async function main() {
  // Vendeur métier chaussures (hors admin / coin229 plateforme).
  let vendor =
    (process.env.COIN229_VENDOR_ID
      ? await prisma.vendor.findUnique({
          where: { id: process.env.COIN229_VENDOR_ID.trim() },
        })
      : null) ||
    (await prisma.vendor.findFirst({ where: { slug: "maison-chaussures" } })) ||
    (await prisma.vendor.findFirst({
      where: { id: "vendor_maison_chaussures" },
    }));
  if (!vendor)
    throw new Error(
      "Vendeur Maison Chaussures introuvable — lancer scripts/assign-vendor-catalog.js"
    );

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { statut: "actif" },
  });

  const old = await prisma.product.findMany({
    where: {
      vendorId: vendor.id,
      OR: [
        { niche: { equals: "sandale", mode: "insensitive" } },
        { niche: { equals: "sandale luxe", mode: "insensitive" } },
        { categorie: "chaussure" },
      ],
    },
    select: { id: true },
  });
  if (old.length) {
    const ids = old.map((p) => p.id);
    await prisma.orderItem.deleteMany({ where: { productId: { in: ids } } });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  }

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        vendorId: vendor.id,
        nom: p.nom,
        description: p.description,
        categorie: "chaussure",
        niche: p.niche,
        genre: p.genre,
        prix: p.prix,
        prixPromo: p.prixPromo,
        stockQuantite: p.stockQuantite,
        source: "local",
        images: p.images,
        statut: "actif",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        vendorId: vendor.id,
        slug: vendor.slug,
        created: PRODUCTS.length,
        store: `https://coin229.vercel.app/vendeur/${vendor.slug || "coin229"}`,
        boutiqueUrl: "https://coin229.vercel.app/boutique?categorie=chaussure",
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
