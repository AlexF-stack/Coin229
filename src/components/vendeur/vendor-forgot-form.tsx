"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function VendorForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/vendor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) {
        setError("Trop de demandes. Réessaie plus tard.");
        return;
      }
      if (!res.ok) {
        setError("Impossible d’envoyer le lien. Vérifie l’email.");
        return;
      }
      setSent(true);
    });
  }

  return (
    <AuthCard
      eyebrow="Espace vendeur"
      title="Mot de passe oublié"
      footer={
        <Link href="/vendeur/login" className="font-semibold text-primary underline-offset-4 hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <Alert tone="success" title="Demande enregistrée">
          Si un compte existe avec cet email, l’équipe Coin229 vérifie ton identité puis t’envoie un lien sécurisé
          sur le WhatsApp de ta boutique (valable 24 h).
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-fg-secondary">
            Entre l’email de ta marque. Coin229 t’enverra un lien sécurisé sur le WhatsApp de ta boutique.
          </p>
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@marque.bj"
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" loading={pending} fullWidth>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
