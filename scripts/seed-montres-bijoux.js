const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BASE = "/uploads/montres-bijoux";
const img = (n) => `${BASE}/mb-${String(n).padStart(2, "0")}.jpg`;

/** @type {Array<{nom:string,description:string,categorie:'montre'|'bijou',niche:string,genre:string,prix:number,prixPromo:number|null,stockQuantite:number,images:string[]}>} */
const PRODUCTS = [
  {
    nom: "Montre or rose — cadran chocolat, bracelet souple",
    description:
      "Or rose, lunette cannelée, cadran chocolat, bracelet souple. Set complet boîte verte, papiers et bracelet trèfle pavé (photos).",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 245000,
    prixPromo: 219000,
    stockQuantite: 2,
    images: [img(1), img(3), img(7)],
  },
  {
    nom: "Montre or — cadran noir chronographe",
    description:
      "Chronographe or et noir, tachymètre, bracelet souple. Full set boîte, étiquette, certificat et bracelet cordon.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 260000,
    prixPromo: 235000,
    stockQuantite: 1,
    images: [img(2), img(4)],
  },
  {
    nom: "Montre or — cadran bleu complications",
    description:
      "Or, cadran bleu, calendrier et cœur ouvert, bracelet intégré. Présentation boîte et carte.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 275000,
    prixPromo: 249000,
    stockQuantite: 1,
    images: [img(5), img(11)],
  },
  {
    nom: "Montre acier — cadran bleu, cœur ouvert",
    description:
      "Acier, cadran bleu avec ouverture mouvement. Photo studio avec boîte.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 230000,
    prixPromo: 210000,
    stockQuantite: 1,
    images: [img(6)],
  },
  {
    nom: "Montre acier — cadran bleu",
    description:
      "Acier, cadran bleu rainuré, date à 3h. Full set boîte bois, carte et pochette.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 225000,
    prixPromo: 205000,
    stockQuantite: 2,
    images: [img(10), img(14)],
  },
  {
    nom: "Montre chronographe — cadran noir",
    description:
      "Chronographe, cadran noir à grille, bracelet souple. Présentation gant et boîte.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 255000,
    prixPromo: 229000,
    stockQuantite: 1,
    images: [img(25)],
  },
  {
    nom: "Montre chronographe — cadran bleu",
    description:
      "Chronographe, cadran bleu. Photo détail.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 255000,
    prixPromo: null,
    stockQuantite: 1,
    images: [img(28)],
  },
  {
    nom: "Montre chronographe — beige",
    description:
      "Chronographe, cadran et bracelet beige. Photo détail.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 255000,
    prixPromo: null,
    stockQuantite: 1,
    images: [img(27)],
  },
  {
    nom: "Montre bleue — lunette sertie",
    description:
      "Cadran bleu, lunette sertie, bracelet souple. Full set boîte, pochette et documents.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "femme",
    prix: 285000,
    prixPromo: 259000,
    stockQuantite: 1,
    images: [img(30), img(24)],
  },
  {
    nom: "Hublot Big Bang Chrono — cuir brun",
    description:
      "Big Bang chronographe, cadran sombre, bracelet cuir brun. Full set.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 195000,
    prixPromo: 175000,
    stockQuantite: 1,
    images: [img(8)],
  },
  {
    nom: "Hublot Classic Fusion Chrono + bracelet ancre",
    description:
      "Classic Fusion chronographe argent + bracelet ancre assorti. Full set.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 185000,
    prixPromo: 165000,
    stockQuantite: 1,
    images: [img(9)],
  },
  {
    nom: "Cartier Santos — cadran bleu acier",
    description:
      "Santos acier, cadran bleu chiffres romains. Boîte rouge + set (sac, garantie) selon photos.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 175000,
    prixPromo: 159000,
    stockQuantite: 2,
    images: [img(13), img(40), img(41), img(43), img(16)],
  },
  {
    nom: "Cartier Santos Chrono — or",
    description:
      "Santos chronographe or, cadran blanc, papiers et boîte rouge.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 210000,
    prixPromo: 189000,
    stockQuantite: 1,
    images: [img(36)],
  },
  {
    nom: "Cartier Santos Chrono — noir mat",
    description:
      "Santos chronographe noir mat, cadran blanc, + bracelet cordon Fred. Boîte rouge.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "homme",
    prix: 205000,
    prixPromo: 185000,
    stockQuantite: 1,
    images: [img(37), img(45)],
  },
  {
    nom: "Cartier Tank — bracelet cuir bleu",
    description:
      "Tank rectangulaire, cadran blanc romains, bracelet cuir bleu marine. Full set Cartier rouge.",
    categorie: "montre",
    niche: "montre luxe",
    genre: "unisexe",
    prix: 165000,
    prixPromo: 149000,
    stockQuantite: 1,
    images: [img(34)],
  },
  {
    nom: "Tissot PRX — noir cadran menthe",
    description:
      "PRX noir PVD, cadran waffle menthe, full set boîte + sac + bracelet cordon.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 85000,
    prixPromo: 75000,
    stockQuantite: 2,
    images: [img(20)],
  },
  {
    nom: "Tissot PRX Chrono — vert + cordon",
    description:
      "PRX Chronographe vert, full set avec cordon assorti.",
    categorie: "montre",
    niche: "montre",
    genre: "homme",
    prix: 95000,
    prixPromo: 85000,
    stockQuantite: 1,
    images: [img(18)],
  },
  {
    nom: "Tissot PRX Chrono — bicolore panda",
    description:
      "PRX Chrono two-tone, cadran panda. Full set boîte Tissot.",
    categorie: "montre",
    niche: "montre",
    genre: "homme",
    prix: 98000,
    prixPromo: 88000,
    stockQuantite: 2,
    images: [img(17), img(22)],
  },
  {
    nom: "Tissot PRX — blanc bezel or",
    description:
      "PRX waffle blanc, bezel or, full set.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 90000,
    prixPromo: 80000,
    stockQuantite: 1,
    images: [img(21)],
  },
  {
    nom: "Tissot Chrono — bicolore or/acier",
    description:
      "Chronographe Tissot bicolore, cadran blanc, boîte noire/rouge + garantie 2 ans.",
    categorie: "montre",
    niche: "montre",
    genre: "homme",
    prix: 92000,
    prixPromo: null,
    stockQuantite: 1,
    images: [img(42)],
  },
  {
    nom: "Casio — cadran teal bracelet noir",
    description:
      "Casio analog WR50M, cadran teal, bracelet noir. Set boîtes/sacs Casio (+ option bracelet Lacoste).",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 28000,
    prixPromo: 24000,
    stockQuantite: 3,
    images: [img(15), img(32)],
  },
  {
    nom: "Casio — cadran teal bracelet or",
    description:
      "Casio analog, cadran teal, boîtier/bracelet or. Set + bracelet Lacoste crocodile.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 30000,
    prixPromo: 26000,
    stockQuantite: 2,
    images: [img(12), img(31)],
  },
  {
    nom: "Casio Noir — set + bracelet crocodile",
    description:
      "Casio full black WR50M + bracelet chaîne crocodile. Présentation sacs Casio.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 27000,
    prixPromo: 23000,
    stockQuantite: 2,
    images: [img(33)],
  },
  {
    nom: "Casio — cadran noir bracelet argent",
    description:
      "Casio analog noir / argent WR50M. Full set emballage Casio.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 25000,
    prixPromo: null,
    stockQuantite: 3,
    images: [img(35), img(39)],
  },
  {
    nom: "Casio — bicolore cadran blanc",
    description:
      "Casio two-tone argent/or, cadran blanc WR50M. Full set.",
    categorie: "montre",
    niche: "montre",
    genre: "unisexe",
    prix: 28000,
    prixPromo: 25000,
    stockQuantite: 2,
    images: [img(19), img(29)],
  },
  {
    nom: "Poedagar — style PRX noir/argent",
    description:
      "Montre Poedagar style PRX, cadran noir, full set.",
    categorie: "montre",
    niche: "montre",
    genre: "homme",
    prix: 35000,
    prixPromo: 30000,
    stockQuantite: 2,
    images: [img(26)],
  },
  {
    nom: "Chaîne tennis — pendentif étoile iced",
    description:
      "Chaîne tennis + pendentif étoile pavé. Photo studio.",
    categorie: "bijou",
    niche: "bijou",
    genre: "unisexe",
    prix: 45000,
    prixPromo: 39000,
    stockQuantite: 2,
    images: [img(23)],
  },
  {
    nom: "Bracelet cordon shackle — khaki / noir",
    description:
      "Bracelet double cordon khaki, fermoir shackle noir. Boîte présentation.",
    categorie: "bijou",
    niche: "bijou",
    genre: "unisexe",
    prix: 18000,
    prixPromo: null,
    stockQuantite: 3,
    images: [img(38)],
  },
  {
    nom: "Lacoste — bracelet crocodile or",
    description:
      "Bracelet chaîne or + charm crocodile Lacoste. Set sac, boîte, pochette.",
    categorie: "bijou",
    niche: "bijou",
    genre: "unisexe",
    prix: 22000,
    prixPromo: 19000,
    stockQuantite: 2,
    images: [img(44)],
  },
  {
    nom: "Lacoste — set collier & bracelet argent/or",
    description:
      "Collier + bracelet Lacoste crocodile (argent / or). Packaging complet.",
    categorie: "bijou",
    niche: "bijou",
    genre: "unisexe",
    prix: 35000,
    prixPromo: 31000,
    stockQuantite: 2,
    images: [img(46)],
  },
  {
    nom: "Lacoste — set collier & bracelet noir",
    description:
      "Collier + bracelet Lacoste crocodile noir. Packaging complet.",
    categorie: "bijou",
    niche: "bijou",
    genre: "unisexe",
    prix: 35000,
    prixPromo: 31000,
    stockQuantite: 2,
    images: [img(47), img(48)],
  },
];

