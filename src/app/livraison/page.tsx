import { formatPrice } from "@/lib/utils";
import { getShippingConfig, ZONE_LABELS, getZoneEta } from "@/lib/shipping";
import type { DeliveryZone } from "@prisma/client";
import { Truck, MapPin, Gift } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Livraison",
};

const zones: DeliveryZone[] = ["cotonou", "porto_novo", "godomey"];

export default function LivraisonPage() {
  const { fees, freeShippingThreshold } = getShippingConfig();

  return (
    <div className="space-y-8 px-4 py-6 md:px-0 md:py-10">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-amber">
          Service
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold">Livraison</h1>
        <p className="mt-2 text-muted">
          Livraison sur Cotonou, Porto-Novo et Godomey / Abomey-Calavi. Les
          délais et frais sont indiqués avant validation de ta commande.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {zones.map((zone) => {
          const eta = getZoneEta(zone);
          return (
            <div
              key={zone}
              className="rounded-[16px] border border-border bg-card p-5 shadow-card"
            >
              <MapPin className="h-5 w-5 stroke-[1.5] text-coral" />
              <h2 className="mt-3 font-display text-lg font-semibold">
                {ZONE_LABELS[zone]}
              </h2>
              <p className="mt-1 text-2xl font-semibold text-amber">
                {formatPrice(fees[zone])}
              </p>
              <p className="mt-1 text-xs text-muted">{eta.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-[16px] border border-green/30 bg-green/10 p-5">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-green" />
        <div>
          <p className="font-semibold text-green">Livraison gratuite</p>
          <p className="mt-1 text-sm text-fg">
            Dès {formatPrice(freeShippingThreshold)} d&apos;achat.
          </p>
        </div>
      </div>

      <div className="rounded-[16px] bg-card p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 stroke-[1.5] text-amber" />
          <h2 className="font-display text-lg font-semibold">Déroulement</h2>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Tu commandes avec ton adresse et ta zone.</li>
          <li>Tu paies en Mobile Money ou à la livraison.</li>
          <li>On te contacte et on livre dans les délais indiqués.</li>
        </ol>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-[16px] bg-amber px-5 py-3 text-sm font-semibold text-bg"
        >
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}
