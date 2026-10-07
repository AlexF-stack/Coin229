"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { maybeReleaseExpiredReservations } from "@/lib/order-expiry";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { changeOrderStatus } from "@/lib/order-status";
import { parseProductInput } from "@/lib/product-schema";
import { createPayoutForVendor, payableOrderWhere, SOLD_STATUSES } from "@/lib/payouts";
import { randomBytes } from "crypto";
import { SITE } from "@/lib/site";
import { hashResetToken } from "@/lib/vendor-auth";
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
import {
  addOrderToConfirmToken,
  orderConfirmCookieName,
  orderConfirmCookieOptions,
} from "@/lib/order-confirm";
import { canAccessOrder } from "@/lib/order-access";
import { fetchProductsByIds } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductCardData } from "@/lib/constants";
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

/**
 * Point d'entrée du checkout : ne lève jamais d'exception vers le client
 * (sinon écran d'erreur brut) — toute erreur inattendue devient un message lisible.
 */
export async function createOrder(input: Parameters<typeof createOrderUnsafe>[0]) {
  try {
    return await createOrderUnsafe(input);
  } catch (err) {
    console.error("[createOrder]", err);
    return {
      success: false as const,
      error:
        "Une erreur technique a empêché la validation de ta commande. Réessaie dans un instant ; si le problème continue, écris-nous sur WhatsApp.",
    };
  }
}

async function createOrderUnsafe(input: {
  nom: string;
  telephone: string;
  adresse: string;
  zone: DeliveryZone;
  modePaiement: PaymentMode;
  items: CheckoutItem[];
  expectedTotal?: number;
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

  // Limite anti-abus : chaque commande réserve du stock
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const [byIp, byPhone] = await Promise.all([
    rateLimitAsync({ key: `order:ip:${ip}`, limit: 10, windowMs: 15 * 60_000 }),
    rateLimitAsync({ key: `order:tel:${telephone}`, limit: 5, windowMs: 15 * 60_000 }),
  ]);
  if (!byIp.ok || !byPhone.ok) {
    const minutes = Math.max(
      1,
      Math.ceil(Math.max(byIp.retryAfterSec, byPhone.retryAfterSec) / 60)
    );
    return {
      success: false as const,
      error: `Trop de commandes en peu de temps. Réessaie dans ${minutes} min, ou écris-nous sur WhatsApp.`,
    };
  }

  // Libère le stock des commandes Mobile Money non payées à temps
  await maybeReleaseExpiredReservations();

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
      error:
        "Ton panier contient déjà des articles d’une autre marque — vide ou commande d’abord.",
    };
  }
  const vendorId = products[0]!.vendorId;

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, statut: true, nomBoutique: true, contact: true },
  });
  if (!vendor || vendor.statut !== "actif") {
    return {
      success: false as const,
      error:
        "Cette boutique n’accepte pas de commandes pour le moment. Choisis une autre marque.",
    };
  }

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

  // Le client ne paie jamais un autre montant que celui qu'il a vu
  if (data.expectedTotal !== undefined && data.expectedTotal !== montantTotal) {
    return {
      success: false as const,
      priceChanged: true as const,
      error: `Les prix ou les frais ont changé depuis l’ajout au panier. Nouveau total : ${formatPrice(montantTotal)}. Vérifie le récapitulatif puis confirme à nouveau.`,
    };
  }

  const { getMarketplaceCommissionPct, splitOrderAmounts } = await import(
    "@/lib/marketplace-finance"
  );
  const commissionPct = await getMarketplaceCommissionPct();
  const { commissionAmount, vendorNet } = splitOrderAmounts(
    subtotal,
    commissionPct
  );

  // Client connecté avec Google / Facebook : la commande va sur SON compte
  // (pas de fusion par numéro : le téléphone saisi ici n'est pas vérifié)
  const oauthClientId = await currentOAuthClientId();
  const existing = oauthClientId
    ? null
    : await prisma.client.findUnique({ where: { telephone } });
  let clientId: string;
  if (oauthClientId) {
    clientId = oauthClientId;
  } else if (existing) {
    // Le nom du client existant n'est plus écrasé par n'importe quelle commande
    // passée avec son numéro (le nom de livraison est enregistré sur la commande)
    clientId = existing.id;
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
          commissionPct,
          commissionAmount,
          vendorNet,
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
    customerName: data.nom,
  });

  if (!payment.success) {
    // Annulation + stock rendu en une seule transaction ; produit remis en
    // vente seulement s'il était en rupture (jamais un produit archivé)
    await prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.updateMany({
        where: { id: order.id, statut: "en_attente" },
        data: { statut: "annulee", cancelReason: "payment_failed" },
      });
      if (cancelled.count === 0) return;
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantite: { increment: item.quantite } },
        });
        await tx.product.updateMany({
          where: { id: item.productId, statut: "rupture", stockQuantite: { gt: 0 } },
          data: { statut: "actif" },
        });
      }
    });
    return { success: false as const, error: payment.message };
  }

  if (payment.provider !== "cash_on_delivery") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: payment.provider,
        paymentRef: payment.transactionId,
        paymentUrl: payment.paymentUrl ?? null,
        ...(payment.status === "paid" ? { statut: "confirmee" as const } : {}),
      },
    });
  }

  const jar = await cookies();
  // Ajoute cette commande à celles déjà mémorisées sur ce navigateur
  const confirmToken = addOrderToConfirmToken(
    jar.get(orderConfirmCookieName())?.value,
    order.id
  );
  if (confirmToken) {
    jar.set(
      orderConfirmCookieName(),
      confirmToken,
      orderConfirmCookieOptions()
    );
  }
  // Ne PAS émettre coin229_phone ici — uniquement après OTP (/api/auth/phone-session).

  revalidatePath("/");
  revalidatePath("/compte");
  revalidatePath("/admin");
  revalidatePath("/vendeur/espace");
  revalidatePath("/vendeur/espace/commandes");

  void import("@/lib/order-notify")
    .then(({ notifyNewOrder }) =>
      notifyNewOrder({
        orderId: order.id,
        vendorId: vendor.id,
        vendorName: vendor.nomBoutique,
        vendorContact: vendor.contact,
        montantTotal,
        nomClient: data.nom,
        telephone,
      })
    )
    .catch(() => {});

  return {
    success: true as const,
    orderId: order.id,
    payment,
  };
}

