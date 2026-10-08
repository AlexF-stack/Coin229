"use client";

import { useState, useTransition } from "react";
import type {
  Order,
  OrderItem,
  Product,
  Client,
  OrderStatus,
} from "@prisma/client";
import { markOrderRefundDone, updateOrderStatus } from "@/lib/actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { allowedNextStatuses } from "@/lib/order-status-rules";
import { ZONE_LABELS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { Card } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { ShoppingCart } from "lucide-react";

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[];
  client: Client;
  vendor?: { id: string; nomBoutique: string };
};

type Props = {
  orders: OrderWithRelations[];
};

export function AdminOrders({ orders }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();
  const [local, setLocal] = useState(orders);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function markRefunded(order: OrderWithRelations) {
    if (
      !(await confirm({
        title: "Remboursement effectué ?",
        message: `Confirme que ${formatPrice(order.montantTotal)} ont bien été remboursés à ${order.nomClient} (${order.telephone}).`,
        confirmLabel: "Oui, remboursé",
      }))
    ) {
      return;
    }
    startTransition(async () => {
      const res = await markOrderRefundDone(order.id);
      if (!res.success) {
        setErrors((e) => ({ ...e, [order.id]: res.error }));
        return;
      }
      setErrors((e) => ({ ...e, [order.id]: "" }));
      setLocal((prev) => prev.map((o) => (o.id === order.id ? { ...o, refundStatus: "done" } : o)));
    });
  }

  async function changeStatus(order: OrderWithRelations, statut: OrderStatus) {
    if (statut === order.statut) return;
    const paid = order.modePaiement === "mobile_money" && order.statut !== "en_attente";
    if (
      statut === "annulee" &&
      !(await confirm({
        title: paid ? "Annuler cette commande payée ?" : "Annuler cette commande ?",
        message: paid
          ? "Le stock sera rendu et le client devra être remboursé."
          : "Le stock sera remis en vente.",
        confirmLabel: "Annuler la commande",
        cancelLabel: "Garder",
        danger: true,
      }))
    ) {
      return;
    }
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, statut);
      if (!res.success) {
        setErrors((e) => ({ ...e, [order.id]: res.error ?? "Échec de la mise à jour" }));
        return;
      }
      setErrors((e) => ({ ...e, [order.id]: "" }));
      setLocal((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                statut,
                ...(statut === "annulee"
                  ? {
                      refundStatus:
                        o.modePaiement === "mobile_money" && o.statut !== "en_attente"
                          ? "pending"
                          : "not_applicable",
                    }
                  : {}),
              }
            : o
        )
      );
    });
  }

  if (!local.length) {
    return <EmptyState icon={<ShoppingCart />} title="Aucune commande pour le moment" description="Les commandes de toutes les boutiques apparaîtront ici." />;
  }

  return (
    <>
      {dialog}
      <ul className="grid gap-4 lg:grid-cols-2">
        {local.map((order) => {
          const next = allowedNextStatuses(order, "admin");
          return (
            <Card as="li" key={order.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {order.vendor && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">{order.vendor.nomBoutique}</p>
                  )}
                  <p className="font-medium text-fg">{order.nomClient}</p>
                  <p className="text-xs text-muted">{order.telephone}</p>
                  <p className="mt-1 text-xs text-muted">
                    {ZONE_LABELS[order.zoneLivraison]} · {order.adresseLivraison}
                  </p>
                </div>
                <StatusBadge kind="order" status={order.statut} />
              </div>

              <ul className="space-y-1 rounded-control bg-surface-muted px-3 py-2 text-sm text-fg-secondary">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantite}× {item.product.nom} — {formatPrice(item.prixUnitaireAuMomentCommande)}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-semibold text-fg">{formatPrice(order.montantTotal)}</p>
                <Badge tone="neutral">{order.modePaiement === "livraison" ? "À la livraison" : "Mobile Money"}</Badge>
              </div>

              {next.length > 0 ? (
                <Select
                  aria-label="Changer le statut"
                  controlSize="sm"
                  disabled={pending}
                  value={order.statut}
                  onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                >
                  {/* Statut actuel + seuls passages autorisés (src/lib/order-status-rules.ts) */}
                  {[order.statut, ...next].map((st) => (
                    <option key={st} value={st}>
                      {st === order.statut ? ORDER_STATUS_LABELS[st] : `→ ${ORDER_STATUS_LABELS[st]}`}
                    </option>
                  ))}
                </Select>
              ) : (
                <p className="text-xs text-muted">
                  {order.payoutId ? "Reversée au vendeur — statut verrouillé." : "Statut définitif."}
                </p>
              )}

              {order.refundStatus === "pending" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-warning-soft px-3 py-2">
                  <StatusBadge kind="refund" status="pending" className="bg-transparent px-0" />
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => markRefunded(order)}>
                    Marquer remboursé
                  </Button>
                </div>
              )}
              {order.refundStatus === "done" && <StatusBadge kind="refund" status="done" />}
              {errors[order.id] && (
                <p role="alert" className="text-xs font-medium text-error">
                  {errors[order.id]}
                </p>
              )}
            </Card>
          );
        })}
      </ul>
    </>
  );
}
