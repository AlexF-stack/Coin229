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
import {
  createOrderConfirmToken,
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
    customerName: data.nom,
  });

  if (!payment.success) {
    await prisma.order.update({
      where: { id: order.id },
      data: { statut: "annulee" },
    });
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
  const confirmToken = createOrderConfirmToken(order.id);
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

export async function getOrderForConfirmation(orderId: string) {
  if (!orderId || orderId.startsWith("demo_")) {
    return { demo: true as const, order: null };
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
