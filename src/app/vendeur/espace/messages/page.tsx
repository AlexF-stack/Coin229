import Link from "next/link";
import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { listVendorConversations } from "@/lib/messaging";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "Messages clients" };
export const dynamic = "force-dynamic";

export default async function VendorMessagesPage() {
  const session = await requireVendorPage();
  const conversations = await listVendorConversations();
  const unreadMessages = conversations.reduce((s, c) => s + c.vendorUnread, 0);

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        <PageHeader title="Messages" description="Discussions avec tes clients Coin229." />

        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle />}
            title="Aucun message pour l’instant"
            description="Les questions de tes clients sur tes produits arriveront ici."
          />
        ) : (
          <Card as="section" padding="none" className="overflow-hidden">
            <ul className="divide-y divide-border">
              {conversations.map((c) => {
                const last = c.messages[0];
                return (
                  <li key={c.id}>
                    <Link
                      href={`/vendeur/espace/messages/${c.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-surface-muted"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium text-fg">
                          {c.client.nom}
                          {c.vendorUnread > 0 && (
                            <Badge tone="accent" variant="solid" aria-label={`${c.vendorUnread} non lu(s)`}>
                              {c.vendorUnread}
                            </Badge>
                          )}
                        </p>
                        {c.client.telephone && <p className="text-xs text-muted">{c.client.telephone}</p>}
                        <p className="mt-1 truncate text-sm text-fg-secondary">{last?.body ?? "Nouvelle conversation"}</p>
                      </div>
                      <time className="shrink-0 text-xs text-muted">
                        {new Date(c.lastMessageAt).toLocaleDateString("fr-FR")}
                      </time>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </VendorShell>
  );
}
