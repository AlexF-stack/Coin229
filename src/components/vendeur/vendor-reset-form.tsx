"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, Input } from "@/components/ui/field";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function VendorResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Mot de passe : 8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien invalide ou expiré.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/vendor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 429) {
        setError("Trop de tentatives. Réessaie plus tard.");
        return;
      }
      if (!res.ok) {
        setError(
          data.error === "expired"
            ? "Lien expiré. Demande un nouveau lien."
            : "Lien invalide ou expiré."
        );
        return;
      }
      setDone(true);
    });
  }

  if (!token) {
    return (
      <AuthCard eyebrow="Espace vendeur" title="Lien invalide">
        <p className="text-sm text-fg-secondary">Ce lien de réinitialisation est invalide ou incomplet.</p>
        <Link href="/vendeur/mot-de-passe-oublie" className={buttonClasses({ variant: "outline", fullWidth: true, className: "mt-5" })}>
          Demander un nouveau lien
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Espace vendeur" title="Nouveau mot de passe">
      {done ? (
        <div className="space-y-4">
          <Alert tone="success">Ton mot de passe a été mis à jour. Tu peux te connecter.</Alert>
          <Link href="/vendeur/login" className={buttonClasses({ fullWidth: true })}>
            Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nouveau mot de passe" hint="8 caractères minimum">
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirmer">
            <Input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" loading={pending} fullWidth>
            Enregistrer
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
