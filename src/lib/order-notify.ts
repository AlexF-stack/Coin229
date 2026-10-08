/**
 * Notifs commande marketplace — best-effort, ne bloque jamais le checkout.
 * Canaux : webhook ops + push admin et vendeur concerné (jamais les clients).
 */
import { sendPushTo } from "@/lib/push-audience";
import { SITE, whatsappToBjContact } from "@/lib/site";
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
    sendPushTo(
      { roles: ["admin", "vendor"], vendorId: input.vendorId },
      {
        title: "Nouvelle commande Coin229",
        body,
        url,
        tag: `order-${input.orderId}`,
      }
    ),
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
      whatsappVendor: whatsappToBjContact(
        input.vendorContact,
        `Nouvelle commande Coin229 #${input.orderId.slice(-6)} — ${formatPrice(input.montantTotal)}. Ouvre ton espace : ${appUrl}/vendeur/espace/commandes`
      ),
    }),
    signal: AbortSignal.timeout(8000),
  });
}

