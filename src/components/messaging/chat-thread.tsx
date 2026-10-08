"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
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
  dark?: boolean;
};

export function ChatThread({
  conversationId,
  role,
  title,
  subtitle,
  backHref,
  initialMessages,
  dark = false,
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

  const bubbleMine = dark
    ? "bg-amber-500 text-[#0c0d12]"
    : "bg-primary text-white";
  const bubbleOther = dark
    ? "bg-white/10 text-white"
    : "bg-background text-primary";

  return (
    <div
      className={cn(
        "flex h-[min(70dvh,640px)] flex-col rounded-xl border",
        dark ? "border-white/10 bg-[#1a1c24]" : "border-border bg-white"
      )}
    >
      <header
        className={cn(
          "flex items-center gap-3 border-b px-4 py-3",
          dark ? "border-white/10" : "border-border"
        )}
      >
        <Link
          href={backHref}
          className={cn(
            "text-sm",
            dark ? "text-white/50 hover:text-white" : "text-muted hover:text-primary"
          )}
        >
          ← Retour
        </Link>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate font-medium",
              dark ? "text-white" : "text-primary"
            )}
          >
            {title}
          </p>
          {subtitle && (
            <p
              className={cn(
                "truncate text-xs",
                dark ? "text-white/45" : "text-muted"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p
            className={cn(
              "py-8 text-center text-sm",
              dark ? "text-white/40" : "text-muted"
            )}
          >
            Aucun message — écris le premier.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === role;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  mine ? bubbleMine : bubbleOther
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={cn(
                    "mt-1 text-[10px]",
                    mine
                      ? dark
                        ? "text-[#0c0d12]/60"
                        : "text-white/70"
                      : dark
                        ? "text-white/40"
                        : "text-muted"
                  )}
                >
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

      <form
        onSubmit={onSubmit}
        className={cn(
          "flex gap-2 border-t p-3",
          dark ? "border-white/10" : "border-border"
        )}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          maxLength={2000}
          className={cn(
            "flex-1 rounded-lg border px-3 py-2.5 text-sm outline-none",
            dark
              ? "border-white/10 bg-[#0c0d12] text-white focus:border-amber-500/50"
              : "border-border bg-white text-primary focus:border-primary"
          )}
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className={cn(
            "inline-flex items-center justify-center rounded-lg px-3 py-2.5 disabled:opacity-50",
            dark
              ? "bg-amber-500 text-[#0c0d12]"
              : "bg-primary text-white"
          )}
          aria-label="Envoyer"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
