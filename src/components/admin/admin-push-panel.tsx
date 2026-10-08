"use client";

import { useEffect, useState } from "react";
import { Bell, Send } from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
      <StatCard
        icon={<Bell />}
        label="Abonnés clients"
        value={stats?.subscribers ?? "—"}
        hint={stats?.configured ? "Web Push prêt (VAPID)" : "Configurer NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY"}
        tone={stats && !stats.configured ? "warning" : undefined}
      />

      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <Field label="Titre" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Message" required hint="240 caractères maximum">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={240}
              rows={3}
              placeholder="Ex. -15 % sur les montres aujourd’hui"
            />
          </Field>
          <Field label="Lien" hint="Chemin du site, ex. /boutique">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/boutique" />
          </Field>

          {error && <Alert tone="error">{error}</Alert>}
          {result && <Alert tone="success">{result}</Alert>}

          <Button type="submit" loading={busy} disabled={!stats?.configured || !body.trim()}>
            {!busy && <Send className="h-4 w-4" />}
            Envoyer aux clients abonnés
          </Button>
          <p className="text-xs text-muted">
            Envoie aux clients qui ont activé les alertes nouveautés & promos (pas aux admins ni aux vendeurs). Teste
            d’abord avec un téléphone.
          </p>
        </form>
      </Card>
    </div>
  );
}
