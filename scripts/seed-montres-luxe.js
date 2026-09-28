const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = "/uploads/montres-luxe";
const img = (n) => `${BASE}/montre-${String(n).padStart(2, "0")}.jpg`;

const PRODUCTS = [
  {
    nom: "AP Royal Oak Iced Out — set complet",
    description:
      "Montre Audemars Piguet style Royal Oak entièrement pavée. Livrée avec boîte bois, certificat, sac, et testeur diamants visible sur les photos. Unisexe.",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 185000,
    prixPromo: 165000,
    stockQuantite: 2,
    images: [img(1), img(2), img(3), img(5)],
  },
  {
    nom: "AP Royal Oak Iced Out + bracelet trèfle",
    description:
      "Montre AP iced out argent + bracelet pavé motifs trèfle. Boîte mahogany, certificat d’origine et hangtag.",
    niche: "montre luxe",
    genre: "femme",
    prix: 195000,
    prixPromo: 175000,
    stockQuantite: 1,
    images: [img(4)],
  },
  {
    nom: "AP Royal Oak Emeraude Full Pavé",
    description:
      "Montre AP Royal Oak entièrement sertie de pierres vertes. Photos avec boîte, certificat et Diamond Selector II.",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 210000,
    prixPromo: 189000,
    stockQuantite: 2,
    images: [img(6), img(13)],
  },
  {
    nom: "Patek Nautilus Vert & Or Rose + bracelet",
    description:
      "Montre Patek Philippe style Nautilus — cadran vert scintillant, bezel baguette, or rose, bracelet assorti. Présentation gant noir.",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 220000,
    prixPromo: 199000,
    stockQuantite: 1,
    images: [img(7)],
  },
  {
    nom: "Patek Philippe Or Rose Full Bagette",
    description:
      "Montre Patek Philippe or rose, cadran sombre, bezel et bracelet baguettes. Photo studio fond noir.",
    niche: "montre luxe",
    genre: "homme",
    prix: 215000,
    prixPromo: null,
    stockQuantite: 1,
    images: [img(8)],
  },
  {
    nom: "Patek Or Rose + bracelet infinity",
    description:
      "Set Patek Philippe or rose iced out avec bracelet maillons infinity assorti.",
    niche: "montre luxe",
    genre: "femme",
    prix: 230000,
    prixPromo: 205000,
    stockQuantite: 1,
    images: [img(9)],
  },
  {
    nom: "AP Royal Oak Silver Pavé + bracelet",
    description:
      "Montre AP Royal Oak full pavé argent + bracelet infinity diamants. Vue détail et boîte.",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 200000,
    prixPromo: 179000,
    stockQuantite: 2,
    images: [img(10), img(11), img(12)],
  },
];

async function main() {
  // Vendeur métier montres (hors admin / coin229 plateforme).
  let vendor =
    (process.env.COIN229_VENDOR_ID
      ? await prisma.vendor.findUnique({
          where: { id: process.env.COIN229_VENDOR_ID.trim() },
        })
      : null) ||
    (await prisma.vendor.findFirst({ where: { slug: "atelier-montres" } })) ||
    (await prisma.vendor.findFirst({ where: { id: "vendor_atelier_montres" } }));
  if (!vendor) throw new Error("Vendeur Atelier Montres introuvable — lancer scripts/assign-vendor-catalog.js");

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { statut: "actif" },
  });

  // Nettoyer anciens produits « montre luxe » de ce vendeur (re-seed propre)
  const old = await prisma.product.findMany({
    where: { vendorId: vendor.id, niche: "montre luxe" },
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
        categorie: "montre",
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
        boutique: vendor.nomBoutique,
        created: PRODUCTS.length,
        store: `https://coin229.vercel.app/vendeur/${vendor.slug || "coin229"}`,
        boutiqueUrl: "https://coin229.vercel.app/boutique?niche=montre%20luxe",
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