/** Compte connecté : session téléphone OU session Supabase (Google/Facebook). */
export async function getMyOrders() {
  try {
    const jar = await cookies();
    const phone = await readPhoneFromToken(
      jar.get(phoneCookieName())?.value
    );
    if (phone) {
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
    }

    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    return await prisma.client.findFirst({
      where: {
        OR: [
          { authId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
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

/** Fiche Client du compte Google / Facebook connecté, sinon null */
async function currentOAuthClientId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const client = await prisma.client.findFirst({
      where: { authId: user.id },
      select: { id: true },
    });
    return client?.id ?? null;
  } catch {
    return null;
  }
}

/** Crée / met à jour le Client après OAuth Google ou Facebook. */
export async function ensureOAuthClient() {
  if (!isSupabaseConfigured()) return { ok: false as const };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false as const };

    const email = user.email?.toLowerCase() ?? null;
    const nom =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      (user.user_metadata?.user_name as string | undefined) ||
      email?.split("@")[0] ||
      "Client Coin229";

    const existing = await prisma.client.findFirst({
      where: {
        OR: [
          { authId: user.id },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.client.update({
        where: { id: existing.id },
        data: {
          authId: user.id,
          email: email ?? existing.email,
          nom: existing.nom || nom,
        },
      });
    } else {
      await prisma.client.create({
        data: {
          nom,
          email,
          authId: user.id,
          telephone: null,
        },
      });
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

/** Session affichée côté client (téléphone ou OAuth). */
export async function getAccountSession(): Promise<{
  label: string;
  provider: "phone" | "google" | "facebook" | "oauth";
} | null> {
  try {
    const jar = await cookies();
    const phone = await readPhoneFromToken(
      jar.get(phoneCookieName())?.value
    );
    if (phone) return { label: phone, provider: "phone" };

    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const provider = (user.app_metadata?.provider as string) || "oauth";
    const label =
      user.email ||
      (user.user_metadata?.full_name as string | undefined) ||
      "Compte connecté";

    if (provider === "google" || provider === "facebook") {
      return { label, provider };
    }
    return { label, provider: "oauth" };
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

export type CartSnapshotItem = {
  productId: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  stockQuantite: number;
  available: boolean;
};

const cartSnapshotSchema = z.array(z.string().min(1).max(64)).max(60);

/** Prix / stock / disponibilité actuels des articles du panier (données publiques) */
export async function getCartSnapshot(
  productIds: string[]
): Promise<CartSnapshotItem[] | null> {
  const parsed = cartSnapshotSchema.safeParse(productIds);
  if (!parsed.success || !parsed.data.length) return [];
  await maybeReleaseExpiredReservations();
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: [...new Set(parsed.data)] } },
      select: {
        id: true,
        nom: true,
        prix: true,
        prixPromo: true,
        stockQuantite: true,
        statut: true,
        vendor: { select: { statut: true } },
      },
    });
    return products.map((p) => ({
      productId: p.id,
      nom: p.nom,
      prix: p.prix,
      prixPromo: p.prixPromo,
      stockQuantite: p.stockQuantite,
      available:
        p.statut === "actif" && p.vendor.statut === "actif" && p.stockQuantite > 0,
    }));
  } catch {
    // Base indisponible : on ne touche pas au panier
    return null;
  }
}

export async function getOrderForConfirmation(orderId: string) {
  if (!orderId) return { demo: false as const, order: null };
  // Commandes fantômes du mode démo : jamais en production
  if (orderId.startsWith("demo_")) {
    return allowDemoCatalog()
      ? { demo: true as const, order: null }
      : { demo: false as const, order: null };
  }
  try {
    if (!(await canAccessOrder(orderId))) {
      return { demo: false as const, order: null };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });
    if (!order) return { demo: false as const, order: null };
    return { demo: false as const, order };
  } catch {
    return { demo: false as const, order: null };
  }
}

/** Produits favoris (IDs panier local) — catalogue réel, pas seulement DEMO. */
export async function getWishlistProducts(
  ids: string[]
): Promise<ProductCardData[]> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 60);
  if (!unique.length) return [];
  const products = await fetchProductsByIds(unique);
  const map = new Map(products.map((p) => [p.id, p]));
  return unique
    .map((id) => map.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      prix: p.prix,
      prixPromo: p.prixPromo,
      images: p.images,
      categorie: p.categorie,
      niche: p.niche,
      genre: p.genre,
      stockQuantite: p.stockQuantite,
      statut: p.statut,
      vendorId: p.vendorId,
      dateCreation: p.dateCreation,
    }));
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

/** Admin : commandes de TOUTE la marketplace (filtre vendeur optionnel) */
export async function getAdminOrders(filter?: { vendorId?: string }) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return prisma.order.findMany({
    where: filter?.vendorId ? { vendorId: filter.vendorId } : {},
    include: {
      items: { include: { product: true } },
      client: true,
      vendor: { select: { id: true, nomBoutique: true } },
    },
    orderBy: { dateCreation: "desc" },
    take: 200,
  });
}

/** Admin : chiffres globaux de la marketplace */
export async function getAdminOverview() {
  try {
    await requireAdmin();
  } catch {
    return null;
  }
  const [products, orders, waiting, sold, payable, refunds, pendingVendors, resetRequests] =
    await Promise.all([
      prisma.product.count({ where: { statut: { in: ["actif", "rupture"] } } }),
      prisma.order.count(),
      prisma.order.count({ where: { statut: "en_attente" } }),
      prisma.order.aggregate({
        where: { statut: { in: SOLD_STATUSES } },
        _sum: { montantTotal: true, fraisLivraison: true, commissionAmount: true },
      }),
      prisma.order.aggregate({ where: payableOrderWhere(), _sum: { vendorNet: true } }),
      prisma.order.count({ where: { refundStatus: "pending" } }),
      prisma.vendor.count({ where: { statut: "en_attente" } }),
      prisma.vendor.count({ where: { resetRequestedAt: { not: null } } }),
    ]);
  return {
    products,
    orders,
    waiting,
    sales: (sold._sum.montantTotal ?? 0) - (sold._sum.fraisLivraison ?? 0),
    commission: sold._sum.commissionAmount ?? 0,
    toPayOut: payable._sum.vendorNet ?? 0,
    refunds,
    pendingVendors,
    resetRequests,
  };
}

/** Admin : produits des vendeurs marketplace (hors boutique maison) */
export async function getMarketplaceProducts(houseVendorId?: string) {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return prisma.product.findMany({
    where: houseVendorId ? { vendorId: { not: houseVendorId } } : {},
    include: { vendor: { select: { nomBoutique: true, slug: true } } },
    orderBy: [{ statut: "asc" }, { dateCreation: "desc" }],
    take: 300,
  });
}

/** Admin : retirer de la vente (archive) ou remettre en vente un produit vendeur */
export async function setProductStatusAdmin(
  productId: string,
  statut: "archive" | "actif"
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Non autorisé" };
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stockQuantite: true },
  });
  if (!product) return { success: false as const, error: "Produit introuvable" };
  await prisma.product.update({
    where: { id: productId },
    data: {
      statut: statut === "actif" && product.stockQuantite <= 0 ? "rupture" : statut,
    },
  });
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath(`/produit/${productId}`);
  return { success: true as const };
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

