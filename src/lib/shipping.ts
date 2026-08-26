import type { DeliveryZone } from "@prisma/client";

export type ShippingInput = {
  zone: DeliveryZone;
  subtotal: number;
  freeShippingThreshold?: number;
};

export type ShippingResult = {
  fee: number;
  isFree: boolean;
  amountToFreeShipping: number;
  freeShippingThreshold: number;
  baseFee: number;
  /** Fenêtre estimée de livraison par zone */
  etaLabel: string;
  etaHoursMin: number;
  etaHoursMax: number;
};

function readNumber(
  serverValue: string | undefined,
  publicValue: string | undefined,
  fallback: number
): number {
  const raw = serverValue ?? publicValue;
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** ETA réalistes last-mile Bénin (moto / densités urbaines) */
const ZONE_ETA: Record<
  DeliveryZone,
  { min: number; max: number; label: string }
> = {
  cotonou: { min: 2, max: 24, label: "Souvent le jour même · max 24h" },
  porto_novo: { min: 24, max: 48, label: "24–48h ouvrées" },
  godomey: { min: 4, max: 36, label: "Souvent sous 36h" },
};

export function getShippingConfig() {
  return {
    freeShippingThreshold: readNumber(
      process.env.FREE_SHIPPING_THRESHOLD,
      process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD,
      25000
    ),
    fees: {
      cotonou: readNumber(
        process.env.SHIPPING_FEE_COTONOU,
        process.env.NEXT_PUBLIC_SHIPPING_FEE_COTONOU,
        1000
      ),
      porto_novo: readNumber(
        process.env.SHIPPING_FEE_PORTO_NOVO,
        process.env.NEXT_PUBLIC_SHIPPING_FEE_PORTO_NOVO,
        1500
      ),
      godomey: readNumber(
        process.env.SHIPPING_FEE_GODOMEY,
        process.env.NEXT_PUBLIC_SHIPPING_FEE_GODOMEY,
        1500
      ),
    } satisfies Record<DeliveryZone, number>,
  };
}

/**
 * Calcule les frais de livraison selon la zone et le seuil de gratuité.
 * Cotonou : tarif de base le plus bas.
 * Porto-Novo / Godomey : légèrement supérieur (distance).
 */
export function calculateShippingFee(input: ShippingInput): ShippingResult {
  const config = getShippingConfig();
  const threshold = input.freeShippingThreshold ?? config.freeShippingThreshold;
  const baseFee = config.fees[input.zone];
  const isFree = input.subtotal >= threshold;
  const amountToFreeShipping = Math.max(0, threshold - input.subtotal);
  const eta = ZONE_ETA[input.zone];

  return {
    fee: isFree ? 0 : baseFee,
    isFree,
    amountToFreeShipping,
    freeShippingThreshold: threshold,
    baseFee,
    etaLabel: eta.label,
    etaHoursMin: eta.min,
    etaHoursMax: eta.max,
  };
}

export function getZoneEta(zone: DeliveryZone) {
  return ZONE_ETA[zone];
}

export const ZONE_LABELS: Record<DeliveryZone, string> = {
  cotonou: "Cotonou",
  porto_novo: "Porto-Novo",
  godomey: "Godomey / Abomey-Calavi",
};

/** Roadmap expansion Afrique (UEMOA d'abord) */
export const AFRICA_EXPANSION = [
  { phase: 1, market: "Bénin", focus: "Cotonou · Porto-Novo · Godomey", status: "actif" },
  { phase: 2, market: "Togo · Côte d’Ivoire", focus: "UEMOA · XOF · MoMo", status: "prévu" },
  { phase: 3, market: "Sénégal · Burkina · Niger", focus: "Hubs + partenaires locaux", status: "vision" },
  { phase: 4, market: "Afrique francophone élargie", focus: "Marketplace multi-vendeurs", status: "vision" },
] as const;
