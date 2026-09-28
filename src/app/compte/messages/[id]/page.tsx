import { notFound, redirect } from "next/navigation";
import { assertClient } from "@/lib/assert-client";
import { getClientConversation } from "@/lib/messaging";
import { ChatThread } from "@/components/messaging/chat-thread";

export const metadata = { title: "Discussion" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ClientConversationPage({ params }: Props) {
  const session = await assertClient();
  if (!session.ok) redirect("/compte?next=/compte/messages");

  const { id } = await params;
  const conv = await getClientConversation(id);
  if (!conv) notFound();

  return (
    <div className="space-y-4 px-4 py-6 md:px-0 md:py-8">
      <ChatThread
        conversationId={conv.id}
        role="client"
        title={conv.vendor.nomBoutique}
        subtitle={conv.subject ?? undefined}
        backHref="/compte/messages"
        initialMessages={conv.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          createdAt: m.createdAt,
        }))}
      />
    </div>
  );
}
