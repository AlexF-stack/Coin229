"use client";

import Script from "next/script";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Props = {
  orderId: string;
  amount: number;
  phone: string;
  email?: string;
};

declare global {
  interface Window {
    openKkiapayWidget?: (opts: Record<string, unknown>) => void;
    addSuccessListener?: (cb: (data: { transactionId: string }) => void) => void;
    addFailedListener?: (cb: () => void) => void;
  }
}

export function KkiaPayCheckout({ orderId, amount, phone, email }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const listenersAdded = useRef(false);
  const autoOpened = useRef(false);
  const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
  const sandbox =
    (process.env.NEXT_PUBLIC_KKIAPAY_ENV || "sandbox").toLowerCase() !==
    "live";

  const openWidget = useCallback(() => {
    if (!publicKey || !window.openKkiapayWidget) return;
    setError(null);
    window.openKkiapayWidget({
      amount,
      key: publicKey,
      sandbox,
      phone,
      email,
      data: orderId,
      partnerId: orderId,
      theme: "#ef9f27",
    });
  }, [publicKey, amount, sandbox, phone, email, orderId]);

  useEffect(() => {
    if (!ready || !publicKey || !window.openKkiapayWidget) return;

    // Les écouteurs KkiaPay sont globaux : une seule inscription
    if (!listenersAdded.current) {
      listenersAdded.current = true;
      window.addSuccessListener?.(async (data) => {
        setConfirming(true);
        try {
          await fetch("/api/payments/kkiapay/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              transactionId: data.transactionId,
            }),
          });
        } catch {
          // confirmation via webhook possible
        }
        // La page de confirmation affiche l'état réel du paiement
        router.replace(`/commande/confirmation?id=${orderId}`);
      });
      window.addFailedListener?.(() => {
        setError(
          "Paiement annulé ou échoué. Aucun montant n’a été validé : tu peux réessayer."
        );
      });
    }

    if (!autoOpened.current) {
      autoOpened.current = true;
      openWidget();
    }
  }, [ready, publicKey, orderId, router, openWidget]);

  if (!publicKey) {
    return (
      <p className="text-sm text-coral">
        Le paiement Mobile Money est momentanément indisponible. Écris-nous sur
        WhatsApp pour finaliser ta commande.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 text-center">
      <Script
        src="https://cdn.kkiapay.me/k.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {!ready ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement KkiaPay…
        </p>
      ) : confirming ? (
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Vérification du paiement…
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Valide le paiement Mobile Money dans la fenêtre KkiaPay.
          </p>
          {error && (
            <p role="alert" className="text-sm text-coral">
              {error}
            </p>
          )}
          <button type="button" onClick={openWidget} className="btn btn-primary w-full">
            {error ? "Réessayer le paiement" : "Payer maintenant"}
          </button>
          <Link
            href={`/commande/confirmation?id=${encodeURIComponent(orderId)}`}
            className="btn btn-secondary w-full"
          >
            Voir ma commande
          </Link>
        </>
      )}
    </div>
  );
}
