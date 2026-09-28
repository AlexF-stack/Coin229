import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function requiredSecret(name: string) {
  const value = process.env[name]?.trim();
  if (!value || value.length < 8) {
    throw new Error(
      `${name} est obligatoire (8 caractères minimum). Aucun mot de passe par défaut.`
    );
  }
  return value;
}

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Seed minimal : plateforme + 2 vendeurs métier + config livraison.
 * Pas de catalogue fictif Unsplash — produits via espace vendeur / scripts métier.
 */
async function main() {
  const platform = await prisma.vendor.upsert({
    where: { id: "vendor_coin229_local" },
    update: {
      nomBoutique: "Coin229 Boutique",
      contact: "+22990000000",
      statut: "actif",
      slug: "coin229",
    },
    create: {
      id: "vendor_coin229_local",
      nomBoutique: "Coin229 Boutique",
      contact: "+22990000000",
      statut: "actif",
      slug: "coin229",
    },
  });

  const passMontres = requiredSecret("VENDOR_MONTRES_PASSWORD");
  const passChaussures = requiredSecret("VENDOR_CHAUSSURES_PASSWORD");

  async function ensureVendor(opts: {
    id: string;
    slug: string;
    nomBoutique: string;
    email: string;
    contact: string;
    description: string;
    password: string;
  }) {
    const existing = await prisma.vendor.findUnique({ where: { id: opts.id } });
    const passwordHash =
      existing?.passwordHash && existing.passwordHash.startsWith("scrypt$")
        ? existing.passwordHash
        : hashPassword(opts.password);
    return prisma.vendor.upsert({
      where: { id: opts.id },
      update: {
        nomBoutique: opts.nomBoutique,
        slug: opts.slug,
        contact: opts.contact,
        email: opts.email,
        statut: "actif",
        description: opts.description,
        ...(existing?.passwordHash ? {} : { passwordHash }),
      },
      create: {
        id: opts.id,
        nomBoutique: opts.nomBoutique,
        slug: opts.slug,
        contact: opts.contact,
        email: opts.email,
        statut: "actif",
        description: opts.description,
        passwordHash,
      },
    });
  }

  await ensureVendor({
    id: "vendor_atelier_montres",
    slug: "atelier-montres",
    nomBoutique: "Atelier Montres",
    email: "montres@coin229.bj",
    contact: "+22991000001",
    description:
      "Montres et bijoux sélectionnés — vitrine indépendante sur Coin229.",
    password: passMontres,
  });

  await ensureVendor({
    id: "vendor_maison_chaussures",
    slug: "maison-chaussures",
    nomBoutique: "Maison Chaussures",
    email: "chaussures@coin229.bj",
    contact: "+22991000002",
    description:
      "Sandales et chaussures — vitrine indépendante sur Coin229.",
    password: passChaussures,
  });

  const fake = await prisma.product.findMany({
    where: {
      OR: [
        { id: { startsWith: "prod_" } },
        { nom: { contains: "Démo", mode: "insensitive" } },
        { nom: { contains: "Demo", mode: "insensitive" } },
      ],
    },
    select: { id: true, images: true },
  });
  const unsplashIds = (
    await prisma.product.findMany({
      select: { id: true, images: true },
    })
  )
    .filter((p) => (p.images || []).some((u) => /unsplash\.com/i.test(u)))
    .map((p) => p.id);

  const ids = [...new Set([...fake.map((p) => p.id), ...unsplashIds])];
  if (ids.length) {
    await prisma.orderItem.deleteMany({ where: { productId: { in: ids } } });
    await prisma.conversation.updateMany({
      where: { productId: { in: ids } },
      data: { productId: null },
    });
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.appConfig.upsert({
    where: { cle: "FREE_SHIPPING_THRESHOLD" },
    update: { valeur: process.env.FREE_SHIPPING_THRESHOLD ?? "25000" },
    create: {
      cle: "FREE_SHIPPING_THRESHOLD",
      valeur: process.env.FREE_SHIPPING_THRESHOLD ?? "25000",
    },
  });

  await prisma.appConfig.upsert({
    where: { cle: "MARKETPLACE_COMMISSION_PCT" },
    update: {},
    create: {
      cle: "MARKETPLACE_COMMISSION_PCT",
      valeur: process.env.MARKETPLACE_COMMISSION_PCT ?? "10",
    },
  });

  const countMontres = await prisma.product.count({
    where: {
      vendorId: "vendor_atelier_montres",
      statut: { in: ["actif", "rupture"] },
    },
  });
  const countChaussures = await prisma.product.count({
    where: {
      vendorId: "vendor_maison_chaussures",
      statut: { in: ["actif", "rupture"] },
    },
  });
  console.log(
    `Seed OK — plateforme ${platform.nomBoutique}, Atelier Montres : ${countMontres}, Maison Chaussures : ${countChaussures}, faux retirés : ${ids.length}`
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
