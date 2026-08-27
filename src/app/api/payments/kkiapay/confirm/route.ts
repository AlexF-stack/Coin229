import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  confirmOrderPaid,
  isKkiaSuccess,
} from "@/lib/payment-confirm";
import { verifyKkiaTransaction } from "@/lib/payment";

/** Confirmation côté client après succès widget KkiaPay — vérifie toujours l’API + montant. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    orderId?: string;
    transactionId?: string;
  } | null;

  if (!body?.orderId || !body.transactionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const remote = await verifyKkiaTransaction(body.transactionId);
  if (!isKkiaSuccess(remote)) {
    return NextResponse.json(
      { ok: false, error: "Transaction non validée" },
      { status: 400 }
    );
  }

  const result = await confirmOrderPaid({
    orderId: body.orderId,
    provider: "kkiapay",
    paymentRef: body.transactionId,
  });

  if (!result.ok && result.reason !== "already_processed") {
    return NextResponse.json(
      { ok: false, error: result.reason ?? "Confirmation refusée" },
      { status: 400 }
    );
  }

  revalidatePath("/compte");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
