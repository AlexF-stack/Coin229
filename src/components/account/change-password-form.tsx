"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** Changer son mot de passe (vendeur ou client email) — les autres appareils sont déconnectés */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmation) {
      setMessage({ tone: "error", text: "Les deux nouveaux mots de passe ne correspondent pas." });
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage({ tone: "error", text: data.error ?? "Changement impossible. Réessaie." });
        return;
      }
      setCurrent("");
      setPassword("");
      setConfirmation("");
      setMessage({ tone: "success", text: "Mot de passe changé. Tes autres appareils ont été déconnectés." });
    } catch {
      setMessage({ tone: "error", text: "Connexion impossible. Vérifie ta connexion internet." });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card as="section" className="max-w-2xl">
      <CardHeader title="Mot de passe" description="Change ton mot de passe de connexion." icon={<KeyRound />} />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Mot de passe actuel" required>
          <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nouveau mot de passe" hint="8 caractères minimum" required>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirmer" required>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Field>
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Button type="submit" variant="outline" loading={pending}>
          Changer le mot de passe
        </Button>
      </form>
    </Card>
  );
}
