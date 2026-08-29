import { KkiaPayCheckout } from "@/components/checkout/kkiapay-checkout";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export const metadata = { title: "Paiement Mobile Money" };

export default async function PaymentPage({ searchParams }: Props) {
  const { id } = await searchParams;
  if (!id) redirect("/panier");

  let order: {
    id: string;
    montantTotal: number;
    telephone: string;
    paymentUrl: string | null;
    paymentProvider: string | null;
    statut: string;
  } | null = null;

  try {
    order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        montantTotal: true,
        telephone: true,
        paymentUrl: true,
        paymentProvider: true,
        statut: true,
      },
    });
  } catch {
    order = null;
  }

  if (!order) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-muted">Commande introuvable.</p>
        <Link href="/boutique" className="mt-4 inline-block text-amber">
          Boutique
        </Link>
      </div>
    );
  }

  if (order.statut === "confirmee") {
    redirect(`/commande/confirmation?id=${order.id}`);
  }

  if (order.paymentUrl) {
    redirect(order.paymentUrl);
  }

  if (order.paymentProvider === "kkiapay") {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Paiement Mobile Money</h1>
        <p className="text-sm text-muted">
          Commande {order.id.slice(0, 8)}… · {order.montantTotal.toLocaleString("fr-BJ")} FCFA
        </p>
        <KkiaPayCheckout
          orderId={order.id}
          amount={order.montantTotal}
          phone={order.telephone.replace(/^\+229/, "")}
        />
        <Link href="/panier" className="block text-center text-sm text-muted">
          Retour au panier
        </Link>
      </div>
    );
  }

  redirect(`/commande/confirmation?id=${order.id}`);
}
