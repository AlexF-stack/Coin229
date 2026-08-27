import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  assertKkiaWebhookAuth,
  confirmOrderPaid,
} from "@/lib/payment-confirm";

/**
 * Webhook KkiaPay — header x-kkiapay-secret obligatoire en production.
 * Confirmation uniquement après re-vérification API + match montant.
 */
export async function POST(request: Request) {
  if (!assertKkiaWebhookAuth(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    transactionId?: string;
    stateData?: { order_id?: string };
  } | null;

  if (!body?.transactionId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let orderId = body.stateData?.order_id;
  if (!orderId) {
    const byRef = await prisma.order.findFirst({
      where: { paymentRef: body.transactionId, statut: "en_attente" },
      select: { id: true },
    });
    orderId = byRef?.id;
  }

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const result = await confirmOrderPaid({
    orderId,
    provider: "kkiapay",
    paymentRef: body.transactionId,
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
