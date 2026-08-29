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
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-y border-border bg-cream"
    >
      <ul className="page-shell grid grid-cols-2 gap-4 px-4 py-5 md:grid-cols-4 md:gap-6 md:px-6 md:py-6">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-2.5">
            <Icon
              className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-amber"
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-navy">{title}</p>
              <p className="text-xs leading-snug text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
