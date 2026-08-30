"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";

type Stats = {
  configured: boolean;
  subscribers: number;
};

export function AdminPushPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [title, setTitle] = useState("Nouveauté Coin229");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/boutique");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStats() {
    try {
      const res = await fetch("/api/admin/push");
      const data = await res.json();
      if (res.ok && data.ok) {
        setStats({
          configured: Boolean(data.configured),
          subscribers: Number(data.subscribers) || 0,
        });
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  async function send() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(
          data.error === "push_disabled"
            ? "VAPID non configuré sur le serveur."
            : "Envoi impossible."
        );
        return;
      }
      setResult(
        `Envoyé ${data.sent}/${data.total}` +
          (data.failed ? ` · ${data.failed} échec(s)` : "") +
          (data.pruned ? ` · ${data.pruned} abonnement(s) purgé(s)` : "")
      );
      await loadStats();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#161920] p-4">
        <div className="flex items-center gap-2 text-white/45">
          <Bell className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide">Abonnés</span>
        </div>
        <p className="mt-2 text-3xl font-semibold text-white">
          {stats?.subscribers ?? "—"}
        </p>
        <p className="mt-1 text-xs text-white/40">
          {stats?.configured
            ? "Web Push prêt (VAPID)"
            : "Configurer NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY"}
        </p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-white/10 bg-[#161920] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div>
          <label className="text-xs text-white/45" htmlFor="push-title">
            Titre
          </label>
          <input
            id="push-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            required
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-white/45" htmlFor="push-body">
            Message
          </label>
          <textarea
            id="push-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={240}
            required
            rows={3}
            placeholder="Ex. -15 % sur les lunettes aujourd’hui"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-white/45" htmlFor="push-url">
            Lien (chemin relatif)
          </label>
          <input
            id="push-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/boutique"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {result && <p className="text-sm text-emerald-400">{result}</p>}

        <button
          type="submit"
          disabled={busy || !stats?.configured || !body.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#0a0b0f] hover:bg-emerald-400 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Envoyer à tous les abonnés
        </button>
        <p className="text-xs text-white/35">
          Envoie à tous les appareils opt-in. Teste d’abord avec 1 téléphone.
        </p>
      </form>
    </div>
  );
}
