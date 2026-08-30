"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import {
  CHAT_STARTERS,
  getWhatsAppHref,
  type AgentPrefs,
  type ChatProductCard,
} from "@/lib/shop-agent";
import { formatPrice, getEffectivePrice, cn } from "@/lib/utils";

type Msg = {
  id: string;
  role: "bot" | "user";
  text: string;
  quickReplies?: string[];
  products?: ChatProductCard[];
};

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

const WELCOME: Msg = {
  id: "welcome",
  role: "bot",
  text: "Salut ! Je suis l’assistant Coin229.\nJe t’aide partout : budget, style, livraison, paiement… Dis-moi ce que tu cherches.",
  quickReplies: CHAT_STARTERS,
};

export function ShopChatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [prefs, setPrefs] = useState<AgentPrefs>({});
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const greetedPath = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, typing]);

  // Accueil contextualisé une fois par page
  useEffect(() => {
    if (!open) return;
    if (greetedPath.current === pathname) return;
    greetedPath.current = pathname;
    if (pathname === "/" || messages.length > 1) return;

    const hints: Record<string, string> = {
      produit: "Tu regardes une pièce — je peux comparer selon ton budget.",
      panier: "Panier ouvert — livraison, paiement, ou un complément ?",
      commande: "Tunnel commande — une question avant de valider ?",
      boutique: "Boutique — donne-moi un budget, je filtre pour toi.",
      compte: "Compte — suivi commande ou idée cadeau ?",
    };
    const key = Object.keys(hints).find((k) => pathname.includes(k));
    if (!key) return;
    setMessages((prev) => [
      ...prev,
      {
        id: uid("bot"),
        role: "bot",
        text: hints[key]!,
        quickReplies: CHAT_STARTERS,
      },
    ]);
  }, [open, pathname, messages.length]);

  async function pushReply(userText: string) {
    const trimmed = userText.trim();
    if (!trimmed || typing) return;

    setMessages((prev) => [
      ...prev,
      { id: uid("user"), role: "user", text: trimmed },
    ]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          pathname,
          prefs,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid("bot"),
            role: "bot",
            text: "Petit souci réseau. Réessaie, ou passe sur WhatsApp.",
            quickReplies: ["Parler à un humain", "Aide-moi à choisir"],
          },
        ]);
        return;
      }
      setPrefs(data.prefs ?? {});
      setMessages((prev) => [
        ...prev,
        {
          id: uid("bot"),
          role: "bot",
          text: data.text,
          quickReplies: data.quickReplies,
          products: data.products,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid("bot"),
          role: "bot",
          text: "Je n’arrive pas à répondre. WhatsApp reste dispo.",
          quickReplies: ["Parler à un humain"],
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void pushReply(input);
  }

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const showWhatsAppCta =
    Boolean(lastBot) &&
    (/whatsapp|conseiller/i.test(lastBot?.text ?? "") ||
      lastBot?.quickReplies?.includes("Parler à un humain"));

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_20px_50px_rgba(15,45,38,0.18)] md:bottom-24 md:right-8"
          role="dialog"
          aria-label="Assistant Coin229"
        >
          <header className="flex items-center justify-between bg-[#0F2D26] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
                <Sparkles className="h-4 w-4 stroke-[1.5]" />
              </span>
              <div>
                <p className="text-sm font-semibold">Assistant Coin229</p>
                <p className="text-[11px] text-white/65">
                  Guide shopping · budget & style
                </p>
              </div>
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

          <div className="flex max-h-[min(58vh,26rem)] flex-col gap-3 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <div key={m.id} className="flex flex-col gap-2">
                <div
                  className={cn(
                    "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "bot"
                      ? "self-start bg-card text-fg shadow-card md:border md:border-border"
                      : "self-end bg-amber text-navy"
                  )}
                >
                  {m.text}
                </div>

                {m.products && m.products.length > 0 && (
                  <div className="grid gap-2 self-stretch">
                    {m.products.map((p) => {
                      const price = getEffectivePrice(p.prix, p.prixPromo);
                      return (
                        <Link
                          key={p.id}
                          href={p.href}
                          onClick={() => setOpen(false)}
                          className="flex gap-2.5 rounded-xl border border-border bg-bg p-2 transition hover:border-amber"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-card">
                            {p.image ? (
                              <Image
                                src={p.image}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-muted">
                                Coin229
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-fg">
                              {p.nom}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-amber">
                              {formatPrice(price)}
                              {p.prixPromo && p.prixPromo < p.prix && (
                                <span className="ml-1 text-[10px] text-muted line-through">
                                  {formatPrice(p.prix)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] capitalize text-muted">
                              {p.categorie} · voir
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="self-start rounded-2xl bg-card px-3 py-2 text-xs text-muted md:border md:border-border">
                Je cherche les meilleures pièces…
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
                        href={getWhatsAppHref(
                          `Bonjour Coin229 — page ${pathname}`
                        )}
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
                      onClick={() => void pushReply(chip)}
                      className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs font-medium text-fg hover:border-amber hover:text-amber"
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            )}

            {showWhatsAppCta && !typing && (
              <a
                href={getWhatsAppHref(`Bonjour Coin229 — page ${pathname}`)}
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
              placeholder="Ex. montre homme 20 000…"
              className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-amber"
            />
            <button
              type="submit"
              aria-label="Envoyer"
              disabled={typing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber text-navy disabled:opacity-50"
            >
              <Send className="h-4 w-4 stroke-[1.5]" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le chat" : "Ouvrir l’assistant"}
        className={cn(
          "fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.35)] transition hover:scale-105 active:scale-95 md:bottom-8 md:right-8",
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
