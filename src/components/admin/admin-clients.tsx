"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail, Users } from "lucide-react";
import { createClientResetLink } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useConfirm } from "@/components/common/confirm-dialog";

type Row = {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  resetRequestedAt: Date | null;
  _count: { orders: number };
};

/** Comptes client email : demandes « mot de passe oublié » et envoi du lien */
export function AdminClients({ clients }: { clients: Row[] }) {
  const [pending, startTransition] = useTransition();
  const [confirm, dialog] = useConfirm();
  const [links, setLinks] = useState<Record<string, { url: string; mailto: string }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function sendLink(c: Row) {
    if (
      !(await confirm({
        title: `Nouveau mot de passe pour ${c.nom} ?`,
        message: `Le lien (24 h, une seule fois) sera envoyé à l’adresse du compte : ${c.email}. Seul son propriétaire pourra l’ouvrir.`,
        confirmLabel: "Créer le lien",
      }))
    ) {
      return;
    }
    startTransition(async () => {
      const res = await createClientResetLink(c.id);
      if (!res.success) {
        setErrors((e) => ({ ...e, [c.id]: res.error }));
        return;
      }
      setLinks((l) => ({ ...l, [c.id]: { url: res.resetUrl, mailto: res.mailto } }));
      // Ouvre la messagerie de l'admin avec l'email prêt à envoyer
      window.location.href = res.mailto;
    });
  }

  return (
    <>
      {dialog}
      <DataTable
        caption="Comptes client email"
        rows={clients}
        rowKey={(c) => c.id}
        empty={
          <EmptyState
            icon={<Users />}
            title="Aucun compte client email"
            description="Les clients qui créent un compte avec email et mot de passe apparaîtront ici."
          />
        }
        columns={[
          {
            key: "client",
            header: "Client",
            primary: true,
            cell: (c) => (
              <div className="min-w-0">
                <p className="font-medium">{c.nom}</p>
                <p className="text-xs text-muted">{c.email}</p>
                {links[c.id] && (
                  <p className="mt-1 break-all text-xs text-fg-secondary">
                    Lien créé : <span className="select-all font-medium text-fg">{links[c.id].url}</span>
                  </p>
                )}
                {errors[c.id] && (
                  <p role="alert" className="mt-1 text-xs font-medium text-error">
                    {errors[c.id]}
                  </p>
                )}
              </div>
            ),
          },
          { key: "commandes", header: "Commandes", align: "right", cell: (c) => c._count.orders },
          {
            key: "demande",
            header: "Mot de passe",
            cell: (c) =>
              c.resetRequestedAt ? (
                <Badge tone="warning" icon={<KeyRound />}>
                  Demandé le {new Date(c.resetRequestedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </Badge>
              ) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            actions: true,
            align: "right",
            cell: (c) =>
              links[c.id] ? (
                <a href={links[c.id].mailto} className={buttonClasses({ size: "sm", variant: "outline" })}>
                  <Mail className="h-4 w-4" />
                  Renvoyer l’email
                </a>
              ) : (
                <Button size="sm" variant={c.resetRequestedAt ? "primary" : "outline"} disabled={pending} onClick={() => sendLink(c)}>
                  <Mail className="h-4 w-4" />
                  Envoyer un lien
                </Button>
              ),
          },
        ]}
      />
    </>
  );
}
