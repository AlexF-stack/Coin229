"use client";

import { useTransition } from "react";
import type { Vendor, VendorStatus } from "@prisma/client";
import { setVendorStatus } from "@/lib/actions";
import { Loader2 } from "lucide-react";

type Row = Vendor & {
  _count: { products: number; orders: number };
};

type Props = {
  vendors: Row[];
};

const LABELS: Record<VendorStatus, string> = {
  actif: "Actif",
  en_attente: "En attente",
  suspendu: "Suspendu",
};

export function AdminVendors({ vendors }: Props) {
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, statut: VendorStatus) {
    startTransition(async () => {
      await setVendorStatus(id, statut);
      window.location.reload();
    });
  }

  if (vendors.length === 0) {
    return (
      <p className="text-sm text-white/45">Aucun vendeur inscrit.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {vendors.map((v) => (
        <li
          key={v.id}
          className="rounded-xl border border-white/10 bg-[#161920] p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{v.nomBoutique}</p>
              <p className="text-xs text-white/45">
                {v.email ?? "sans email"} · {v.contact}
                {v.slug ? ` · /vendeur/${v.slug}` : ""}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {v._count.products} produits · {v._count.orders} commandes ·{" "}
                <span
                  className={
                    v.statut === "actif"
                      ? "text-emerald-400"
                      : v.statut === "en_attente"
                        ? "text-amber-400"
                        : "text-red-400"
                  }
                >
                  {LABELS[v.statut]}
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {v.statut !== "actif" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setStatus(v.id, "actif")}
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0a0b0f] disabled:opacity-60"
                >
                  Activer
                </button>
              )}
              {v.statut !== "suspendu" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setStatus(v.id, "suspendu")}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
                >
                  Suspendre
                </button>
              )}
              {v.statut === "suspendu" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setStatus(v.id, "en_attente")}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
                >
                  Remettre en attente
                </button>
              )}
            </div>
          </div>
          {pending && (
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
              <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour…
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
