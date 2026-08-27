import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  assertFedapayWebhookAuth,
  confirmOrderPaid,
} from "@/lib/payment-confirm";

/**
 * Callback navigateur Fedapay + webhook.
 * Confirmation uniquement après re-vérification API + match montant.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const txId =
    searchParams.get("id") ||
    searchParams.get("transaction_id") ||
    searchParams.get("transactionId");

  if (!orderId) {
    return NextResponse.redirect(`${origin}/commande/confirmation`);
  }

  try {
    if (txId) {
      await confirmOrderPaid({
        orderId,
        provider: "fedapay",
        paymentRef: String(txId),
      });
      revalidatePath("/compte");
      revalidatePath("/admin");
    } else {
      const { prisma } = await import("@/lib/prisma");
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { paymentRef: true, statut: true },
      });
      if (order?.paymentRef && order.statut === "en_attente") {
        await confirmOrderPaid({
          orderId,
          provider: "fedapay",
          paymentRef: order.paymentRef,
        });
        revalidatePath("/compte");
        revalidatePath("/admin");
      }
    }
  } catch {
    // redirection quand même
  }

  return NextResponse.redirect(
    `${origin}/commande/confirmation?id=${encodeURIComponent(orderId)}`
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!assertFedapayWebhookAuth(request, rawBody)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  type FedapayWebhookBody = {
    entity?: {
      id?: number;
      status?: string;
      custom_metadata?: { orderId?: string };
    };
  };

  let body: FedapayWebhookBody;
  try {
    body = JSON.parse(rawBody) as FedapayWebhookBody;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const entity = body.entity;
  const orderId = entity?.custom_metadata?.orderId;
  const txId = entity?.id;

  if (!orderId || !txId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await confirmOrderPaid({
    orderId,
    provider: "fedapay",
    paymentRef: String(txId),
  });

  if (!result.ok && result.reason !== "already_processed") {
    return NextResponse.json(
      { ok: false, reason: result.reason },
      { status: 400 }
    );
  }

  revalidatePath("/compte");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
