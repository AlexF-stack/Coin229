"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function VendorLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/vendeur/espace";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "suspended"
      ? "Compte suspendu. Contacte Coin229."
      : null
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        next?: string;
      };
      if (res.status === 429) {
        setError("Trop de tentatives. Réessaie plus tard.");
        return;
      }
      if (res.status === 403) {
        setError("Compte suspendu. Contacte Coin229.");
        return;
      }
      if (!res.ok) {
        setError("Email ou mot de passe incorrect.");
        return;
      }
      router.replace(data.next || "/vendeur/espace");
      router.refresh();
    });
  }

  return (
    <AuthCard
      eyebrow="Espace vendeur"
      title="Connexion marque"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/vendeur/inscription" className="font-semibold text-primary underline-offset-4 hover:underline">
            S&apos;inscrire
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
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
        <Field label="Mot de passe">
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <div className="flex justify-end">
          <Link href="/vendeur/mot-de-passe-oublie" className="text-sm font-medium text-accent-ink hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={pending} fullWidth>
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