async function main() {
  // Vendeur métier montres / bijoux (hors admin / coin229 plateforme).
  let vendor =
    (process.env.COIN229_VENDOR_ID
      ? await prisma.vendor.findUnique({
          where: { id: process.env.COIN229_VENDOR_ID.trim() },
        })
      : null) ||
    (await prisma.vendor.findFirst({ where: { slug: "atelier-montres" } })) ||
    (await prisma.vendor.findFirst({ where: { id: "vendor_atelier_montres" } }));
  if (!vendor)
    throw new Error(
      "Vendeur Atelier Montres introuvable — lancer scripts/assign-vendor-catalog.js"
    );

  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { statut: "actif" },
  });

  // Re-seed propre : uniquement les produits de ce lot (chemins montres-bijoux)
  const existing = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    select: { id: true, images: true },
  });
  const toRemove = existing
    .filter((p) =>
      (p.images || []).some((u) => String(u).includes("/uploads/montres-bijoux/"))
    )
    .map((p) => p.id);
  if (toRemove.length) {
    await prisma.orderItem.deleteMany({ where: { productId: { in: toRemove } } });
    await prisma.product.deleteMany({ where: { id: { in: toRemove } } });
  }

  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        vendorId: vendor.id,
        nom: p.nom,
        description: p.description,
        categorie: p.categorie,
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

  const counts = await prisma.product.groupBy({
    by: ["categorie"],
    where: { vendorId: vendor.id, statut: "actif" },
    _count: true,
  });

  console.log(
    JSON.stringify(
      {
        vendorId: vendor.id,
        slug: vendor.slug,
        created: PRODUCTS.length,
        removedPreviousBatch: toRemove.length,
        byCategorie: counts,
        store: `https://coin229.vercel.app/vendeur/${vendor.slug || "coin229"}`,
        boutiqueMontres: "https://coin229.vercel.app/boutique?categorie=montre",
        boutiqueBijoux: "https://coin229.vercel.app/boutique?categorie=bijou",
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
