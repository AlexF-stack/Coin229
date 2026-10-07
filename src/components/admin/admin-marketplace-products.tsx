"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { setProductStatusAdmin } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";

type Row = Product & { vendor: { nomBoutique: string; slug: string | null } };

const STATUT_LABEL: Record<string, string> = {
  actif: "En vente",
  rupture: "Rupture",
  archive: "Retiré",
};

/** Modération admin des produits des vendeurs marketplace */
export function AdminMarketplaceProducts({ products }: { products: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState(products);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setStatut(p: Row, statut: "archive" | "actif") {
    if (
      statut === "archive" &&
      !window.confirm(`Retirer « ${p.nom} » (${p.vendor.nomBoutique}) de la vente ?`)
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

  if (!local.length) {
    return <p className="text-sm text-white/45">Aucun produit vendeur.</p>;
  }

  return (
    <ul className="space-y-2">
      {local.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#161920] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/80">
              {p.vendor.nomBoutique}
            </p>
            <Link href={`/produit/${p.id}`} target="_blank" className="block truncate text-sm font-medium text-white hover:underline">
              {p.nom}
            </Link>
            <p className="text-xs text-white/40">
              {formatPrice(p.prixPromo && p.prixPromo < p.prix ? p.prixPromo : p.prix)} · stock {p.stockQuantite} ·{" "}
              <span className={p.statut === "archive" ? "text-red-300" : "text-white/60"}>
                {STATUT_LABEL[p.statut] ?? p.statut}
              </span>
            </p>
            {errors[p.id] && <p role="alert" className="text-xs text-red-300">{errors[p.id]}</p>}
          </div>
          {p.statut === "archive" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatut(p, "actif")}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
            >
              Remettre en vente
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => setStatut(p, "archive")}
              className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10 disabled:opacity-60"
            >
              Retirer de la vente
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
