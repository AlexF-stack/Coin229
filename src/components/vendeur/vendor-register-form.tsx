"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";

export function VendorRegisterForm() {
  const router = useRouter();
  const [nomBoutique, setNomBoutique] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomBoutique,
          email,
          password,
          contact,
          description: description || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.status === 429) {
        setError("Trop d’inscriptions depuis cette IP. Réessaie plus tard.");
        return;
      }
      if (res.status === 409) {
        setError("Cet email est déjà utilisé.");
        return;
      }
      if (!res.ok) {
        setError("Vérifie les champs (mot de passe ≥ 8 caractères).");
        return;
      }
      router.replace("/vendeur/espace");
      router.refresh();
    });
  }

  const field =
    "w-full rounded-lg border border-white/10 bg-[#0c0d12] px-3 py-3 text-white outline-none focus:border-amber-500/50";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] px-4 py-10 text-[#e8eaed]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-[#14161c] p-6"
      >
        <div className="flex items-center gap-2 text-amber-400">
          <Store className="h-5 w-5 stroke-[1.5]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">
            Devenir vendeur
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white">
          Créer ta marque sur Coin229
        </h1>
        <p className="text-sm text-white/50">
          Après inscription, un admin Coin229 active ton compte avant
          publication publique.
        </p>

        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Nom de boutique</span>
          <input
            required
            minLength={2}
            value={nomBoutique}
            onChange={(e) => setNomBoutique(e.target.value)}
            className={field}
            placeholder="Ma Marque"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={field}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Mot de passe</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={field}
            placeholder="8 caractères minimum"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">WhatsApp / téléphone</span>
          <input
            required
            minLength={8}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className={field}
            placeholder="+229 …"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-white/45">Description (optionnel)</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${field} resize-none`}
            placeholder="Ce que tu vends…"
          />
        </label>

        <p className="text-xs text-white/40">
          En créant un compte, tu acceptes les{" "}
          <Link href="/cgv" target="_blank" className="text-amber-300 hover:underline">
            CGV Coin229
          </Link>
          . Complète ton profil fiscal après inscription.
        </p>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-sm font-semibold text-[#0c0d12] disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Créer mon compte
        </button>
        <p className="text-center text-sm text-white/45">
          Déjà inscrit ?{" "}
          <Link
            href="/vendeur/login"
            className="font-medium text-amber-300 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </div>
  );
}
