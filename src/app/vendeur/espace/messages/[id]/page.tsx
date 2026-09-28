import { notFound } from "next/navigation";
import { VendorShell } from "@/components/vendeur/vendor-shell";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getVendorConversation, getVendorUnreadTotal } from "@/lib/messaging";
import { ChatThread } from "@/components/messaging/chat-thread";

export const metadata = { title: "Discussion client" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function VendorConversationPage({ params }: Props) {
  const session = await requireVendorPage();
  const { id } = await params;
  const [conv, unreadMessages] = await Promise.all([
    getVendorConversation(id),
    getVendorUnreadTotal(),
  ]);
  if (!conv) notFound();

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <ChatThread
        conversationId={conv.id}
        role="vendor"
        title={conv.client.nom}
        subtitle={
          conv.subject ||
          conv.client.telephone ||
          undefined
        }
        backHref="/vendeur/espace/messages"
        dark
        initialMessages={conv.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          createdAt: m.createdAt,
        }))}
      />
    </VendorShell>
  );
}
