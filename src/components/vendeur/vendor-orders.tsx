"use client";

import { useState, useTransition } from "react";
import type { Order, OrderItem, Product, OrderStatus } from "@prisma/client";
import { updateMyOrderStatus } from "@/lib/vendor-actions";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  allowedNextStatuses,
  STATUS_ACTION_LABELS,
} from "@/lib/order-status-rules";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { Download, Loader2 } from "lucide-react";

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
  const [confirm, dialog] = useConfirm("dark");
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
      <p className="rounded-xl border border-white/10 bg-[#1a1c24] px-4 py-10 text-center text-sm text-white/45">
        Aucune commande pour ta marque.
      </p>
    );
  }

  return (
    <>
      {dialog}
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
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                  {ORDER_STATUS_LABELS[o.statut]}
                  {o.modePaiement === "mobile_money" ? " · Mobile Money" : " · à la livraison"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {allowedNextStatuses(o, "vendor").map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={pending}
                    onClick={() => setStatut(o.id, s)}
                    className={
                      s === "annulee"
                        ? "rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                        : "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-[#0c0d12] hover:bg-amber-400 disabled:opacity-50"
                    }
                  >
                    {STATUS_ACTION_LABELS[s]}
                  </button>
                ))}
                {waitingNote(o) && (
                  <span className="text-xs text-white/45">{waitingNote(o)}</span>
                )}
              </div>
              {errors[o.id] && (
                <p role="alert" className="mt-2 text-xs text-red-300">
                  {errors[o.id]}
                </p>
              )}
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                {o.items.map((it) => (
                  <li key={it.id}>
                    {it.quantite}× {it.product.nom} —{" "}
                    {formatPrice(it.prixUnitaireAuMomentCommande)}
                  </li>
                ))}
              </ul>
              {pending && busyId === o.id && (
                <p className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                  <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour…
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
