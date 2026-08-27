import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Commande",
  description: "Finaliser votre commande Coin229 — livraison Bénin, paiement FCFA.",
  path: "/commande",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <div>
      <header className="flex items-center gap-3 px-4 pt-5">
        <Link
          href="/panier"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card"
          aria-label="Retour panier"
        >
          <ArrowLeft className="h-5 w-5 stroke-[1.5]" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Commande</h1>
      </header>
      <CheckoutForm />
    </div>
  );
}
