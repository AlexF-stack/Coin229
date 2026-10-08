import Link from "next/link";
import { redirect } from "next/navigation";
import { assertClient } from "@/lib/assert-client";
import { listClientConversations } from "@/lib/messaging";
import { MessageCircle } from "lucide-react";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ClientMessagesPage() {
  const session = await assertClient();
  if (!session.ok) redirect("/compte?next=/compte/messages");

  const conversations = await listClientConversations();

  return (
    <div className="space-y-6 py-6 md:py-8">
      <header className="px-4 md:px-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          Compte
        </p>
        <h1 className="font-display text-2xl font-bold text-primary">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Discussions avec les marques Coin229.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 font-display text-lg font-semibold text-primary">
            Aucune discussion
          </p>
          <p className="mt-2 text-sm text-muted">
            Sur une fiche produit, appuie sur « Contacter la marque ».
          </p>
          <Link href="/boutique" className="btn btn-primary mt-6 inline-flex">
            Voir la boutique
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border md:rounded-xl md:border">
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link
                  href={`/compte/messages/${c.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-4 hover:bg-background/60"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-primary">
                      {c.vendor.nomBoutique}
                      {c.clientUnread > 0 && (
                        <span className="ml-2 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {c.clientUnread}
                        </span>
                      )}
                    </p>
                    {c.subject && (
                      <p className="text-xs text-muted">{c.subject}</p>
                    )}
                    <p className="mt-1 truncate text-sm text-muted">
                      {last?.body ?? "Nouvelle conversation"}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11px] text-muted">
                    {new Date(c.lastMessageAt).toLocaleDateString("fr-FR")}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
