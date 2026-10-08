import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

export const metadata = {
  title: "Connexion échouée",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const message =
    reason === "config"
      ? "Supabase n’est pas encore configuré pour Google / Facebook."
      : "La connexion sociale a échoué. Réessaie ou utilise ton numéro.";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Connexion interrompue</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <Link
        href="/compte"
        className={buttonClasses({ className: "mt-8" })}
      >
        Retour à la connexion
      </Link>
    </div>
  );
}
