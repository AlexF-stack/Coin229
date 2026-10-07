"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/assert-client";
import { requireVendor } from "@/lib/assert-vendor";

const MAX_BODY = 2000;
/** Messages affichés dans une discussion : les plus récents */
const MESSAGES_SHOWN = 200;

function cleanBody(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_BODY);
}

export async function listClientConversations() {
  const { clientId } = await requireClient();
  return prisma.conversation.findMany({
    where: { clientId },
    include: {
      vendor: { select: { id: true, nomBoutique: true, slug: true, logoUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getVendorUnreadTotal() {
  const { vendorId } = await requireVendor();
  const agg = await prisma.conversation.aggregate({
    where: { vendorId },
    _sum: { vendorUnread: true },
  });
  return agg._sum.vendorUnread ?? 0;
}

export async function listVendorConversations() {
  const { vendorId } = await requireVendor();
  return prisma.conversation.findMany({
    where: { vendorId },
    include: {
      client: { select: { id: true, nom: true, telephone: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });
}

export async function getClientConversation(conversationId: string) {
  const { clientId } = await requireClient();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, clientId },
    include: {
      vendor: { select: { id: true, nomBoutique: true, slug: true } },
      // Les PLUS RÉCENTS (sinon les nouveaux messages disparaissaient après 200)
      messages: { orderBy: { createdAt: "desc" }, take: MESSAGES_SHOWN },
    },
  });
  if (!conv) return null;
  if (conv.clientUnread > 0) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { clientUnread: 0 },
    });
  }
  return { ...conv, messages: conv.messages.reverse(), clientUnread: 0 };
}

export async function getVendorConversation(conversationId: string) {
  const { vendorId } = await requireVendor();
  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, vendorId },
    include: {
      client: { select: { id: true, nom: true, telephone: true } },
      // Les PLUS RÉCENTS (sinon les nouveaux messages disparaissaient après 200)
      messages: { orderBy: { createdAt: "desc" }, take: MESSAGES_SHOWN },
    },
  });
  if (!conv) return null;
  if (conv.vendorUnread > 0) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { vendorUnread: 0 },
    });
  }
  return { ...conv, messages: conv.messages.reverse(), vendorUnread: 0 };
}

/** Client démarre / reprend une discussion avec une marque. */
export async function startOrGetConversation(input: {
  vendorId: string;
  productId?: string;
  orderId?: string;
  firstMessage?: string;
}) {
  const { clientId } = await requireClient();

  const vendor = await prisma.vendor.findFirst({
    where: { id: input.vendorId, statut: "actif" },
    select: { id: true, nomBoutique: true },
  });
  if (!vendor) {
    return { success: false as const, error: "Vendeur introuvable" };
  }

  let subject: string | null = null;
  let productId = input.productId ?? null;
  let orderId = input.orderId ?? null;

  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
      select: { nom: true },
    });
    if (!product) productId = null;
    else subject = product.nom;
  }

  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, clientId, vendorId: vendor.id },
      select: { id: true },
    });
    if (!order) orderId = null;
    else if (!subject) subject = `Commande ${orderId.slice(0, 8)}`;
  }

  let conv = await prisma.conversation.findUnique({
    where: {
      vendorId_clientId: { vendorId: vendor.id, clientId },
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        vendorId: vendor.id,
        clientId,
        productId,
        orderId,
        subject,
      },
    });
  } else if ((productId || orderId || subject) && (!conv.subject || productId)) {
    conv = await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        ...(productId ? { productId } : {}),
        ...(orderId ? { orderId } : {}),
        ...(subject ? { subject } : {}),
      },
    });
  }

  const body = input.firstMessage ? cleanBody(input.firstMessage) : "";
  if (body) {
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        sender: "client",
        body,
      },
    });
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: new Date(),
        vendorUnread: { increment: 1 },
      },
    });
  }

  revalidatePath("/compte/messages");
  revalidatePath("/vendeur/espace/messages");
  return { success: true as const, conversationId: conv.id };
}

export async function sendClientMessage(
  conversationId: string,
  rawBody: string
) {
  const { clientId } = await requireClient();
  const body = cleanBody(rawBody);
  if (!body) return { success: false as const, error: "Message vide" };

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, clientId },
  });
  if (!conv) return { success: false as const, error: "Conversation introuvable" };

  const msg = await prisma.message.create({
    data: { conversationId: conv.id, sender: "client", body },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      vendorUnread: { increment: 1 },
    },
  });

  revalidatePath(`/compte/messages/${conv.id}`);
  revalidatePath("/vendeur/espace/messages");
  return { success: true as const, message: msg };
}

export async function sendVendorMessage(
  conversationId: string,
  rawBody: string
) {
  const { vendorId } = await requireVendor();
  const body = cleanBody(rawBody);
  if (!body) return { success: false as const, error: "Message vide" };

  const conv = await prisma.conversation.findFirst({
    where: { id: conversationId, vendorId },
  });
  if (!conv) return { success: false as const, error: "Conversation introuvable" };

  const msg = await prisma.message.create({
    data: { conversationId: conv.id, sender: "vendor", body },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      clientUnread: { increment: 1 },
    },
  });

  revalidatePath(`/vendeur/espace/messages/${conv.id}`);
  revalidatePath("/compte/messages");
  return { success: true as const, message: msg };
}
