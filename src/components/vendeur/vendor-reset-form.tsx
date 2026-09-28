"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Store } from "lucide-react";

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
      <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] px-4 text-[#e8eaed]">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#14161c] p-6 text-center">
          <p className="text-sm text-white/60">Lien de réinitialisation invalide.</p>
          <Link
            href="/vendeur/mot-de-passe-oublie"
            className="text-sm font-medium text-amber-300 hover:underline"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
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
        <h1 className="text-xl font-semibold text-white">Nouveau mot de passe</h1>
        {done ? (
          <>
            <p className="text-sm text-white/60">
              Ton mot de passe a été mis à jour. Tu peux te connecter.
            </p>
            <Link
              href="/vendeur/login"
              className="flex w-full items-center justify-center rounded-lg bg-amber-500 py-3 text-sm font-semibold text-[#0c0d12]"
            >
              Se connecter
            </Link>
          </>
        ) : (
          <>
            <label className="block space-y-1.5 text-sm">
              <span className="text-white/45">Nouveau mot de passe</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-3 text-white outline-none focus:border-amber-500/50"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-white/45">Confirmer</span>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-3 text-white outline-none focus:border-amber-500/50"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </button>
          </>
        )}
      </form>
    </div>
  );
}
