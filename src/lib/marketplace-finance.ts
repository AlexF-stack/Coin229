/**
 * Commission marketplace — % sur le sous-total produits (hors livraison).
 */
import { prisma } from "@/lib/prisma";

const DEFAULT_PCT = 10;

export async function getMarketplaceCommissionPct(): Promise<number> {
  try {
    const row = await prisma.appConfig.findUnique({
      where: { cle: "MARKETPLACE_COMMISSION_PCT" },
    });
    const n = Number(row?.valeur ?? DEFAULT_PCT);
    if (!Number.isFinite(n) || n < 0 || n > 50) return DEFAULT_PCT;
    return Math.round(n);
  } catch {
    return DEFAULT_PCT;
  }
}

export function splitOrderAmounts(subtotal: number, commissionPct: number) {
  const safeSub = Math.max(0, Math.round(subtotal));
  const pct = Math.min(50, Math.max(0, Math.round(commissionPct)));
  const commissionAmount = Math.floor((safeSub * pct) / 100);
  const vendorNet = Math.max(0, safeSub - commissionAmount);
  return { commissionPct: pct, commissionAmount, vendorNet };
}
