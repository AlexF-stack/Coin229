"use client";

import { useState, useTransition } from "react";
import type { VendorPayout } from "@prisma/client";
import { createVendorPayout } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { useConfirm } from "@/components/common/confirm-dialog";
import { Loader2 } from "lucide-react";

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

const PAYOUT_LABEL = {
  pending: "En attente",
  paid: "Payé",
  cancelled: "Annulé",
} as const;

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
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">
            À reverser
          </h2>
          {unpaidVendors.length === 0 ? (
            <p className="text-sm text-white/45">Aucun reversement en attente.</p>
          ) : (
            <ul className="space-y-3">
              {unpaidVendors.map((v) => (
                <li
                  key={v.vendorId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#161920] p-4"
                >
                  <div>
                    <p className="font-medium text-white">{v.nomBoutique}</p>
                    <p className="text-xs text-white/45">
                      {v.email ?? "sans email"} · {v.orderCount} commande(s) ·{" "}
                      <span className="text-emerald-300">{formatPrice(v.vendorNet)}</span>
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Reverser sur le Mobile Money :{" "}
                      <span className="select-all font-medium text-white">{v.mobileMoney ?? "non renseigné"}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => markPaid(v)}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-[#0a0b0f] disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Marquer reversé"
                    )}
                  </button>
                  {errors[v.vendorId] && (
                    <p role="alert" className="w-full text-xs text-red-300">
                      {errors[v.vendorId]}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/45">
            Reversements récents
          </h2>
          {recentPayouts.length === 0 ? (
            <p className="text-sm text-white/45">Aucun historique.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#161920]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Vendeur</th>
                    <th className="px-4 py-3 font-medium">Montant</th>
                    <th className="px-4 py-3 font-medium">Commandes</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentPayouts.map((p) => (
                    <tr key={p.id} className="text-white/75">
                      <td className="px-4 py-3 text-white/50">
                        {new Date(p.dateCreation).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">{p.vendor.nomBoutique}</td>
                      <td className="px-4 py-3 font-medium text-emerald-300">
                        {formatPrice(p.amount)}
                      </td>
                      <td className="px-4 py-3">{p._count.orders}</td>
                      <td className="px-4 py-3 text-xs">
                        {PAYOUT_LABEL[p.statut]}
                        {p.datePaid && (
                          <span className="ml-1 text-white/35">
                            · {new Date(p.datePaid).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
