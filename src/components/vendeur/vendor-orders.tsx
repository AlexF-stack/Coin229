"use client";

import { useState, useTransition } from "react";
import type { Order, OrderItem, Product, OrderStatus } from "@prisma/client";
import { updateMyOrderStatus } from "@/lib/vendor-actions";
import {
  allowedNextStatuses,
  STATUS_ACTION_LABELS,
} from "@/lib/order-status-rules";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { Download, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/feedback";

type OrderRow = Order & {
  items: (OrderItem & { product: Product })[];
  client: { nom: string } | null;
};

type Props = {
  orders: OrderRow[];
};

function exportCsv(orders: OrderRow[]) {
  const header = ["id", "date", "client", "total", "vendorNet", "statut"];
  const rows = orders.map((o) => [
    o.id,
    new Date(o.dateCreation).toISOString(),
    `"${o.nomClient.replace(/"/g, '""')}"`,
    String(o.montantTotal),
    String(o.vendorNet),
    o.statut,
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Explication affichée quand le vendeur ne peut plus rien faire lui-même */
function waitingNote(o: OrderRow): string | null {
  if (o.payoutId) return "Reversée — statut verrouillé.";
  if (o.modePaiement === "mobile_money" && o.statut === "en_attente") {
    return "En attente du paiement Mobile Money du client.";
  }
  if (o.modePaiement === "livraison" && o.statut === "en_livraison") {
    return "Coin229 confirme la livraison et l’encaissement.";
  }
  return null;
}

export function VendorOrders({ orders }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function setStatut(orderId: string, statut: OrderStatus) {
    if (
      statut === "annulee" &&
      !(await confirm({
        title: "Annuler cette commande ?",
        message: "Le stock sera remis en vente.",
        confirmLabel: "Annuler la commande",
        cancelLabel: "Garder",
        danger: true,
      }))
    ) {
      return;
    }
    setBusyId(orderId);
    startTransition(async () => {
      const result = await updateMyOrderStatus(orderId, statut);
      if (!result.success) {
        setErrors((e) => ({ ...e, [orderId]: result.error }));
        setBusyId(null);
        return;
      }
      window.location.reload();
    });
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingCart />}
        title="Aucune commande pour ta marque"
        description="Les commandes de tes produits apparaîtront ici dès qu’un client achète."
      />
    );
  }

  return (
    <>
      {dialog}
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => exportCsv(orders)}>
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => (
            <Card as="li" key={o.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{o.nomClient}</p>
                  <p className="text-xs text-muted">
                    {o.telephone} · {new Date(o.dateCreation).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge kind="order" status={o.statut} />
                  <Badge tone="neutral">{o.modePaiement === "mobile_money" ? "Mobile Money" : "À la livraison"}</Badge>
                </div>
              </div>

              <ul className="space-y-1 rounded-control bg-surface-muted px-3 py-2 text-sm text-fg-secondary">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantite}× {it.product.nom} — {formatPrice(it.prixUnitaireAuMomentCommande)}
                  </li>
                ))}
              </ul>

              <p className="flex items-baseline justify-between text-sm">
                <span className="font-display text-lg font-semibold text-fg">{formatPrice(o.montantTotal)}</span>
                <span className="text-muted">
                  Net pour toi : <span className="font-semibold text-fg">{formatPrice(o.vendorNet)}</span>
                </span>
              </p>

              {(allowedNextStatuses(o, "vendor").length > 0 || waitingNote(o)) && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {allowedNextStatuses(o, "vendor").map((st) => (
                    <Button
                      key={st}
                      size="sm"
                      variant={st === "annulee" ? "outline" : "primary"}
                      className={st === "annulee" ? "border-error/30 text-error hover:border-error hover:bg-error-soft" : undefined}
                      disabled={pending}
                      onClick={() => setStatut(o.id, st)}
                    >
                      {STATUS_ACTION_LABELS[st]}
                    </Button>
                  ))}
                  {waitingNote(o) && <span className="text-xs text-muted">{waitingNote(o)}</span>}
                </div>
              )}
              {errors[o.id] && (
                <p role="alert" className="text-xs font-medium text-error">
                  {errors[o.id]}
                </p>
              )}
              {pending && busyId === o.id && <Spinner label="Mise à jour…" className="text-xs" />}
            </Card>
          ))}
        </ul>
      </div>
    </>
  );
}
