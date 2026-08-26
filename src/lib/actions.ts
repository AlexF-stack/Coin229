"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { processPayment } from "@/lib/payment";
import { calculateShippingFee } from "@/lib/shipping";
import { checkoutSchema } from "@/lib/checkout-schema";
import { requireAdmin } from "@/lib/assert-admin";
import { allowDemoCatalog } from "@/lib/runtime-flags";
import {
  normalizeBjPhone,
  phoneCookieName,
  readPhoneFromToken,
} from "@/lib/phone-session";
import type {
  Categorie,
  DeliveryZone,
  Genre,
  OrderStatus,
  PaymentMode,
  ProductSource,
  ProductStatus,
} from "@prisma/client";

export async function getProducts(filters?: {
  categorie?: Categorie;
  genre?: Genre;
}) {
  return prisma.product.findMany({
    where: {
      statut: { in: ["actif", "rupture"] },
      ...(filters?.categorie ? { categorie: filters.categorie } : {}),
      ...(filters?.genre ? { genre: filters.genre } : {}),
    },
    orderBy: { dateCreation: "desc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { vendor: true },
  });
}

export async function getSimilarProducts(
  productId: string,
  categorie: Categorie,
  limit = 4
) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      categorie,
      statut: "actif",
      stockQuantite: { gt: 0 },
    },
    take: limit,
    orderBy: { dateCreation: "desc" },
  });
}

type CheckoutItem = {
  productId: string;
  quantite: number;
};

export async function createOrder(input: {
  nom: string;
  telephone: string;
  adresse: string;
  zone: DeliveryZone;
  modePaiement: PaymentMode;
  items: CheckoutItem[];
}) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const data = parsed.data;
  const telephone = normalizeBjPhone(data.telephone);
  if (!telephone) {
    return { success: false as const, error: "Numéro invalide" };
  }

  let products;
  try {
    products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
    });
  } catch {
    if (allowDemoCatalog() && process.env.NODE_ENV !== "production") {
      const mockId = `demo_${Date.now()}`;
      const payment = await processPayment({
        orderId: mockId,
        amount: 0,
        mode: data.modePaiement,
        phone: telephone,
      });
      if (!payment.success) {
        return { success: false as const, error: payment.message };
      }
      return { success: true as const, orderId: mockId, payment };
    }
    return {
      success: false as const,
      error: "Service indisponible. Réessaie plus tard.",
    };
  }

  if (products.length !== data.items.length) {
    if (allowDemoCatalog() && process.env.NODE_ENV !== "production") {
      const { DEMO_PRODUCTS } = await import("@/lib/demo-data");
      const demoMatched = data.items.every((i) =>
        DEMO_PRODUCTS.some((p) => p.id === i.productId)
      );
      if (demoMatched) {
        const mockId = `demo_${Date.now()}`;
        const payment = await processPayment({
          orderId: mockId,
          amount: 0,
          mode: data.modePaiement,
          phone: telephone,
        });
        if (!payment.success) {
          return { success: false as const, error: payment.message };
        }
        return { success: true as const, orderId: mockId, payment };
      }
    }
    return { success: false as const, error: "Produit introuvable" };
  }

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.statut !== "actif" || product.stockQuantite < item.quantite) {
      return {
        success: false as const,
        error: `Stock insuffisant pour ${product.nom}`,
      };
    }
  }

  const vendorIds = new Set(products.map((p) => p.vendorId));
  if (vendorIds.size > 1) {
    return {
      success: false as const,
      error: "Panier multi-vendeurs non supporté pour l’instant.",
    };
  }
  const vendorId = products[0]!.vendorId;

  const lineItems = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const unit =
      product.prixPromo && product.prixPromo < product.prix
        ? product.prixPromo
        : product.prix;
    return {
      productId: product.id,
      quantite: item.quantite,
      prixUnitaireAuMomentCommande: unit,
      lineTotal: unit * item.quantite,
    };
  });

  const subtotal = lineItems.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = calculateShippingFee({ zone: data.zone, subtotal });
  const montantTotal = subtotal + shipping.fee;

  const existing = await prisma.client.findUnique({
    where: { telephone },
  });
  let clientId: string;
  if (existing) {
    clientId = existing.id;
    await prisma.client.update({
      where: { id: existing.id },
      data: { nom: data.nom },
    });
  } else {
    const created = await prisma.client.create({
      data: {
        nom: data.nom,
        telephone,
        adresses: {
          create: {
            zone: data.zone,
            adresseComplete: data.adresse,
            estPrincipale: true,
          },
        },
      },
    });
    clientId = created.id;
  }

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            statut: "actif",
            stockQuantite: { gte: item.quantite },
          },
          data: {
            stockQuantite: { decrement: item.quantite },
          },
        });
        if (updated.count !== 1) {
          throw new Error("STOCK");
        }
        const row = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (row && row.stockQuantite <= 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: { statut: "rupture", stockQuantite: 0 },
          });
        }
      }

      return tx.order.create({
        data: {
          clientId,
          vendorId,
          modePaiement: data.modePaiement,
          zoneLivraison: data.zone,
          fraisLivraison: shipping.fee,
          montantTotal,
          telephone,
          nomClient: data.nom,
          adresseLivraison: data.adresse,
          items: {
            create: lineItems.map((l) => ({
              productId: l.productId,
              quantite: l.quantite,
              prixUnitaireAuMomentCommande: l.prixUnitaireAuMomentCommande,
            })),
          },
        },
        include: { items: true },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK") {
      return {
        success: false as const,
        error: "Stock insuffisant — rafraîchis ton panier.",
      };
    }
    throw e;
  }

  const payment = await processPayment({
    orderId: order.id,
    amount: montantTotal,
    mode: data.modePaiement,
    phone: telephone,
  });

  if (!payment.success) {
    // Annule la commande si paiement échoue (MoMo non configuré)
    await prisma.order.update({
      where: { id: order.id },
      data: { statut: "annulee" },
    });
    // Restore stock best-effort
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantite: { increment: item.quantite },
          statut: "actif",
        },
      });
    }
    return { success: false as const, error: payment.message };
  }

  if (
    payment.status === "paid" &&
    data.modePaiement === "mobile_money"
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: { statut: "confirmee" },
    });
  }

  revalidatePath("/");
  revalidatePath("/compte");
  revalidatePath("/admin");

  return {
    success: true as const,
    orderId: order.id,
    payment,
  };
}

