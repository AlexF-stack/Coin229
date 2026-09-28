/**
 * Notifs commande marketplace — best-effort, ne bloque jamais le checkout.
 * Canaux : webhook ops + push abonnés (admin / clients).
 */
import { prisma } from "@/lib/prisma";
import {
  isGonePushError,
  isWebPushConfigured,
  sendPushToSubscription,
} from "@/lib/web-push";
import { SITE } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

export type NewOrderNotifyInput = {
  orderId: string;
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  montantTotal: number;
  nomClient: string;
  telephone: string;
};

export async function notifyNewOrder(input: NewOrderNotifyInput) {
  const appUrl = SITE.url;
  const body = `${input.vendorName} — ${formatPrice(input.montantTotal)} — ${input.nomClient}`;
  const url = `/vendeur/espace/commandes`;

  await Promise.allSettled([
    notifyWebhook(input, appUrl),
    notifyPush(body, url, input.orderId),
  ]);
}

async function notifyWebhook(input: NewOrderNotifyInput, appUrl: string) {
  const hook = process.env.ORDER_NOTIFY_WEBHOOK?.trim();
  if (!hook) return;
  await fetch(hook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "order.created",
      orderId: input.orderId,
      vendorId: input.vendorId,
      vendorName: input.vendorName,
      vendorContact: input.vendorContact,
      montantTotal: input.montantTotal,
      nomClient: input.nomClient,
      telephone: input.telephone,
      vendorEspace: `${appUrl}/vendeur/espace/commandes`,
      adminHint: `${appUrl}/admin`,
      whatsappVendor: whatsappToContact(
        input.vendorContact,
        `Nouvelle commande Coin229 #${input.orderId.slice(-6)} — ${formatPrice(input.montantTotal)}. Ouvre ton espace : ${appUrl}/vendeur/espace/commandes`
      ),
    }),
    signal: AbortSignal.timeout(8000),
  });
}

async function notifyPush(body: string, url: string, orderId: string) {
  if (!isWebPushConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ take: 200 });
  const goneIds: string[] = [];
  for (const sub of subs) {
    try {
      await sendPushToSubscription(sub, {
        title: "Nouvelle commande Coin229",
        body,
        url,
        tag: `order-${orderId}`,
      });
    } catch (err) {
      if (isGonePushError(err)) goneIds.push(sub.id);
    }
  }
  if (goneIds.length) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: goneIds } },
    });
  }
}

function whatsappToContact(contact: string, text: string): string | null {
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const phone = digits.startsWith("229") ? digits : `229${digits.slice(-8)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
