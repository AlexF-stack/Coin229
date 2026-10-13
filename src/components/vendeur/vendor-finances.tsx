"use client";

import type { Order, VendorPayout } from "@prisma/client";
import { Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/feedback";

type Props = {
  commissionPct: number;
  caBrut: number;
  commission: number;
  net: number;
  pendingPayout: number;
  inProgress: number;
  recentOrders: Order[];
  /** Reversements faits par Coin229 (les plus récents) */
  payouts?: VendorPayout[];
};

export function VendorFinances({
  commissionPct,
  caBrut,
  commission,
  net,
  pendingPayout,
  inProgress,
  recentOrders,
  payouts = [],
}: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commission plateforme" value={`${commissionPct} %`} />
        <StatCard label="Ventes (hors livraison)" value={formatPrice(caBrut)} />
        <StatCard label="Commission totale" value={formatPrice(commission)} />
        <StatCard label="Net vendeur" value={formatPrice(net)} tone="success" hint="Ce qui te revient" />
      </div>

      {/* Montant attendu : mis en avant comme l'action principale de la page */}
      <section className="rounded-card bg-surface-inverse p-5 text-inverse shadow-card md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">En attente de reversement</p>
        <p className="mt-1 font-display text-3xl font-semibold text-inverse">{formatPrice(pendingPayout)}</p>
        <p className="mt-1 text-sm text-inverse/75">Net des commandes livrées, pas encore reversé par Coin229.</p>
        {inProgress > 0 && (
          <p className="mt-2 text-sm text-inverse/75">
            + {formatPrice(inProgress)} de commandes confirmées ou en livraison, reversables une fois livrées.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-fg">Reversements reçus</h2>
          <p className="mt-1 text-sm text-muted">Virés par Coin229 sur le Mobile Money indiqué dans ton profil.</p>
        </div>
        <DataTable
          caption="Reversements reçus"
          rows={payouts}
          rowKey={(p) => p.id}
          empty={<EmptyState icon={<Wallet />} title="Aucun reversement pour l’instant" description="Dès qu’une commande est livrée, son montant net apparaît « En attente de reversement »." />}
          columns={[
            { key: "date", header: "Date", primary: true, cell: (p) => new Date(p.datePaid ?? p.dateCreation).toLocaleDateString("fr-FR") },
            { key: "montant", header: "Montant", align: "right", cell: (p) => <span className="font-semibold">{formatPrice(p.amount)}</span> },
            { key: "statut", header: "Statut", cell: (p) => <StatusBadge kind="payout" status={p.statut} /> },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-fg">Commandes récentes</h2>
        <DataTable
          caption="Commandes récentes"
          rows={recentOrders}
          rowKey={(o) => o.id}
          empty={<EmptyState icon={<Wallet />} title="Aucune commande pour l’instant" />}
          columns={[
            { key: "client", header: "Client", primary: true, cell: (o) => <span className="font-medium">{o.nomClient}</span> },
            { key: "date", header: "Date", cell: (o) => new Date(o.dateCreation).toLocaleDateString("fr-FR") },
            { key: "total", header: "Total", align: "right", cell: (o) => formatPrice(o.montantTotal) },
            { key: "net", header: "Net", align: "right", cell: (o) => <span className="font-semibold">{formatPrice(o.vendorNet)}</span> },
            {
              key: "statut",
              header: "Statut",
              cell: (o) => (
                <span className="inline-flex flex-wrap gap-1.5">
                  <StatusBadge kind="order" status={o.statut} />
                  {o.payoutId && <Badge tone="success">Reversé</Badge>}
                </span>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