/** Commandes du compte connecté uniquement (cookie session téléphone). */
export async function getMyOrders() {
  const jar = await cookies();
  const phone = await readPhoneFromToken(
    jar.get(phoneCookieName())?.value
  );
  if (!phone) return null;

  try {
    return await prisma.client.findUnique({
      where: { telephone: phone },
      include: {
        orders: {
          include: {
            items: { include: { product: true } },
          },
          orderBy: { dateCreation: "desc" },
        },
        adresses: true,
      },
    });
  } catch {
    return null;
  }
}

/** @deprecated IDOR — ne plus utiliser ; préfère getMyOrders */
export async function getClientOrders(telephone: string) {
  const jar = await cookies();
  const sessionPhone = await readPhoneFromToken(
    jar.get(phoneCookieName())?.value
  );
  const normalized = normalizeBjPhone(telephone);
  if (!sessionPhone || !normalized || sessionPhone !== normalized) {
    return null;
  }
  return getMyOrders();
}

export async function getOrderForConfirmation(orderId: string) {
  if (!orderId || orderId.startsWith("demo_")) {
    return { demo: true as const, order: null };
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });
    return { demo: false as const, order };
  } catch {
    return { demo: false as const, order: null };
  }
}

/* ——— Admin / Vendor ——— */

export async function getVendorOrders(vendorId: string) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return prisma.order.findMany({
    where: { vendorId },
    include: {
      items: { include: { product: true } },
      client: true,
    },
    orderBy: { dateCreation: "desc" },
  });
}

export async function getVendorProducts(vendorId: string) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return prisma.product.findMany({
    where: { vendorId },
    orderBy: { dateCreation: "desc" },
  });
}

export async function updateOrderStatus(
  orderId: string,
  statut: OrderStatus,
  vendorId: string
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Non autorisé" };
  }
  const order = await prisma.order.findFirst({
    where: { id: orderId, vendorId },
  });
  if (!order) return { success: false, error: "Commande introuvable" };

  await prisma.order.update({
    where: { id: orderId },
    data: { statut },
  });
  revalidatePath("/admin");
  revalidatePath("/compte");
  return { success: true };
}

export async function upsertProduct(
  vendorId: string,
  data: {
    id?: string;
    nom: string;
    description: string;
    categorie: Categorie;
    genre: Genre;
    prix: number;
    prixPromo?: number | null;
    stockQuantite: number;
    source: ProductSource;
    images: string[];
    statut: ProductStatus;
  }
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Non autorisé" };
  }
  if (data.id) {
    const existing = await prisma.product.findFirst({
      where: { id: data.id, vendorId },
    });
    if (!existing) return { success: false, error: "Produit introuvable" };

    await prisma.product.update({
      where: { id: data.id },
      data: {
        nom: data.nom,
        description: data.description,
        categorie: data.categorie,
        genre: data.genre,
        prix: data.prix,
        prixPromo: data.prixPromo,
        stockQuantite: data.stockQuantite,
        source: data.source,
        images: data.images,
        statut: data.stockQuantite <= 0 ? "rupture" : data.statut,
      },
    });
  } else {
    await prisma.product.create({
      data: {
        vendorId,
        nom: data.nom,
        description: data.description,
        categorie: data.categorie,
        genre: data.genre,
        prix: data.prix,
        prixPromo: data.prixPromo,
        stockQuantite: data.stockQuantite,
        source: data.source,
        images: data.images,
        statut: data.stockQuantite <= 0 ? "rupture" : data.statut,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true };
}

export async function getDefaultVendor() {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  return prisma.vendor.findFirst({
    where: { statut: "actif" },
    orderBy: { dateCreation: "asc" },
  });
}
