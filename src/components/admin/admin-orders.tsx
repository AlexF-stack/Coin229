"use client";

import { useState, useTransition } from "react";
import type {
  Order,
  OrderItem,
  Product,
  Client,
  OrderStatus,
} from "@prisma/client";
import { updateOrderStatus } from "@/lib/actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { allowedNextStatuses } from "@/lib/order-status-rules";
import { ZONE_LABELS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[];
  client: Client;
  vendor?: { id: string; nomBoutique: string };
};

const statusTone: Record<OrderStatus, string> = {
  en_attente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmee: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  en_livraison: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  livree: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  annulee: "bg-white/5 text-white/40 border-white/10",
};

type Props = {
  orders: OrderWithRelations[];
};

export function AdminOrders({ orders }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm("dark");
  const [local, setLocal] = useState(orders);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
                          : "n/a",
                    }
                  : {}),
              }
            : o
        )
      );
    });
  }

  if (!local.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#161920] p-6 text-sm text-white/45">
        Aucune commande pour le moment.
      </p>
    );
  }

  return (
    <>
      {dialog}
      <ul className="space-y-3">
        {local.map((order) => (
          <li
            key={order.id}
            className="space-y-3 rounded-xl border border-white/10 bg-[#161920] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                {order.vendor && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">
                    {order.vendor.nomBoutique}
                  </p>
                )}
                <p className="font-medium text-white">{order.nomClient}</p>
                <p className="text-xs text-white/40">{order.telephone}</p>
                <p className="mt-1 text-xs text-white/40">
                  {ZONE_LABELS[order.zoneLivraison]} · {order.adresseLivraison}
                </p>
              </div>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${statusTone[order.statut]}`}
              >
                {ORDER_STATUS_LABELS[order.statut]}
              </span>
            </div>
            <ul className="text-sm text-white/50">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantite}× {item.product.nom} —{" "}
                  {formatPrice(item.prixUnitaireAuMomentCommande)}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-emerald-300">
                {formatPrice(order.montantTotal)}
              </p>
              <p className="text-xs text-white/40">
                {order.modePaiement === "livraison"
                  ? "À la livraison"
                  : "Mobile Money"}
              </p>
            </div>
            {allowedNextStatuses(order, "admin").length > 0 ? (
              <select
                disabled={pending}
                value={order.statut}
                onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0b0f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              >
                {/* Statut actuel + seuls passages autorisés (src/lib/order-status-rules.ts) */}
                {[order.statut, ...allowedNextStatuses(order, "admin")].map((s) => (
                  <option key={s} value={s}>
                    {s === order.statut ? ORDER_STATUS_LABELS[s] : `→ ${ORDER_STATUS_LABELS[s]}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-white/40">
                {order.payoutId ? "Reversée au vendeur — statut verrouillé." : "Statut définitif."}
              </p>
            )}
            {order.refundStatus === "pending" && (
              <p className="text-xs font-medium text-amber-300">Remboursement à faire</p>
            )}
            {errors[order.id] && (
              <p role="alert" className="text-xs text-red-300">
                {errors[order.id]}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
