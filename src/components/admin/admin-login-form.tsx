"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Mot de passe incorrect");
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0a0b0f] px-4 text-[#e8eaed]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#111318] p-6"
      >
        <div className="flex items-center gap-2 text-emerald-400">
          <Lock className="h-5 w-5 stroke-[1.5]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">
            Back-office
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white">Connexion vendeur</h1>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-lg border border-white/10 bg-[#0a0b0f] px-3 py-3 text-white outline-none focus:border-emerald-500/50"
            placeholder="••••••••"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-[#0a0b0f] disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrer
        </button>
      </form>
    </div>
  );
}
