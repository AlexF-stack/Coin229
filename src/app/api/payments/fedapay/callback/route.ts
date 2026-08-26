import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFedapayTransaction } from "@/lib/payment";
import { revalidatePath } from "next/cache";

/**
 * Callback navigateur Fedapay + éventuel ping.
 * Confirme la commande si la transaction est approved.
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
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (order && order.statut === "en_attente") {
      const ref = txId || order.paymentRef;
      if (ref) {
        const remote = await verifyFedapayTransaction(ref);
        const approved =
          remote?.status === "approved" || remote?.status === "transferred";
        if (approved) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              statut: "confirmee",
              paymentRef: String(ref),
              paymentProvider: "fedapay",
            },
          });
          revalidatePath("/compte");
          revalidatePath("/admin");
        }
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
  // Webhook Fedapay (entity.transaction.approved etc.)
  const body = (await request.json().catch(() => null)) as {
    entity?: {
      id?: number;
      status?: string;
      custom_metadata?: { orderId?: string };
      amount?: number;
    };
    name?: string;
  } | null;

  const entity = body?.entity;
  const orderId = entity?.custom_metadata?.orderId;
  const status = entity?.status;
  const txId = entity?.id;

  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (status === "approved" || status === "transferred") {
    await prisma.order.updateMany({
      where: { id: orderId, statut: "en_attente" },
      data: {
        statut: "confirmee",
        paymentRef: txId ? String(txId) : undefined,
        paymentProvider: "fedapay",
      },
    });
    revalidatePath("/compte");
    revalidatePath("/admin");
  }

  return NextResponse.json({ ok: true });
}
