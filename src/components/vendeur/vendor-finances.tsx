"use client";

import type { Order } from "@prisma/client";
import { formatPrice } from "@/lib/utils";

type Props = {
  commissionPct: number;
  caBrut: number;
  commission: number;
  net: number;
  pendingPayout: number;
  inProgress: number;
  recentOrders: Order[];
};

const STATUT_LABEL: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
};

export function VendorFinances({
  commissionPct,
  caBrut,
  commission,
  net,
  pendingPayout,
  inProgress,
  recentOrders,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commission plateforme" value={`${commissionPct} %`} />
        <StatCard label="Ventes (hors livraison)" value={formatPrice(caBrut)} />
        <StatCard label="Commission totale" value={formatPrice(commission)} />
        <StatCard label="Net vendeur" value={formatPrice(net)} highlight />
      </div>

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/90">
          En attente de reversement
        </p>
        <p className="mt-1 text-2xl font-semibold text-white">
          {formatPrice(pendingPayout)}
        </p>
        <p className="mt-1 text-xs text-white/45">
          Net des commandes livrées, pas encore reversé par Coin229.
        </p>
        {inProgress > 0 && (
          <p className="mt-2 text-xs text-white/55">
            + {formatPrice(inProgress)} de commandes confirmées ou en livraison,
            reversables une fois livrées.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">
          Commandes récentes
        </h2>
        {recentOrders.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#1a1c24] px-4 py-8 text-center text-sm text-white/45">
            Aucune commande pour l’instant.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1a1c24]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="text-white/75">
                    <td className="px-4 py-3 text-white/50">
                      {new Date(o.dateCreation).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">{o.nomClient}</td>
                    <td className="px-4 py-3">{formatPrice(o.montantTotal)}</td>
                    <td className="px-4 py-3 font-medium text-amber-300/90">
                      {formatPrice(o.vendorNet)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {STATUT_LABEL[o.statut] ?? o.statut}
                      {o.payoutId && (
                        <span className="ml-1 text-emerald-400/80">· reversé</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1c24] p-4">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold ${highlight ? "text-amber-300" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}
