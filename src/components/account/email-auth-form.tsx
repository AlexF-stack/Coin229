"use client";

import { FormEvent, useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/**
 * Connexion / inscription par email + mot de passe.
 * La connexion reconnaît le rôle (client, vendeur, admin) et redirige vers le bon espace.
 */
export function EmailAuthForm({ next = "/compte" }: { next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password, next } : { nom, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; next?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      // Rechargement complet : chaque espace lit sa session côté serveur
      window.location.href = data.next || "/compte";
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
    } finally {
      setPending(false);
    }
  }

  const register = mode === "register";
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      {register && (
        <Field label="Nom" required>
          <Input autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Aïcha Dossou" />
        </Field>
      )}
      <Field label="Email" required>
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
      </Field>
      <Field label="Mot de passe" required hint={register ? "8 caractères minimum" : undefined}>
        <Input
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {register ? "Créer mon compte" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-fg-secondary">
        {register ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(register ? "login" : "register");
            setError(null);
          }}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {register ? "Se connecter" : "Créer un compte"}
        </button>
      </p>
      {!register && (
        <p className="text-center text-xs text-muted">
          Clients, marques et équipe Coin229 : un seul formulaire, tu arrives directement dans ton espace.
        </p>
      )}
    </form>
  );
}
