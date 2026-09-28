"use client";

import { useTransition } from "react";
import type { Order, OrderItem, Product, OrderStatus } from "@prisma/client";
import { updateMyOrderStatus } from "@/lib/vendor-actions";
import { formatPrice } from "@/lib/utils";
import { Download, Loader2 } from "lucide-react";

type OrderRow = Order & {
  items: (OrderItem & { product: Product })[];
  client: { nom: string } | null;
};

type Props = {
  orders: OrderRow[];
};

const STATUTS: OrderStatus[] = [
  "en_attente",
  "confirmee",
  "en_livraison",
  "livree",
  "annulee",
];

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

export function VendorOrders({ orders }: Props) {
  const [pending, startTransition] = useTransition();

  function setStatut(orderId: string, statut: OrderStatus) {
    startTransition(async () => {
      await updateMyOrderStatus(orderId, statut);
      window.location.reload();
    });
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-[#1a1c24] px-4 py-10 text-center text-sm text-white/45">
        Aucune commande pour ta marque.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => exportCsv(orders)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          Exporter CSV
        </button>
      </div>
      <ul className="space-y-3">
        {orders.map((o) => (
          <li
            key={o.id}
            className="rounded-xl border border-white/10 bg-[#1a1c24] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{o.nomClient}</p>
                <p className="text-xs text-white/45">
                  {o.telephone} · {formatPrice(o.montantTotal)} · net{" "}
                  {formatPrice(o.vendorNet)} ·{" "}
                  {new Date(o.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <select
                value={o.statut}
                disabled={pending}
                onChange={(e) =>
                  setStatut(o.id, e.target.value as OrderStatus)
                }
                className="rounded-lg border border-white/10 bg-[#0c0d12] px-2 py-1.5 text-xs text-white outline-none"
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-white/70">
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.quantite}× {it.product.nom} —{" "}
                  {formatPrice(it.prixUnitaireAuMomentCommande)}
                </li>
              ))}
            </ul>
            {pending && (
              <p className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour…
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
