"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X } from "lucide-react";
import {
  WELCOME_MESSAGE,
  createBotMessage,
  createUserMessage,
  getWhatsAppHref,
  replyToUser,
  type ChatMessage,
} from "@/lib/chatbot";
import { cn } from "@/lib/utils";

export function ShopChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, typing]);

  function pushReply(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, createUserMessage(trimmed)]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      const reply = replyToUser(trimmed);
      setMessages((prev) => [
        ...prev,
        createBotMessage(reply.text, reply.quickReplies),
      ]);
      setTyping(false);
    }, 450 + Math.min(trimmed.length * 8, 400));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    pushReply(input);
  }

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const showWhatsAppCta = /whatsapp|conseiller/i.test(lastBot?.text ?? "");

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_50px_rgba(2,11,38,0.15)] md:bottom-24 md:right-8"
          role="dialog"
          aria-label="Assistant Coin229"
        >
          <header className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Assistant Coin229</p>
              <p className="text-[11px] text-white/70">Réponse rapide</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/10"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </header>

          <div className="flex max-h-[min(55vh,22rem)] flex-col gap-3 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "bot"
                    ? "self-start bg-card text-fg shadow-card md:border md:border-border"
                    : "self-end bg-amber text-navy"
                )}
              >
                {m.text}
              </div>
            ))}

            {typing && (
              <div className="self-start rounded-2xl bg-card px-3 py-2 text-xs text-muted md:border md:border-border">
                En train d’écrire…
              </div>
            )}

            {lastBot?.quickReplies && !typing && (
              <div className="flex flex-wrap gap-1.5">
                {lastBot.quickReplies.map((chip) => {
                  if (chip === "Voir la boutique") {
                    return (
                      <Link
                        key={chip}
                        href="/boutique"
                        onClick={() => setOpen(false)}
                        className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-fg hover:border-amber hover:text-amber"
                      >
                        {chip}
                      </Link>
                    );
                  }
                  if (chip === "Parler à un humain") {
                    return (
                      <a
                        key={chip}
                        href={getWhatsAppHref()}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        WhatsApp
                      </a>
                    );
                  }
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => pushReply(chip)}
                      className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-fg hover:border-amber hover:text-amber"
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}

            {showWhatsAppCta && (
              <a
                href={getWhatsAppHref()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4 stroke-[1.5]" />
                Continuer sur WhatsApp
              </a>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-border p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écris ta question…"
              className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-amber"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber text-navy"
            >
              <Send className="h-4 w-4 stroke-[1.5]" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
        className={cn(
          "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_30px_rgba(201,162,39,0.35)] transition hover:scale-105 active:scale-95 md:bottom-8 md:right-8",
          "animate-[fab-in_0.5s_ease-out_both]",
          open
            ? "border border-border bg-white text-navy shadow-md"
            : "bg-amber text-navy"
        )}
      >
        {open ? (
          <X className="h-6 w-6 stroke-[1.5]" />
        ) : (
          <MessageCircle className="h-7 w-7 stroke-[1.5]" />
        )}
      </button>
    </>
  );
}
