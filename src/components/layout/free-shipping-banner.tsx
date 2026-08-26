import { getShippingConfig } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { Truck } from "lucide-react";

export function FreeShippingBanner() {
  const { freeShippingThreshold } = getShippingConfig();

  return (
    <div className="z-40 flex items-center justify-center gap-2 bg-green px-3 py-2 text-center text-sm font-medium text-white">
      <Truck className="h-4 w-4 shrink-0 stroke-[1.5]" />
      <span className="md:hidden">
        Livraison offerte dès {formatPrice(freeShippingThreshold)}
      </span>
      <span className="hidden md:inline">
        Livraison gratuite dès {formatPrice(freeShippingThreshold)} · Cotonou,
        Porto-Novo, Godomey
      </span>
    </div>
  );
}
