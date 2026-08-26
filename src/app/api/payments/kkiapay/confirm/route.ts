import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyKkiaTransaction } from "@/lib/payment";
import { revalidatePath } from "next/cache";

/** Confirmation côté client après succès widget KkiaPay */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    orderId?: string;
    transactionId?: string;
  } | null;

  if (!body?.orderId || !body.transactionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const remote = await verifyKkiaTransaction(body.transactionId);
  const ok =
    !remote ||
    remote.status === "SUCCESS" ||
    remote.state === "SUCCESS" ||
    String(remote.status).toUpperCase() === "SUCCESS";

  if (!ok) {
    return NextResponse.json({ ok: false, error: "Transaction non validée" }, { status: 400 });
  }

  await prisma.order.updateMany({
    where: { id: body.orderId, statut: "en_attente" },
    data: {
      statut: "confirmee",
      paymentRef: body.transactionId,
      paymentProvider: "kkiapay",
    },
  });

  revalidatePath("/compte");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
