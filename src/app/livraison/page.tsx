import type { Metadata } from "next";
import { formatPrice } from "@/lib/utils";
import { getShippingConfig, ZONE_LABELS, getZoneEta } from "@/lib/shipping";
import type { DeliveryZone } from "@prisma/client";
import { Truck, MapPin, Gift } from "lucide-react";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Livraison & frais",
  description: `Frais et délais de livraison ${SITE.name} à Cotonou, Porto-Novo et Godomey. Livraison offerte dès seuil en FCFA.`,
  path: "/livraison",
});

const zones: DeliveryZone[] = ["cotonou", "porto_novo", "godomey"];

export default function LivraisonPage() {
  const { fees, freeShippingThreshold } = getShippingConfig();

  return (
    <div className="space-y-8 px-4 py-6 md:px-0 md:py-10">
      <header className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-amber">
          Service
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-navy">
          Livraison
        </h1>
        <p className="mt-2 text-muted">
          Zones {SITE.zones.join(", ")}. Frais et délais en FCFA, affichés avant
          validation — pas de surprise à la caisse.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {zones.map((zone) => {
          const eta = getZoneEta(zone);
          return (
            <div
              key={zone}
              className="rounded-[12px] bg-cream p-5"
            >
              <MapPin className="h-5 w-5 stroke-[1.5] text-amber" />
              <h2 className="mt-3 font-display text-lg font-semibold text-navy">
                {ZONE_LABELS[zone]}
              </h2>
              <p className="mt-1 text-2xl font-semibold text-navy">
                {formatPrice(fees[zone])}
              </p>
              <p className="mt-1 text-xs text-muted">{eta.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-3 rounded-[12px] border border-green/25 bg-green/10 p-5">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 stroke-[1.5] text-green" />
        <div>
          <p className="font-semibold text-navy">Livraison gratuite</p>
          <p className="mt-1 text-sm text-muted">
            Dès {formatPrice(freeShippingThreshold)} d&apos;achat (hors frais déjà
            inclus selon zone).
          </p>
        </div>
      </div>

      <div className="rounded-[12px] bg-cream p-5">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 stroke-[1.5] text-amber" />
          <h2 className="font-display text-lg font-semibold text-navy">
            Déroulement
          </h2>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Vous commandez avec votre adresse et votre zone.</li>
          <li>Vous payez en Mobile Money ou à la livraison.</li>
          <li>Nous vous contactons et livrons dans les délais indiqués.</li>
        </ol>
        <p className="mt-4 text-sm text-muted">
          Voir aussi{" "}
          <Link href="/retours" className="font-medium text-navy underline-offset-2 hover:underline">
            Retours & échanges
          </Link>
          .
        </p>
        <Link href="/boutique" className="btn btn-primary mt-5">
          Voir la boutique
        </Link>
      </div>
    </div>
  );
}
