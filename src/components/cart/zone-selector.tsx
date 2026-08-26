"use client";

import type { DeliveryZone } from "@prisma/client";
import { ZONE_LABELS, getShippingConfig, getZoneEta } from "@/lib/shipping";
import { cn, formatPrice } from "@/lib/utils";

const zones: DeliveryZone[] = ["cotonou", "porto_novo", "godomey"];

type Props = {
  value: DeliveryZone;
  onChange: (zone: DeliveryZone) => void;
};

export function ZoneSelector({ value, onChange }: Props) {
  const { fees } = getShippingConfig();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Zone de livraison</p>
      <div className="grid gap-2">
        {zones.map((zone) => {
          const eta = getZoneEta(zone);
          return (
            <button
              key={zone}
              type="button"
              onClick={() => onChange(zone)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-[16px] border px-4 py-3 text-left text-sm transition-colors",
                value === zone
                  ? "border-amber bg-amber/10 text-fg"
                  : "border-border bg-card text-muted"
              )}
            >
              <span>
                <span className="block font-medium text-fg">
                  {ZONE_LABELS[zone]}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {eta.label}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium text-amber">
                {formatPrice(fees[zone])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
