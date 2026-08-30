import { prisma } from "@/lib/prisma";
import {
  verifyFedapayTransaction,
  verifyKkiaTransaction,
} from "@/lib/payment";
import { createHmac, timingSafeEqual } from "crypto";

export function amountsMatch(expected: number, actual: unknown): boolean {
  const n =
    typeof actual === "number"
      ? actual
      : typeof actual === "string"
        ? Number(actual.replace(/\s/g, "").replace(",", "."))
        : NaN;
  if (!Number.isFinite(n)) return false;
  return Math.round(n) === Math.round(expected);
}

export function isKkiaSuccess(remote: {
  status?: string;
  state?: string;
} | null): boolean {
  if (!remote) return false;
  const status = String(remote.status ?? "").toUpperCase();
  const state = String(remote.state ?? "").toUpperCase();
  return status === "SUCCESS" || state === "SUCCESS";
}

export function isFedapayApproved(remote: {
  status?: string;
} | null): boolean {
  if (!remote) return false;
  return remote.status === "approved" || remote.status === "transferred";
}

/** Secret partagé webhook Fedapay (header x-fedapay-secret ou signature). */
export function assertFedapayWebhookAuth(
  request: Request,
  rawBody: string
): boolean {
  const expected =
    process.env.FEDAPAY_WEBHOOK_SECRET?.trim() ||
    process.env.FEDAPAY_SECRET_KEY?.trim();
  if (!expected) {
    // En prod sans secret : refuser. En dev : accepter si pas de clé.
    return process.env.NODE_ENV !== "production";
  }

  const headerSecret =
    request.headers.get("x-fedapay-secret") ||
    request.headers.get("X-Fedapay-Secret") ||
    request.headers.get("x-webhook-secret");

  if (headerSecret && timingSafeEqualStr(headerSecret, expected)) {
    return true;
  }

  const signature =
    request.headers.get("x-fedapay-signature") ||
    request.headers.get("X-Fedapay-Signature") ||
    request.headers.get("fedapay-signature");

  if (signature) {
    const digest = createHmac("sha256", expected)
      .update(rawBody)
      .digest("hex");
    if (timingSafeEqualStr(signature.replace(/^sha256=/i, ""), digest)) {
      return true;
    }
  }

  return false;
}

export function assertKkiaWebhookAuth(request: Request): boolean {
  const expected = process.env.KKIAPAY_SECRET?.trim();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }
  const header =
    request.headers.get("x-kkiapay-secret") ||
    request.headers.get("X-KKIAPAY-SECRET");
  if (!header) return false;
  return timingSafeEqualStr(header, expected);
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function confirmOrderPaid(opts: {
  orderId: string;
  provider: "fedapay" | "kkiapay";
  paymentRef: string;
  expectedAmount?: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const order = await prisma.order.findUnique({ where: { id: opts.orderId } });
  if (!order) return { ok: false, reason: "order_not_found" };
  if (order.statut !== "en_attente") return { ok: true, reason: "already_processed" };

  if (
    opts.expectedAmount !== undefined &&
    !amountsMatch(order.montantTotal, opts.expectedAmount)
  ) {
    return { ok: false, reason: "amount_mismatch" };
  }

  // Une même tx ne peut confirmer qu’une seule commande
  const refTaken = await prisma.order.findFirst({
    where: {
      paymentRef: opts.paymentRef,
      NOT: { id: opts.orderId },
    },
    select: { id: true },
  });
  if (refTaken) {
    return { ok: false, reason: "ref_already_used" };
  }

  if (opts.provider === "fedapay") {
    const remote = await verifyFedapayTransaction(opts.paymentRef);
    if (!isFedapayApproved(remote)) {
      return { ok: false, reason: "not_approved" };
    }
    if (
      remote?.amount === undefined ||
      !amountsMatch(order.montantTotal, remote.amount)
    ) {
      return { ok: false, reason: "remote_amount_mismatch" };
    }
    if (order.paymentRef) {
      const ref = String(opts.paymentRef);
      const remoteId = remote?.id != null ? String(remote.id) : "";
      if (order.paymentRef !== ref && order.paymentRef !== remoteId) {
        return { ok: false, reason: "ref_mismatch" };
      }
    }
  }

  if (opts.provider === "kkiapay") {
    const remote = await verifyKkiaTransaction(opts.paymentRef);
    if (!isKkiaSuccess(remote)) {
      return { ok: false, reason: "not_success" };
    }
    if (
      remote?.amount === undefined ||
      !amountsMatch(order.montantTotal, remote.amount)
    ) {
      return { ok: false, reason: "remote_amount_mismatch" };
    }

    // Binding widget : si partnerId/data présents, ils doivent matcher orderId
    const binding = String(remote?.partnerId || remote?.data || "").trim();
    if (binding && binding !== opts.orderId) {
      return { ok: false, reason: "order_binding_mismatch" };
    }

    if (order.paymentRef && order.paymentRef !== opts.paymentRef) {
      return { ok: false, reason: "ref_mismatch" };
    }
  }

  try {
    await prisma.order.updateMany({
      where: { id: opts.orderId, statut: "en_attente" },
      data: {
        statut: "confirmee",
        paymentRef: opts.paymentRef,
        paymentProvider: opts.provider,
      },
    });
  } catch {
    return { ok: false, reason: "update_failed" };
  }

  return { ok: true };
}
