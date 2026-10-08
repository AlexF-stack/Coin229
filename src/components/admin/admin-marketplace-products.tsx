"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { setProductStatusAdmin } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Store } from "lucide-react";

type Row = Product & { vendor: { nomBoutique: string; slug: string | null } };

/** Modération admin des produits des vendeurs marketplace */
export function AdminMarketplaceProducts({ products }: { products: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();
  const [local, setLocal] = useState(products);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function setStatut(p: Row, statut: "archive" | "actif") {
    if (
      statut === "archive" &&
      !(await confirm({
        title: `Retirer « ${p.nom} » de la vente ?`,
        message: `Produit de ${p.vendor.nomBoutique}. Il ne sera plus visible dans la boutique.`,
        confirmLabel: "Retirer de la vente",
        danger: true,
      }))
    ) {
      return;
    }
    startTransition(async () => {
      const res = await setProductStatusAdmin(p.id, statut);
      if (!res.success) {
        setErrors((e) => ({ ...e, [p.id]: res.error }));
        return;
      }
      setLocal((list) =>
        list.map((x) =>
          x.id === p.id
            ? { ...x, statut: statut === "actif" && x.stockQuantite <= 0 ? "rupture" : statut }
            : x
        )
      );
    });
  }

  return (
    <>
      {dialog}
      <DataTable
        caption="Produits des vendeurs"
        rows={local}
        rowKey={(p) => p.id}
        empty={<EmptyState icon={<Store />} title="Aucun produit vendeur" description="Les produits des marques marketplace apparaîtront ici." />}
        columns={[
          {
            key: "produit",
            header: "Produit",
            primary: true,
            cell: (p) => (
              <div className="min-w-0">
                <Link href={`/produit/${p.id}`} target="_blank" className="font-medium text-fg hover:underline">
                  {p.nom}
                </Link>
                {errors[p.id] && (
                  <p role="alert" className="text-xs font-medium text-error">
                    {errors[p.id]}
                  </p>
                )}
              </div>
            ),
          },
          { key: "boutique", header: "Boutique", cell: (p) => p.vendor.nomBoutique },
          {
            key: "prix",
            header: "Prix",
            align: "right",
            cell: (p) => formatPrice(p.prixPromo && p.prixPromo < p.prix ? p.prixPromo : p.prix),
          },
          { key: "stock", header: "Stock", align: "right", cell: (p) => p.stockQuantite },
          { key: "statut", header: "Statut", cell: (p) => <StatusBadge kind="product" status={p.statut} /> },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            actions: true,
            align: "right",
            cell: (p) =>
              p.statut === "archive" ? (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatut(p, "actif")}>
                  Remettre en vente
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-error/30 text-error hover:border-error hover:bg-error-soft"
                  disabled={pending}
                  onClick={() => setStatut(p, "archive")}
                >
                  Retirer de la vente
                </Button>
              ),
          },
        ]}
      />
    </>
  );
}
