import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function ConfirmationPage({ searchParams }: Props) {
  const { id } = await searchParams;

  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <CheckCircle2 className="h-16 w-16 stroke-[1.25] text-green" />
      <h1 className="mt-4 font-display text-2xl font-bold">Commande confirmée</h1>
      <p className="mt-2 text-sm text-muted">
        Merci ! Notre équipe te contacte bientôt pour la livraison.
      </p>
      {id && (
        <p className="mt-3 rounded-[20px] bg-card px-3 py-1.5 text-xs text-muted">
          Réf. {id}
        </p>
      )}
      <div className="mt-8 flex w-full flex-col gap-3">
        <Link
          href="/"
          className="rounded-[16px] bg-amber py-3.5 font-semibold text-bg"
        >
          Continuer le shopping
        </Link>
        <Link
          href="/compte"
          className="rounded-[16px] bg-card py-3.5 text-sm font-medium text-fg"
        >
          Voir mes commandes
        </Link>
      </div>
    </div>
  );
}
