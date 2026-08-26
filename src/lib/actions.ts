"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { processPayment } from "@/lib/payment";
import { calculateShippingFee } from "@/lib/shipping";
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
  clientId?: string;
}) {
  if (!input.items.length) {
    return { success: false as const, error: "Panier vide" };
  }

  let products;
  try {
    products = await prisma.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    });
  } catch {
    // Mode démo sans DB : confirmation mockée
    const mockId = `demo_${Date.now()}`;
    const payment = await processPayment({
      orderId: mockId,
      amount: 0,
      mode: input.modePaiement,
      phone: input.telephone,
    });
    return {
      success: true as const,
      orderId: mockId,
      payment,
    };
  }

  // Produits démo (IDs seed locaux) absents de la DB
  if (products.length !== input.items.length) {
    const { DEMO_PRODUCTS } = await import("@/lib/demo-data");
    const demoMatched = input.items.every((i) =>
      DEMO_PRODUCTS.some((p) => p.id === i.productId)
    );
    if (demoMatched) {
      const mockId = `demo_${Date.now()}`;
      const payment = await processPayment({
        orderId: mockId,
        amount: 0,
        mode: input.modePaiement,
        phone: input.telephone,
      });
      return {
        success: true as const,
        orderId: mockId,
        payment,
      };
    }
    return { success: false as const, error: "Produit introuvable" };
  }

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.statut !== "actif" || product.stockQuantite < item.quantite) {
      return {
        success: false as const,
        error: `Stock insuffisant pour ${product.nom}`,
      };
    }
  }

  const vendorId = products[0].vendorId;
  const lineItems = input.items.map((item) => {
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
  const shipping = calculateShippingFee({ zone: input.zone, subtotal });
  const montantTotal = subtotal + shipping.fee;

  let clientId = input.clientId;
  if (!clientId) {
    const existing = await prisma.client.findUnique({
      where: { telephone: input.telephone },
    });
    if (existing) {
      clientId = existing.id;
      await prisma.client.update({
        where: { id: existing.id },
        data: { nom: input.nom },
      });
    } else {
      const created = await prisma.client.create({
        data: {
          nom: input.nom,
          telephone: input.telephone,
          adresses: {
            create: {
              zone: input.zone,
              adresseComplete: input.adresse,
              estPrincipale: true,
            },
          },
        },
      });
      clientId = created.id;
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantite: { decrement: item.quantite },
          statut: undefined,
        },
      });
      const updated = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (updated && updated.stockQuantite <= 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { statut: "rupture", stockQuantite: 0 },
        });
      }
    }

    return tx.order.create({
      data: {
        clientId: clientId!,
        vendorId,
        modePaiement: input.modePaiement,
        zoneLivraison: input.zone,
        fraisLivraison: shipping.fee,
        montantTotal,
        telephone: input.telephone,
        nomClient: input.nom,
        adresseLivraison: input.adresse,
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

  const payment = await processPayment({
    orderId: order.id,
    amount: montantTotal,
    mode: input.modePaiement,
    phone: input.telephone,
  });

  if (payment.success && input.modePaiement === "mobile_money") {
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

export async function getClientOrders(telephone: string) {
  const client = await prisma.client.findUnique({
    where: { telephone },
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
  return client;
}

export async function upsertClientAddress(input: {
  clientId: string;
  zone: DeliveryZone;
  adresseComplete: string;
  estPrincipale?: boolean;
  addressId?: string;
}) {
  if (input.estPrincipale) {
    await prisma.address.updateMany({
      where: { clientId: input.clientId },
      data: { estPrincipale: false },
    });
  }

  if (input.addressId) {
    await prisma.address.update({
      where: { id: input.addressId },
      data: {
        zone: input.zone,
        adresseComplete: input.adresseComplete,
        estPrincipale: input.estPrincipale ?? false,
      },
    });
  } else {
    await prisma.address.create({
      data: {
        clientId: input.clientId,
        zone: input.zone,
        adresseComplete: input.adresseComplete,
        estPrincipale: input.estPrincipale ?? false,
      },
    });
  }

  revalidatePath("/compte");
  return { success: true };
}

/* ——— Admin / Vendor ——— */

export async function getVendorOrders(vendorId: string) {
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
  return prisma.product.findMany({
    where: { vendorId },
    orderBy: { dateCreation: "desc" },
  });
}

export async function updateOrderStatus(orderId: string, statut: OrderStatus, vendorId: string) {
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
  return prisma.vendor.findFirst({
    where: { statut: "actif" },
    orderBy: { dateCreation: "asc" },
  });
}
