import {
  Banknote,
  MapPinned,
  PackageCheck,
  Smartphone,
} from "lucide-react";
import { getShippingConfig, ZONE_LABELS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import type { DeliveryZone } from "@prisma/client";

export function ReassuranceBar() {
  const { freeShippingThreshold } = getShippingConfig();
  const zones = (Object.keys(ZONE_LABELS) as DeliveryZone[])
    .map((z) => ZONE_LABELS[z].split(" / ")[0])
    .join(" · ");

  const items = [
    {
      icon: MapPinned,
      title: "Livraison locale",
      text: zones,
    },
    {
      icon: Smartphone,
      title: "Mobile Money",
      text: "MTN & Moov",
    },
    {
      icon: Banknote,
      title: "Paiement à la livraison",
      text: "Selon les options disponibles",
    },
    {
      icon: PackageCheck,
      title: "Livraison offerte",
      text: `Dès ${formatPrice(freeShippingThreshold)}`,
    },
  ] as const;

  return (
    <section
      aria-label="Avantages Coin229"
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-y border-border/80 bg-background"
    >
      <ul className="page-shell grid grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 md:grid-cols-4 md:gap-6 md:px-6 md:py-7">
        {items.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex gap-3">
            <span className="mt-0.5 font-display text-[10px] font-semibold tracking-[0.14em] text-accent-ink">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 shrink-0 stroke-[1.5] text-primary"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-primary">{title}</p>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
