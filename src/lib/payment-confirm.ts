import { prisma } from "@/lib/prisma";
import {
  verifyFedapayTransaction,
  verifyKkiaTransaction,
} from "@/lib/payment";
import { createHmac, timingSafeEqual } from "crypto";
import {
  cancelPendingOrderAndRestock,
  PAYMENT_TIMEOUT_REASON,
  recoverExpiredPaidOrder,
} from "@/lib/order-expiry";

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

/** Écart maximal accepté entre l'horodatage du webhook et maintenant (bibliothèque officielle : 5 min) */
const FEDAPAY_TOLERANCE_SEC = 300;

/**
 * Signature webhook FedaPay, comme la bibliothèque officielle (fedapay-node, Webhook) :
 * en-tête `X-FEDAPAY-SIGNATURE: t=<horodatage>,s=<signature>` ;
 * signature = HMAC-SHA256 hex de `<horodatage>.<corps brut>` avec le secret du webhook
 * (FEDAPAY_WEBHOOK_SECRET, copié depuis le tableau de bord FedaPay).
 */
export function assertFedapayWebhookAuth(
  request: Request,
  rawBody: string,
  nowSec = Math.floor(Date.now() / 1000)
): boolean {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // En prod sans secret : refuser. En dev : accepter (tests locaux).
    return process.env.NODE_ENV !== "production";
  }

  const header = request.headers.get("x-fedapay-signature");
  if (!header) return false;

  let timestamp = NaN;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (key === "t") timestamp = Number.parseInt(value, 10);
    if (key === "s" && value) signatures.push(value);
  }
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  // Rejeu d'un vieux webhook intercepté
  if (Math.abs(nowSec - timestamp) > FEDAPAY_TOLERANCE_SEC) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  return signatures.some((s) => timingSafeEqualStr(s, expected));
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
  // Commande annulée faute de paiement à temps : un paiement tardif reste traité
  const expired =
    order.statut === "annulee" && order.cancelReason === PAYMENT_TIMEOUT_REASON;
  if (order.statut !== "en_attente" && !expired) {
    return { ok: true, reason: "already_processed" };
  }
  // Un paiement en ligne ne confirme qu'une commande Mobile Money de ce prestataire
  // (sinon une commande « à la livraison » pouvait être confirmée par une autre transaction)
  if (order.modePaiement !== "mobile_money") {
    return { ok: false, reason: "not_mobile_money" };
  }
  if (order.paymentProvider && order.paymentProvider !== opts.provider) {
    return { ok: false, reason: "provider_mismatch" };
  }

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

  if (expired) {
    // Paiement vérifié après expiration : re-réserver le stock ou rembourser
    const outcome = await recoverExpiredPaidOrder({
      orderId: opts.orderId,
      provider: opts.provider,
      paymentRef: opts.paymentRef,
    });
    return outcome === "confirmed" ? { ok: true } : { ok: true, reason: "refund_needed" };
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

/** Statuts définitifs d'échec chez les prestataires */
const FEDAPAY_FAILED = new Set(["declined", "canceled", "cancelled", "expired", "refunded"]);
const KKIA_FAILED = new Set(["FAILED", "CANCELLED", "CANCELED", "EXPIRED"]);

/**
 * Paiement signalé en échec : on RE-VÉRIFIE auprès du prestataire (le contenu
 * du webhook n'est pas cru), puis on annule la commande et on rend le stock
 * sans attendre l'expiration de la réservation.
 */
export async function handleFailedPayment(opts: {
  orderId: string;
  provider: "fedapay" | "kkiapay";
  paymentRef: string;
}): Promise<{ cancelled: boolean; reason?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: opts.orderId },
    select: { statut: true, modePaiement: true, paymentProvider: true, paymentRef: true },
  });
  if (!order || order.statut !== "en_attente") return { cancelled: false, reason: "not_pending" };
  if (order.modePaiement !== "mobile_money") return { cancelled: false, reason: "not_mobile_money" };
  if (order.paymentProvider && order.paymentProvider !== opts.provider) {
    return { cancelled: false, reason: "provider_mismatch" };
  }
  // Fedapay : la transaction de la commande est connue dès sa création
  if (opts.provider === "fedapay" && order.paymentRef && order.paymentRef !== opts.paymentRef) {
    return { cancelled: false, reason: "ref_mismatch" };
  }

  let failed = false;
  if (opts.provider === "fedapay") {
    const remote = await verifyFedapayTransaction(opts.paymentRef);
    failed = FEDAPAY_FAILED.has(String(remote?.status ?? "").toLowerCase());
  } else {
    const remote = await verifyKkiaTransaction(opts.paymentRef);
    const bound = String(remote?.partnerId || remote?.data || "").trim();
    if (bound && bound !== opts.orderId) return { cancelled: false, reason: "order_binding_mismatch" };
    failed = KKIA_FAILED.has(String(remote?.status ?? remote?.state ?? "").toUpperCase());
  }
  if (!failed) return { cancelled: false, reason: "not_failed" };

  const cancelled = await cancelPendingOrderAndRestock(opts.orderId, "payment_failed");
  return { cancelled };
}
