import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKkiaTransaction } from "@/lib/payment";
import { revalidatePath } from "next/cache";

/**
 * Webhook KkiaPay — header x-kkiapay-secret = secret dashboard.
 */
export async function POST(request: Request) {
  const expected = process.env.KKIAPAY_SECRET?.trim();
  const header =
    request.headers.get("x-kkiapay-secret") ||
    request.headers.get("X-KKIAPAY-SECRET");

  if (expected && header !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    transactionId?: string;
    isPaymentSuccessful?: boolean;
    status?: string;
    amount?: number;
    stateData?: { order_id?: string };
  } | null;

  if (!body?.transactionId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const remote = await verifyKkiaTransaction(body.transactionId);
  const success =
    body.isPaymentSuccessful === true ||
    body.status === "SUCCESS" ||
    remote?.status === "SUCCESS" ||
    remote?.state === "SUCCESS";

  if (!success) {
    return NextResponse.json({ ok: true, status: "not_success" });
  }

  const orderId = body.stateData?.order_id;
  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId, statut: "en_attente" },
      data: {
        statut: "confirmee",
        paymentRef: body.transactionId,
        paymentProvider: "kkiapay",
      },
    });
  } else {
    await prisma.order.updateMany({
      where: { paymentRef: body.transactionId, statut: "en_attente" },
      data: { statut: "confirmee", paymentProvider: "kkiapay" },
    });
  }

  revalidatePath("/compte");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
