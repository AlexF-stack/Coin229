"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient } from "@/lib/assert-client";
import { requireVendor } from "@/lib/assert-vendor";
import { rateLimitAsync } from "@/lib/rate-limit";
import { sendPushTo } from "@/lib/push-audience";

const MAX_BODY = 2000;
/** Messages affichés dans une discussion : les plus récents */
const MESSAGES_SHOWN = 200;

function cleanBody(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_BODY);
}

const TOO_MANY = "Trop de messages envoyés. Réessaie dans quelques minutes.";

/** Anti-spam : 30 messages / 10 min par compte */
async function canSend(senderKey: string) {
  const r = await rateLimitAsync({ key: `msg:${senderKey}`, limit: 30, windowMs: 10 * 60_000 });
  return r.ok;
}

function preview(body: string) {
  return body.length > 90 ? `${body.slice(0, 89)}…` : body;
}

/**
 * Prévient l'autre partie d'un nouveau message — seulement au 1er non lu,
 * pour ne pas envoyer une notification par message. Après la réponse (after).
 */
function notifyNewMessage(
  to: { vendorId: string } | { clientId: string },
  conversationId: string,
  unreadNow: number,
  title: string,
  body: string
) {
  if (unreadNow !== 1) return;
  after(() =>
    sendPushTo(
      "vendorId" in to ? { roles: ["vendor"], vendorId: to.vendorId } : { roles: ["client"], clientId: to.clientId },
      {
        title,
        body: preview(body),
        url: "vendorId" in to ? `/vendeur/espace/messages/${conversationId}` : `/compte/messages/${conversationId}`,
        tag: `msg-${conversationId}`,
      }
    ).catch(() => undefined)
  );
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
  // Message automatique (« j’ai une question sur … ») : pas de doublon si le
  // client reclique sur « Contacter » dans les 24 h
  const alreadySent =
    body &&
    (await prisma.message.findFirst({
      where: {
        conversationId: conv.id,
        sender: "client",
        body,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    }));
  if (body && !alreadySent) {
    if (!(await canSend(`client:${clientId}`))) {
      return { success: false as const, error: TOO_MANY };
    }
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        sender: "client",
        body,
      },
    });
    const updated = await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessageAt: new Date(),
        vendorUnread: { increment: 1 },
      },
    });
    notifyNewMessage({ vendorId: vendor.id }, conv.id, updated.vendorUnread, "Nouveau message client", body);
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
  if (!(await canSend(`client:${clientId}`))) return { success: false as const, error: TOO_MANY };

  const msg = await prisma.message.create({
    data: { conversationId: conv.id, sender: "client", body },
  });
  const updated = await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      vendorUnread: { increment: 1 },
    },
  });
  notifyNewMessage({ vendorId: conv.vendorId }, conv.id, updated.vendorUnread, "Nouveau message client", body);

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
  if (!(await canSend(`vendor:${vendorId}`))) return { success: false as const, error: TOO_MANY };

  const msg = await prisma.message.create({
    data: { conversationId: conv.id, sender: "vendor", body },
  });
  const updated = await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: new Date(),
      clientUnread: { increment: 1 },
    },
    include: { vendor: { select: { nomBoutique: true } } },
  });
  notifyNewMessage({ clientId: conv.clientId }, conv.id, updated.clientUnread, `Réponse de ${updated.vendor.nomBoutique}`, body);

  revalidatePath(`/vendeur/espace/messages/${conv.id}`);
  revalidatePath("/compte/messages");
  return { success: true as const, message: msg };
}