export async function updateOrderStatus(orderId: string, statut: OrderStatus) {
  try {
    await requireAdmin();
  } catch {
    return { success: false, error: "Non autorisé" };
  }
  // Toute commande de la marketplace ; mêmes règles que le vendeur (droits
  // admin) + stock rendu à l'annulation
  const result = await changeOrderStatus({ orderId, to: statut, actor: "admin" });
  if (!result.success) return result;
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
  // Même validation que pour les vendeurs
  const checked = parseProductInput(data);
  if (!checked.ok) return { success: false, error: checked.error };
  data = { ...data, ...checked.data, source: checked.data.source ?? data.source };
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
  const preferredId = process.env.COIN229_VENDOR_ID?.trim();
  if (preferredId) {
    const preferred = await prisma.vendor.findUnique({
      where: { id: preferredId },
    });
    if (preferred) return preferred;
  }
  const bySlug = await prisma.vendor.findFirst({
    where: { slug: "coin229" },
  });
  if (bySlug) return bySlug;
  const byLocalId = await prisma.vendor.findUnique({
    where: { id: "vendor_coin229_local" },
  });
  if (byLocalId) return byLocalId;
  return prisma.vendor.findFirst({
    where: { statut: "actif" },
    orderBy: { dateCreation: "asc" },
  });
}

