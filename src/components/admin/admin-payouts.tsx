"use client";

import { useState, useTransition } from "react";
import type { VendorPayout } from "@prisma/client";
import { createVendorPayout } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/feedback";

type UnpaidVendor = {
  vendorId: string;
  nomBoutique: string;
  email: string | null;
  mobileMoney: string | null;
  orderCount: number;
  vendorNet: number;
};

type PayoutRow = VendorPayout & {
  vendor: { nomBoutique: string };
  _count: { orders: number };
};

type Props = {
  unpaidVendors: UnpaidVendor[];
  recentPayouts: PayoutRow[];
};

export function AdminPayouts({ unpaidVendors, recentPayouts }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function markPaid(v: UnpaidVendor) {
    if (
      !(await confirm({
        title: `Reversement à ${v.nomBoutique}`,
        message: `Confirmer que ${formatPrice(v.vendorNet)} ont été reversés (${v.orderCount} commande(s) livrée(s)) ?`,
        confirmLabel: "Oui, c’est reversé",
      }))
    ) {
      return;
    }
    setErrors((e) => ({ ...e, [v.vendorId]: "" }));
    startTransition(async () => {
      // Le montant affiché est vérifié côté serveur
      const res = await createVendorPayout(v.vendorId, v.vendorNet);
      if (!res.success) {
        setErrors((e) => ({ ...e, [v.vendorId]: res.error ?? "Erreur" }));
        return;
      }
      window.location.reload();
    });
  }

  return (
    <>
      {dialog}
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-fg">À reverser</h2>
          {unpaidVendors.length === 0 ? (
            <EmptyState icon={<Wallet />} title="Aucun reversement en attente" description="Les ventes livrées non reversées apparaîtront ici." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {unpaidVendors.map((v) => (
                <Card as="li" key={v.vendorId} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-fg">{v.nomBoutique}</p>
                      <p className="text-xs text-muted">
                        {v.email ?? "sans email"} · {v.orderCount} commande(s)
                      </p>
                    </div>
                    <p className="font-display text-lg font-semibold text-primary">{formatPrice(v.vendorNet)}</p>
                  </div>
                  <p className="rounded-control bg-surface-muted px-3 py-2 text-sm text-fg-secondary">
                    Reverser sur le Mobile Money :{" "}
                    <span className="select-all font-semibold text-fg">{v.mobileMoney ?? "non renseigné"}</span>
                  </p>
                  <Button size="sm" className="self-end" loading={pending} onClick={() => markPaid(v)}>
                    Marquer reversé
                  </Button>
                  {errors[v.vendorId] && (
                    <p role="alert" className="text-xs font-medium text-error">
                      {errors[v.vendorId]}
                    </p>
                  )}
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-fg">Reversements récents</h2>
          <DataTable
            caption="Reversements récents"
            rows={recentPayouts}
            rowKey={(p) => p.id}
            empty={<EmptyState title="Aucun historique" description="Les reversements effectués apparaîtront ici." />}
            columns={[
              { key: "vendeur", header: "Vendeur", primary: true, cell: (p) => <span className="font-medium">{p.vendor.nomBoutique}</span> },
              { key: "date", header: "Date", cell: (p) => new Date(p.dateCreation).toLocaleDateString("fr-FR") },
              { key: "montant", header: "Montant", align: "right", cell: (p) => <span className="font-semibold">{formatPrice(p.amount)}</span> },
              { key: "commandes", header: "Commandes", align: "right", cell: (p) => p._count.orders },
              {
                key: "statut",
                header: "Statut",
                cell: (p) => (
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <StatusBadge kind="payout" status={p.statut} />
                    {p.datePaid && <span className="text-xs text-muted">{new Date(p.datePaid).toLocaleDateString("fr-FR")}</span>}
                  </span>
                ),
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
