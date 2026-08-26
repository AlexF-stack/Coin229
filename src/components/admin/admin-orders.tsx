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
import { ZONE_LABELS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

type OrderWithRelations = Order & {
  items: (OrderItem & { product: Product })[];
  client: Client;
};

const statuses: OrderStatus[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

const statusTone: Record<OrderStatus, string> = {
  en_attente: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  confirmee: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  en_livraison: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  livree: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  annulee: "bg-white/5 text-white/40 border-white/10",
};

type Props = {
  orders: OrderWithRelations[];
  vendorId: string;
};

export function AdminOrders({ orders, vendorId }: Props) {
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(orders);

  function changeStatus(orderId: string, statut: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, statut, vendorId);
      if (res.success) {
        setLocal((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, statut } : o))
        );
      }
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
    <ul className="space-y-3">
      {local.map((order) => (
        <li
          key={order.id}
          className="space-y-3 rounded-xl border border-white/10 bg-[#161920] p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
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
          <select
            disabled={pending}
            value={order.statut}
            onChange={(e) =>
              changeStatus(order.id, e.target.value as OrderStatus)
            }
            className="w-full rounded-lg border border-white/10 bg-[#0a0b0f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