export async function listMarketplaceVendors() {
  try {
    await requireAdmin();
  } catch {
    return [];
  }
  return prisma.vendor.findMany({
    orderBy: [{ statut: "asc" }, { dateCreation: "desc" }],
    include: {
      _count: { select: { products: true, orders: true } },
    },
  });
}

export async function listAdminPayoutData() {
  try {
    await requireAdmin();
  } catch {
    return { unpaidVendors: [], recentPayouts: [] };
  }

  // Même règle que la création du reversement (src/lib/payouts.ts)
  const unpaidOrders = await prisma.order.findMany({
    where: payableOrderWhere(),
    include: { vendor: { select: { id: true, nomBoutique: true, email: true, mobileMoney: true, contact: true } } },
  });

  const byVendor = new Map<
    string,
    {
      vendorId: string;
      nomBoutique: string;
      email: string | null;
      mobileMoney: string | null;
      orderCount: number;
      vendorNet: number;
    }
  >();
  for (const o of unpaidOrders) {
    const cur = byVendor.get(o.vendorId) ?? {
      vendorId: o.vendorId,
      nomBoutique: o.vendor.nomBoutique,
      email: o.vendor.email,
      // Numéro de reversement déclaré au KYC, sinon le contact
      mobileMoney: o.vendor.mobileMoney || o.vendor.contact,
      orderCount: 0,
      vendorNet: 0,
    };
    cur.orderCount += 1;
    cur.vendorNet += o.vendorNet;
    byVendor.set(o.vendorId, cur);
  }

  const recentPayouts = await prisma.vendorPayout.findMany({
    orderBy: { dateCreation: "desc" },
    take: 30,
    include: {
      vendor: { select: { nomBoutique: true } },
      _count: { select: { orders: true } },
    },
  });

  return {
    unpaidVendors: [...byVendor.values()].sort((a, b) => b.vendorNet - a.vendorNet),
    recentPayouts,
  };
}

/**
 * Admin : lien de réinitialisation à usage unique (24 h) pour un vendeur,
 * à envoyer sur SON WhatsApp après vérification d'identité. Le lien n'est
 * stocké nulle part (seul son hash l'est).
 */
