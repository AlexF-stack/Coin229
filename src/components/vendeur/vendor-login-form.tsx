"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Store } from "lucide-react";

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
        <h1 className="text-xl font-semibold text-white">Connexion marque</h1>
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
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Mot de passe</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-3 text-white outline-none focus:border-amber-500/50"
            placeholder="••••••••"
          />
        </label>
        <div className="flex justify-end">
          <Link
            href="/vendeur/mot-de-passe-oublie"
            className="text-xs text-amber-300/90 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Se connecter
        </button>
        <p className="text-center text-sm text-white/45">
          Pas encore de compte ?{" "}
          <Link
            href="/vendeur/inscription"
            className="font-medium text-amber-300 hover:underline"
          >
            S&apos;inscrire
          </Link>
        </p>
      </form>
    </div>
  );
}
