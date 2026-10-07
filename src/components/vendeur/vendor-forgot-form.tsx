"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Store } from "lucide-react";

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
    <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] px-4 text-[#e8eaed]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#14161c] p-6"
      >
        <div className="flex items-center gap-2 text-amber-400">
          <Store className="h-5 w-5 stroke-[1.5]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">
            Espace vendeur
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white">Mot de passe oublié</h1>
        {sent ? (
          <p className="text-sm text-white/60">
            Demande enregistrée. Si un compte existe avec cet email, l’équipe
            Coin229 vérifie ton identité puis t’envoie un lien sécurisé sur le
            WhatsApp de ta boutique (valable 24 h).
          </p>
        ) : (
          <>
            <p className="text-sm text-white/50">
              Entre l’email de ta marque. Coin229 t’enverra un lien sécurisé sur
              le WhatsApp de ta boutique.
            </p>
            <label className="block space-y-1.5 text-sm">
              <span className="text-white/45">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-3 text-white outline-none focus:border-amber-500/50"
                placeholder="toi@marque.bj"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Envoyer le lien
            </button>
          </>
        )}
        <p className="text-center text-sm text-white/45">
          <Link
            href="/vendeur/login"
            className="font-medium text-amber-300 hover:underline"
          >
            Retour à la connexion
          </Link>
        </p>
      </form>
    </div>
  );
}
