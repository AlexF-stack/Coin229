"use client";

import { useState, useTransition } from "react";
import type { VendorStatus } from "@prisma/client";
import type { SafeVendor } from "@/lib/constants";
import { createVendorResetLink, setVendorStatus } from "@/lib/actions";
import { KeyRound, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/feedback";
import { useConfirm } from "@/components/common/confirm-dialog";

type Row = SafeVendor & {
  _count: { products: number; orders: number };
};

type Props = {
  vendors: Row[];
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
      <span className="text-muted">{label} </span>
      <span className={value ? "text-fg" : "font-medium text-error"}>{value || "manquant"}</span>
    </span>
  );
}

export function AdminVendors({ vendors }: Props) {
  const [pending, startTransition] = useTransition();

  const [resetLinks, setResetLinks] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, dialog] = useConfirm();

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
    return <EmptyState icon={<Store />} title="Aucun vendeur inscrit" description="Les marques qui s’inscrivent apparaîtront ici pour validation." />;
  }

  return (
    <>
      {dialog}
      <ul className="space-y-4">
        {vendors.map((v) => (
          <Card as="li" key={v.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display font-semibold text-fg">{v.nomBoutique}</p>
                  <StatusBadge kind="vendor" status={v.statut} />
                </div>
                <p className="text-sm text-fg-secondary">
                  {v.email ?? "sans email"} · {v.contact}
                  {v.slug ? ` · /vendeur/${v.slug}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {v._count.products} produits · {v._count.orders} commandes
                </p>
                <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
                  <KycLine label="IFU" value={v.ifu} />
                  <KycLine label="RCCM" value={v.rccm} />
                  <KycLine label="Mobile Money" value={v.mobileMoney} />
                  <KycLine
                    label="Conditions acceptées"
                    value={v.termsAcceptedAt ? new Date(v.termsAcceptedAt).toLocaleDateString("fr-FR") : null}
                  />
                </p>
                {v.resetRequestedAt && (
                  <Badge tone="warning" icon={<KeyRound />} className="mt-2 whitespace-normal">
                    Nouveau mot de passe demandé le{" "}
                    {new Date(v.resetRequestedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {v.statut !== "actif" && (
                  <Button size="sm" disabled={pending} onClick={() => setStatus(v.id, "actif")}>
                    Activer
                  </Button>
                )}
                {v.statut !== "suspendu" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-error/30 text-error hover:border-error hover:bg-error-soft"
                    disabled={pending}
                    onClick={() => setStatus(v.id, "suspendu")}
                  >
                    Suspendre
                  </Button>
                )}
                {v.statut === "suspendu" && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(v.id, "en_attente")}>
                    Remettre en attente
                  </Button>
                )}
                {v.email && (
                  <Button
                    size="sm"
                    variant={v.resetRequestedAt ? "primary" : "outline"}
                    disabled={pending}
                    onClick={() => sendResetLink(v)}
                  >
                    Envoyer un lien sur WhatsApp
                  </Button>
                )}
              </div>
            </div>
            {resetLinks[v.id] && (
              <p className="mt-3 break-all rounded-control bg-surface-muted px-3 py-2 text-xs text-fg-secondary">
                Lien créé (WhatsApp ouvert dans un nouvel onglet). Si besoin, copie-le :{" "}
                <span className="select-all font-medium text-fg">{resetLinks[v.id]}</span>
              </p>
            )}
            {errors[v.id] && (
              <p role="alert" className="mt-3 text-xs font-medium text-error">
                {errors[v.id]}
              </p>
            )}
            {pending && <Spinner label="Mise à jour…" className="mt-3 text-xs" />}
          </Card>
        ))}
      </ul>
    </>
  );
}
