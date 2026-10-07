"use server";

import { revalidatePath } from "next/cache";
import type {
  Genre,
  OrderStatus,
  ProductSource,
  ProductStatus,
} from "@prisma/client";
import { requireVendor } from "@/lib/assert-vendor";
import { prisma } from "@/lib/prisma";
import { changeOrderStatus } from "@/lib/order-status";
import { nicheToCategorie } from "@/lib/vendor-auth";
import { getMarketplaceCommissionPct } from "@/lib/marketplace-finance";

export async function getMyVendorProfile() {
  const session = await requireVendor();
  return prisma.vendor.findUnique({
    where: { id: session.vendorId },
  });
}

export async function getMyVendorUnreadCount() {
  const { vendorId } = await requireVendor();
  const rows = await prisma.conversation.findMany({
    where: { vendorId, vendorUnread: { gt: 0 } },
    select: { vendorUnread: true },
  });
  return rows.reduce((s, r) => s + r.vendorUnread, 0);
}

export async function getMyVendorProducts() {
  const { vendorId } = await requireVendor();
  return prisma.product.findMany({
    where: { vendorId },
    orderBy: { dateCreation: "desc" },
  });
}

export async function getMyVendorOrders() {
  const { vendorId } = await requireVendor();
  return prisma.order.findMany({
    where: { vendorId },
    include: {
      items: { include: { product: true } },
      client: true,
    },
    orderBy: { dateCreation: "desc" },
  });
}

export async function getMyVendorStats() {
  const { vendorId } = await requireVendor();
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ where: { vendorId } }),
    prisma.order.findMany({ where: { vendorId } }),
  ]);
  const enAttente = orders.filter((o) => o.statut === "en_attente").length;
  const stockBas = products.filter(
    (p) => p.stockQuantite > 0 && p.stockQuantite <= 5
  ).length;
  const ca = orders
    .filter((o) => o.statut !== "annulee")
    .reduce((s, o) => s + o.montantTotal, 0);
  return {
    productCount: products.length,
    orderCount: orders.length,
    enAttente,
    stockBas,
    ca,
  };
}

export async function getMyVendorFinances() {
  const { vendorId } = await requireVendor();
  const commissionPct = await getMarketplaceCommissionPct();
  const orders = await prisma.order.findMany({
    where: { vendorId, statut: { not: "annulee" } },
    orderBy: { dateCreation: "desc" },
    take: 50,
  });
  const brut = orders.reduce(
    (s, o) => s + Math.max(0, o.montantTotal - o.fraisLivraison),
    0
  );
  const commission = orders.reduce((s, o) => s + o.commissionAmount, 0);
  const net = orders.reduce((s, o) => s + o.vendorNet, 0);
  const pendingPayout = orders
    .filter(
      (o) =>
        !o.payoutId &&
        (o.statut === "livree" || o.statut === "confirmee" || o.statut === "en_livraison")
    )
    .reduce((s, o) => s + o.vendorNet, 0);
  const payouts = await prisma.vendorPayout.findMany({
    where: { vendorId },
    orderBy: { dateCreation: "desc" },
    take: 20,
  });
  return {
    commissionPct,
    brut,
    commission,
    net,
    pendingPayout,
    orders,
    payouts,
  };
}

export async function upsertVendorProduct(data: {
  id?: string;
  nom: string;
  description: string;
  niche: string;
  genre: Genre;
  prix: number;
  prixPromo?: number | null;
  stockQuantite: number;
  source?: ProductSource;
  images: string[];
  statut: ProductStatus;
}) {
  const { vendorId, statut: vendorStatut } = await requireVendor();
  if (vendorStatut === "suspendu") {
    return { success: false as const, error: "Compte suspendu" };
  }

  const niche = data.niche.trim().slice(0, 80);
  const allowed = [
    "montre luxe",
    "montre",
    "bijou",
    "sandale luxe",
    "sandale",
    "sac",
    "lunette",
  ];
  if (!niche || !allowed.includes(niche)) {
    return { success: false as const, error: "Choisis une niche dans la liste" };
  }
  const categorie = nicheToCategorie(niche);

  // Compte non actif : produits en archive (modération à l’activation)
  let statut: ProductStatus =
    data.stockQuantite <= 0 ? "rupture" : data.statut;
  if (vendorStatut === "en_attente" && statut === "actif") {
    statut = "archive";
  }

  if (data.images.length === 0) {
    return {
      success: false as const,
      error: "Ajoute au moins une photo",
    };
  }
  const images = data.images.slice(0, 8);

  if (data.id) {
    const existing = await prisma.product.findFirst({
      where: { id: data.id, vendorId },
    });
    if (!existing) {
      return { success: false as const, error: "Produit introuvable" };
    }
    await prisma.product.update({
      where: { id: data.id },
      data: {
        nom: data.nom,
        description: data.description,
        niche,
        categorie,
        genre: data.genre,
        prix: data.prix,
        prixPromo: data.prixPromo,
        stockQuantite: data.stockQuantite,
        source: data.source ?? "local",
        images,
        statut,
      },
    });
  } else {
    await prisma.product.create({
      data: {
        vendorId,
        nom: data.nom,
        description: data.description,
        niche,
        categorie,
        genre: data.genre,
        prix: data.prix,
        prixPromo: data.prixPromo,
        stockQuantite: data.stockQuantite,
        source: data.source ?? "local",
        images,
        statut,
      },
    });
  }

  revalidatePath("/vendeur/espace");
  revalidatePath("/vendeur/espace/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: true as const };
}

export async function updateMyOrderStatus(
  orderId: string,
  statut: OrderStatus
) {
  const { vendorId } = await requireVendor();
  // Transitions contrôlées (src/lib/order-status-rules.ts)
  const result = await changeOrderStatus({
    orderId,
    to: statut,
    actor: "vendor",
    vendorId,
  });
  if (!result.success) return result;

  revalidatePath("/vendeur/espace/commandes");
  revalidatePath("/vendeur/espace");
  revalidatePath("/compte");
  revalidatePath("/admin");
  return { success: true as const };
}

export async function updateMyVendorProfile(data: {
  description?: string;
  logoUrl?: string | null;
  contact?: string;
  ifu?: string | null;
  rccm?: string | null;
  mobileMoney?: string | null;
  acceptTerms?: boolean;
}) {
  const { vendorId } = await requireVendor();
  await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      ...(data.description !== undefined
        ? { description: data.description.trim().slice(0, 500) || null }
        : {}),
      ...(data.logoUrl !== undefined
        ? { logoUrl: data.logoUrl?.trim() || null }
        : {}),
      ...(data.contact !== undefined
        ? { contact: data.contact.trim().slice(0, 40) }
        : {}),
      ...(data.ifu !== undefined
        ? { ifu: data.ifu?.trim().slice(0, 60) || null }
        : {}),
      ...(data.rccm !== undefined
        ? { rccm: data.rccm?.trim().slice(0, 60) || null }
        : {}),
      ...(data.mobileMoney !== undefined
        ? { mobileMoney: data.mobileMoney?.trim().slice(0, 40) || null }
        : {}),
      ...(data.acceptTerms
        ? { termsAcceptedAt: new Date() }
        : {}),
    },
  });
  revalidatePath("/vendeur/espace");
  revalidatePath("/vendeur/espace/profil");
  revalidatePath("/vendeur");
  return { success: true as const };
}
