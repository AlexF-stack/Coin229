import Link from "next/link";
import { VendorShell } from "@/components/vendeur/vendor-shell";
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
        <div>
          <h1 className="text-2xl font-semibold text-white">Messages</h1>
          <p className="mt-1 text-sm text-white/45">
            Discussions avec tes clients Coin229.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#1a1c24] px-4 py-12 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm text-white/50">
              Aucun message pour l’instant.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10 bg-[#1a1c24]">
            {conversations.map((c) => {
              const last = c.messages[0];
              return (
                <li key={c.id}>
                  <Link
                    href={`/vendeur/espace/messages/${c.id}`}
                    className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">
                        {c.client.nom}
                        {c.vendorUnread > 0 && (
                          <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-[#0c0d12]">
                            {c.vendorUnread}
                          </span>
                        )}
                      </p>
                      {c.client.telephone && (
                        <p className="text-xs text-white/40">
                          {c.client.telephone}
                        </p>
                      )}
                      <p className="mt-1 truncate text-sm text-white/60">
                        {last?.body ?? "Nouvelle conversation"}
                      </p>
                    </div>
                    <time className="shrink-0 text-[11px] text-white/35">
                      {new Date(c.lastMessageAt).toLocaleDateString("fr-FR")}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </VendorShell>
  );
}
