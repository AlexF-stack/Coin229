/**
 * Deux vendeurs métier (hors admin / coin229 plateforme) :
 * - atelier-montres → montres + bijoux
 * - maison-chaussures → chaussures / sandales
 */
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

const PASS_MONTRES = process.env.VENDOR_MONTRES_PASSWORD || "Montres229!";
const PASS_CHAUSSURES =
  process.env.VENDOR_CHAUSSURES_PASSWORD || "Chaussures229!";

function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function upsertVendor({
  id,
  slug,
  nomBoutique,
  email,
  contact,
  description,
  password,
}) {
  const passwordHash = hashPassword(password);
  return prisma.vendor.upsert({
    where: { id },
    update: {
      nomBoutique,
      slug,
      email,
      contact,
      description,
      passwordHash,
      statut: "actif",
    },
    create: {
      id,
      nomBoutique,
      slug,
      email,
      contact,
      description,
      passwordHash,
      statut: "actif",
    },
  });
}

async function main() {
  const montres = await upsertVendor({
    id: "vendor_atelier_montres",
    slug: "atelier-montres",
    nomBoutique: "Atelier Montres",
    email: "montres@coin229.bj",
    contact: "+22991000001",
    description:
      "Montres et bijoux sélectionnés — vitrine indépendante sur Coin229.",
    password: PASS_MONTRES,
  });

  const chaussures = await upsertVendor({
    id: "vendor_maison_chaussures",
    slug: "maison-chaussures",
    nomBoutique: "Maison Chaussures",
    email: "chaussures@coin229.bj",
    contact: "+22991000002",
    description:
      "Sandales et chaussures — vitrine indépendante sur Coin229.",
    password: PASS_CHAUSSURES,
  });

  const movedMontres = await prisma.product.updateMany({
    where: {
      categorie: { in: ["montre", "bijou"] },
      vendorId: { not: montres.id },
    },
    data: { vendorId: montres.id },
  });

  const movedChaussures = await prisma.product.updateMany({
    where: {
      categorie: "chaussure",
      vendorId: { not: chaussures.id },
    },
    data: { vendorId: chaussures.id },
  });

  // Conversations liées à un produit : aligner le vendeur
  const products = await prisma.product.findMany({
    where: {
      vendorId: { in: [montres.id, chaussures.id] },
    },
    select: { id: true, vendorId: true },
  });
  for (const p of products) {
    await prisma.conversation.updateMany({
      where: { productId: p.id, vendorId: { not: p.vendorId } },
      data: { vendorId: p.vendorId },
    });
  }

  const counts = await prisma.product.groupBy({
    by: ["vendorId", "categorie"],
    _count: true,
  });

  const vendors = await prisma.vendor.findMany({
    where: {
      id: {
        in: [montres.id, chaussures.id, "vendor_coin229_local"],
      },
    },
    select: {
      id: true,
      slug: true,
      nomBoutique: true,
      email: true,
      _count: { select: { products: true } },
    },
  });

  console.log(
    JSON.stringify(
      {
        movedMontres: movedMontres.count,
        movedChaussures: movedChaussures.count,
        vendors,
        counts,
        login: [
          {
            email: montres.email,
            password: PASS_MONTRES,
            espace: "https://coin229.vercel.app/vendeur/login",
            vitrine: `https://coin229.vercel.app/vendeur/${montres.slug}`,
          },
          {
            email: chaussures.email,
            password: PASS_CHAUSSURES,
            espace: "https://coin229.vercel.app/vendeur/login",
            vitrine: `https://coin229.vercel.app/vendeur/${chaussures.slug}`,
          },
        ],
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
  .finally(async () => {
    await prisma.$disconnect();
  });
