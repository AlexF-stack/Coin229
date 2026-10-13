"use client";

import { FormEvent, useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type Mode = "login" | "register" | "forgot";

/**
 * Connexion / inscription / mot de passe oublié par email.
 * La connexion reconnaît le rôle (client, vendeur, admin) et redirige vers le bon espace.
 */
export function EmailAuthForm({ next = "/compte" }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  function switchTo(m: Mode) {
    setMode(m);
    setError(null);
    setSent(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const endpoint = { login: "/api/auth/login", register: "/api/auth/register", forgot: "/api/auth/forgot-password" }[mode];
      const payload = mode === "login" ? { email, password, next } : mode === "register" ? { nom, email, password } : { email };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; next?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      if (mode === "forgot") {
        setSent(true);
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

  if (mode === "forgot") {
    return (
      <div className="space-y-4">
        <div>
          <p className="font-display text-base font-semibold text-fg">Mot de passe oublié</p>
          <p className="mt-1 text-sm text-fg-secondary">
            Indique l’email de ton compte. L’équipe Coin229 t’envoie un lien pour choisir un nouveau mot de passe.
          </p>
        </div>
        {sent ? (
          <Alert tone="success" title="Demande envoyée">
            Si un compte existe avec cet email, tu reçois un lien (valable 24 h) sur l’adresse du compte — ou sur le
            WhatsApp de ta boutique si tu es vendeur.
          </Alert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email" required>
              <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
            </Field>
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" size="lg" fullWidth loading={pending}>
              Recevoir un lien
            </Button>
          </form>
        )}
        <p className="text-center text-sm">
          <button type="button" onClick={() => switchTo("login")} className="font-semibold text-primary underline-offset-4 hover:underline">
            Retour à la connexion
          </button>
        </p>
      </div>
    );
  }

  const register = mode === "register";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
      {!register && (
        <div className="-mt-2 flex justify-end">
          <button type="button" onClick={() => switchTo("forgot")} className="text-sm font-medium text-accent-ink hover:underline">
            Mot de passe oublié ?
          </button>
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {register ? "Créer mon compte" : "Se connecter"}
      </Button>
      <p className="text-center text-sm text-fg-secondary">
        {register ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
        <button
          type="button"
          onClick={() => switchTo(register ? "login" : "register")}
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