export async function createVendorResetLink(vendorId: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Non autorisé" };
  }
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, nomBoutique: true, contact: true, email: true },
  });
  if (!vendor?.email) {
    return { success: false as const, error: "Ce vendeur n’a pas de compte (email) à réinitialiser." };
  }
  const token = randomBytes(32).toString("hex");
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      resetTokenHash: hashResetToken(token),
      resetTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resetRequestedAt: null,
    },
  });
  const resetUrl = `${SITE.url}/vendeur/reinitialiser?token=${token}`;
  const text = `Bonjour ${vendor.nomBoutique}, voici ton lien Coin229 pour choisir un nouveau mot de passe (valable 24 h, une seule fois) : ${resetUrl}`;
  const phone = normalizeBjPhone(vendor.contact)?.replace("+", "") ?? vendor.contact.replace(/\D/g, "");
  return {
    success: true as const,
    resetUrl,
    whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : null,
  };
}

export async function setVendorStatus(
  vendorId: string,
  statut: "actif" | "en_attente" | "suspendu"
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Non autorisé" };
  }
  await prisma.vendor.update({
    where: { id: vendorId },
    data: { statut },
  });

  // Activation : publier les produits préparés (archive → actif si stock)
  if (statut === "actif") {
    // Uniquement les produits retenus par la modération : un produit que le
    // vendeur avait retiré lui-même reste retiré
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { vendorId, heldByModeration: true, stockQuantite: { gt: 0 } },
        data: { statut: "actif", heldByModeration: false },
      }),
      prisma.product.updateMany({
        where: { vendorId, heldByModeration: true },
        data: { statut: "rupture", heldByModeration: false },
      }),
    ]);
  }
  if (statut === "suspendu") {
    await prisma.product.updateMany({
      where: { vendorId, statut: "actif" },
      data: { statut: "archive", heldByModeration: true },
    });
  }

  revalidatePath("/admin/vendeurs");
  revalidatePath("/admin");
  revalidatePath("/boutique");
  revalidatePath(`/vendeur`);
  return { success: true as const };
}

/** Reverse manuel : regroupe les commandes unpaid livrées/confirmées. */
export async function createVendorPayout(
  vendorId: string,
  expectedAmount: number,
  note?: string
) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Non autorisé" };
  }
  if (!Number.isInteger(expectedAmount) || expectedAmount <= 0) {
    return { success: false as const, error: "Montant invalide" };
  }

  // Atomique, sans double reversement, montant vérifié (src/lib/payouts.ts)
  const result = await createPayoutForVendor({ vendorId, expectedAmount, note });
  if (!result.success) return result;

  revalidatePath("/admin/payouts");
  revalidatePath("/admin/vendeurs");
  revalidatePath("/vendeur/espace/finances");
  return result;
}

export async function listPayoutQueue() {
  try {
    await requireAdmin();
  } catch {
    return { vendors: [], payouts: [] };
  }
  const vendors = await prisma.vendor.findMany({
    where: { statut: "actif" },
    orderBy: { nomBoutique: "asc" },
  });
  const unpaid = await prisma.order.groupBy({
    by: ["vendorId"],
    where: {
      payoutId: null,
      statut: { in: ["livree", "confirmee", "en_livraison"] },
      vendorNet: { gt: 0 },
    },
    _sum: { vendorNet: true },
    _count: true,
  });
  const byId = new Map(unpaid.map((u) => [u.vendorId, u]));
  const queue = vendors
    .map((v) => {
      const u = byId.get(v.id);
      return {
        vendor: v,
        pendingAmount: u?._sum.vendorNet ?? 0,
        orderCount: u?._count ?? 0,
      };
    })
    .filter((r) => r.pendingAmount > 0);

  const payouts = await prisma.vendorPayout.findMany({
    include: { vendor: true },
    orderBy: { dateCreation: "desc" },
    take: 40,
  });
  return { vendors: queue, payouts };
}

export async function markOrderRefundDone(orderId: string) {
  try {
    await requireAdmin();
  } catch {
    return { success: false as const, error: "Non autorisé" };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { refundStatus: "done" },
  });
  revalidatePath("/admin");
  return { success: true as const };
}
