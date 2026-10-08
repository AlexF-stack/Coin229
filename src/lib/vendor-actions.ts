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
import { categorieFromNiche } from "@/lib/constants";
import { changeOrderStatus } from "@/lib/order-status";
import { isAllowedImageUrl, parseProductInput } from "@/lib/product-schema";
import { getVendorFinanceSummary, SOLD_STATUSES } from "@/lib/payouts";
import { getMarketplaceCommissionPct } from "@/lib/marketplace-finance";

export async function getMyVendorProfile() {
  const session = await requireVendor();
  return prisma.vendor.findUnique({
    where: { id: session.vendorId },
  });
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
  // Ventes réelles hors frais de livraison (sans commandes impayées ni annulées)
  const ca = orders
    .filter((o) => SOLD_STATUSES.includes(o.statut))
    .reduce((s, o) => s + o.montantTotal - o.fraisLivraison, 0);
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
  // Totaux sur TOUTES les commandes vendues (pas seulement les 50 dernières),
  // avec la même règle de reversement que l'admin (src/lib/payouts.ts)
  const [summary, orders] = await Promise.all([
    getVendorFinanceSummary(vendorId),
    prisma.order.findMany({
      where: { vendorId, statut: { not: "annulee" } },
      orderBy: { dateCreation: "desc" },
      take: 50,
    }),
  ]);
  const { brut, commission, net, pendingPayout, inProgress } = summary;
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
    inProgress,
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
  // Validation serveur (prix entier positif, promo < prix, images autorisées…)
  const checked = parseProductInput(data);
  if (!checked.ok) return { success: false as const, error: checked.error };
  data = { ...data, ...checked.data };

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
  const categorie = categorieFromNiche(niche);

  // Compte non actif : produits en archive (modération à l’activation)
  let statut: ProductStatus =
    data.stockQuantite <= 0 ? "rupture" : data.statut;
  // Marqué « retenu par la modération » : remis en vente à l'activation du
  // vendeur (contrairement à un produit qu'il archive lui-même)
  const heldByModeration = vendorStatut === "en_attente" && statut === "actif";
  if (heldByModeration) {
    statut = "archive";
  }

  const images = data.images;

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
        heldByModeration,
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
        heldByModeration,
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
  // Logo affiché par next/image : seulement une source autorisée
  if (data.logoUrl?.trim() && !isAllowedImageUrl(data.logoUrl)) {
    return {
      success: false as const,
      error: "Logo non autorisé : envoie l’image depuis ton espace.",
    };
  }
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
