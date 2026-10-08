"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
        setError(
          data.error === "slug_unavailable"
            ? "Ce nom de boutique est déjà pris ou réservé. Choisis-en un autre."
            : "Cet email est déjà utilisé."
        );
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

  return (
    <AuthCard
      wide
      eyebrow="Devenir vendeur"
      title="Créer ta marque sur Coin229"
      description="Après inscription, un admin Coin229 active ton compte avant la publication de tes produits."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/vendeur/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nom de boutique" required>
          <Input minLength={2} value={nomBoutique} onChange={(e) => setNomBoutique(e.target.value)} placeholder="Ma Marque" />
        </Field>
        <Field label="Email" required>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Mot de passe" hint="8 caractères minimum" required>
          <Input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="WhatsApp / téléphone" required>
          <Input type="tel" minLength={8} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01 97 00 00 00" />
        </Field>
        <Field label="Description (optionnel)">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ce que tu vends…" />
        </Field>
        <p className="text-xs text-muted">
          En créant un compte, tu acceptes les{" "}
          <Link href="/cgv" target="_blank" className="font-medium text-accent-ink hover:underline">
            CGV Coin229
          </Link>
          . Complète ton profil fiscal après inscription.
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={pending} fullWidth>
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
