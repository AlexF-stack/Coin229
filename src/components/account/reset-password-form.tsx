"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** Choisir un nouveau mot de passe depuis le lien reçu (client) */
export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; next?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Lien invalide ou expiré.");
        return;
      }
      window.location.href = data.next || "/compte";
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-ink">Mon compte</p>
      <h1 className="mt-1 font-display text-xl font-semibold text-fg">Nouveau mot de passe</h1>
      {!token ? (
        <div className="mt-5 space-y-4">
          <Alert tone="error">Ce lien est incomplet. Demande un nouveau lien depuis la page de connexion.</Alert>
          <Link href="/compte" className={buttonClasses({ variant: "outline", fullWidth: true })}>
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <Field label="Nouveau mot de passe" hint="8 caractères minimum" required>
            <Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
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
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" fullWidth loading={pending}>
            Enregistrer et me connecter
          </Button>
        </form>
      )}
    </Card>
  );
}
