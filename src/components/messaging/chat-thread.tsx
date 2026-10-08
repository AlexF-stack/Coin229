"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { sendClientMessage, sendVendorMessage } from "@/lib/messaging";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  sender: "client" | "vendor";
  body: string;
  createdAt: string | Date;
};

type Props = {
  conversationId: string;
  role: "client" | "vendor";
  title: string;
  subtitle?: string;
  backHref: string;
  initialMessages: ChatMessage[];
};

export function ChatThread({
  conversationId,
  role,
  title,
  subtitle,
  backHref,
  initialMessages,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [conversationId, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || pending) return;
    setError(null);
    startTransition(async () => {
      const res =
        role === "client"
          ? await sendClientMessage(conversationId, body)
          : await sendVendorMessage(conversationId, body);
      if (!res.success) {
        setError(res.error ?? "Erreur");
        return;
      }
      setText("");
      setMessages((prev) => [
        ...prev,
        {
          id: res.message.id,
          sender: res.message.sender,
          body: res.message.body,
          createdAt: res.message.createdAt,
        },
      ]);
      router.refresh();
    });
  }

  // Même fil pour le client et le vendeur : mes messages en Deep Green, les autres en Cream
  return (
    <div className="flex h-[min(70dvh,640px)] flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href={backHref}
          aria-label="Retour aux discussions"
          className="-ml-1 flex h-9 w-9 items-center justify-center rounded-control text-fg-secondary hover:bg-background hover:text-fg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-fg">{title}</p>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-surface-muted px-4 py-3" aria-live="polite">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-muted">Aucun message — écris le premier.</p>}
        {messages.map((m) => {
          const mine = m.sender === role;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-panel px-3.5 py-2 text-sm leading-relaxed",
                  mine ? "rounded-br-badge bg-primary text-inverse" : "rounded-bl-badge border border-border bg-surface text-fg"
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-inverse/70" : "text-muted")}>
                  {new Date(m.createdAt).toLocaleString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-border p-3">
        <Input
          aria-label="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          maxLength={2000}
          className="flex-1"
        />
        <Button type="submit" loading={pending} disabled={!text.trim()} aria-label="Envoyer" className="shrink-0 px-4">
          {!pending && <Send className="h-4 w-4" />}
        </Button>
      </form>
      {error && (
        <p role="alert" className="px-3 pb-2 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
