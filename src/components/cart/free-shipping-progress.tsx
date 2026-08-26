"use client";

import { formatPrice } from "@/lib/utils";
import { Truck } from "lucide-react";

type Props = {
  amountToFreeShipping: number;
  isFree: boolean;
  threshold: number;
  subtotal: number;
};

export function FreeShippingProgress({
  amountToFreeShipping,
  isFree,
  threshold,
  subtotal,
}: Props) {
  const progress = Math.min(100, (subtotal / threshold) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-green/25 bg-gradient-to-r from-green/15 via-green/10 to-transparent p-3.5 md:p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green/20 text-green">
          <Truck className="h-4 w-4 stroke-[1.5]" />
        </span>
        <div className="min-w-0 flex-1">
          {isFree ? (
            <p className="text-sm font-semibold text-green">
              Livraison gratuite débloquée 🎉
            </p>
          ) : (
            <p className="text-sm text-fg">
              Plus que{" "}
              <span className="font-semibold text-amber">
                {formatPrice(amountToFreeShipping)}
              </span>{" "}
              pour la livraison offerte
            </p>
          )}
          <p className="mt-0.5 text-[11px] text-muted">
            Seuil : {formatPrice(threshold)}
          </p>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-bg/60">
            <div
              className="h-full rounded-full bg-green transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
