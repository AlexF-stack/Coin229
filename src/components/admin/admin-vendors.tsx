"use client";

import { useState, useTransition } from "react";
import type { VendorStatus } from "@prisma/client";
import type { SafeVendor } from "@/lib/constants";
import { createVendorResetLink, setVendorStatus } from "@/lib/actions";
import { KeyRound, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/common/confirm-dialog";

type Row = SafeVendor & {
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

/** Informations KYC attendues avant d'activer un vendeur */
function missingKyc(v: Row): string[] {
  const missing: string[] = [];
  if (!v.ifu?.trim()) missing.push("IFU");
  if (!v.rccm?.trim()) missing.push("RCCM");
  if (!v.mobileMoney?.trim()) missing.push("numéro Mobile Money de reversement");
  if (!v.termsAcceptedAt) missing.push("acceptation des conditions vendeur");
  return missing;
}

function KycLine({ label, value }: { label: string; value: string | null }) {
  return (
    <span>
      <span className="text-white/35">{label} </span>
      <span className={value ? "text-white/75" : "text-red-300"}>{value || "manquant"}</span>
    </span>
  );
}

export function AdminVendors({ vendors }: Props) {
  const [pending, startTransition] = useTransition();

  const [resetLinks, setResetLinks] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, dialog] = useConfirm("dark");

  async function setStatus(id: string, statut: VendorStatus) {
    const v = vendors.find((x) => x.id === id);
    const missing = v ? missingKyc(v) : [];
    if (
      statut === "actif" &&
      missing.length > 0 &&
      !(await confirm({
        title: `KYC incomplet pour ${v?.nomBoutique}`,
        message: `Manquant : ${missing.join(", ")}.\n\nActiver quand même ?`,
        confirmLabel: "Activer quand même",
      }))
    ) {
      return;
    }
    if (
      statut === "suspendu" &&
      !(await confirm({
        title: `Suspendre ${v?.nomBoutique} ?`,
        message: "Ses produits seront retirés de la vente.",
        confirmLabel: "Suspendre",
        danger: true,
      }))
    ) {
      return;
    }
    startTransition(async () => {
      await setVendorStatus(id, statut);
      window.location.reload();
    });
  }

  async function sendResetLink(v: Row) {
    if (
      !(await confirm({
        title: `Nouveau mot de passe pour ${v.nomBoutique} ?`,
        message: `Vérifie d’abord que la demande vient bien du vendeur (appel au ${v.contact}). Le lien est valable 24 h, une seule fois.`,
        confirmLabel: "Créer le lien",
      }))
    ) {
      return;
    }
    setErrors((e) => ({ ...e, [v.id]: "" }));
    startTransition(async () => {
      const res = await createVendorResetLink(v.id);
      if (!res.success) {
        setErrors((e) => ({ ...e, [v.id]: res.error }));
        return;
      }
      setResetLinks((l) => ({ ...l, [v.id]: res.resetUrl }));
      if (res.whatsappUrl) window.open(res.whatsappUrl, "_blank", "noopener");
    });
  }

  if (vendors.length === 0) {
    return (
      <p className="text-sm text-white/45">Aucun vendeur inscrit.</p>
    );
  }

  return (
    <>
      {dialog}
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
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <KycLine label="IFU" value={v.ifu} />
                  <KycLine label="RCCM" value={v.rccm} />
                  <KycLine label="Mobile Money" value={v.mobileMoney} />
                  <KycLine
                    label="Conditions acceptées"
                    value={v.termsAcceptedAt ? new Date(v.termsAcceptedAt).toLocaleDateString("fr-FR") : null}
                  />
                </p>
                {v.resetRequestedAt && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
                    <KeyRound className="h-3.5 w-3.5" />
                    Nouveau mot de passe demandé le{" "}
                    {new Date(v.resetRequestedAt).toLocaleString("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                )}
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
                {v.email && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => sendResetLink(v)}
                    className={
                      v.resetRequestedAt
                        ? "rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-[#0a0b0f] disabled:opacity-60"
                        : "rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
                    }
                  >
                    Envoyer un lien sur WhatsApp
                  </button>
                )}
              </div>
            </div>
            {resetLinks[v.id] && (
              <p className="mt-2 break-all text-xs text-white/55">
                Lien créé (WhatsApp ouvert dans un nouvel onglet). Si besoin, copie-le :{" "}
                <span className="select-all text-white/80">{resetLinks[v.id]}</span>
              </p>
            )}
            {errors[v.id] && (
              <p role="alert" className="mt-2 text-xs text-red-300">
                {errors[v.id]}
              </p>
            )}
            {pending && (
              <p className="mt-2 flex items-center gap-1 text-xs text-emerald-300">
                <Loader2 className="h-3 w-3 animate-spin" /> Mise à jour…
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
