"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/safe-next";
import { AuthCard } from "@/components/ui/auth-card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"), "/admin", "/admin");
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
      if (res.status === 429) {
        setError("Trop de tentatives. Réessaie dans quelques minutes.");
        return;
      }
      if (res.status === 503) {
        setError("Admin non configuré (ADMIN_PASSWORD / ADMIN_SESSION_SECRET).");
        return;
      }
      if (!res.ok) {
        setError("Mot de passe incorrect");
        return;
      }
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <AuthCard eyebrow="Back-office" title="Connexion admin">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Mot de passe">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={pending} fullWidth>
          Entrer
        </Button>
      </form>
    </AuthCard>
  );
}
