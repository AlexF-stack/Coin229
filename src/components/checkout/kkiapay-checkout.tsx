"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
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
  const publicKey = process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY;
  const sandbox =
    (process.env.NEXT_PUBLIC_KKIAPAY_ENV || "sandbox").toLowerCase() !==
    "live";

  useEffect(() => {
    if (!ready || !publicKey || !window.openKkiapayWidget) return;

    window.addSuccessListener?.(async (data) => {
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
      router.replace(`/commande/confirmation?id=${orderId}`);
    });

    window.addFailedListener?.(() => {
      setError("Paiement annulé ou échoué. Réessaie ou choisis le COD.");
    });

    window.openKkiapayWidget({
      amount,
      key: publicKey,
      sandbox,
      phone,
      email,
      data: orderId,
      theme: "#ef9f27",
    });
  }, [ready, publicKey, amount, phone, email, orderId, router, sandbox]);

  if (!publicKey) {
    return (
      <p className="text-sm text-coral">
        Clé publique KkiaPay manquante (`NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY`).
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
      {!ready && (
        <p className="flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement KkiaPay…
        </p>
      )}
      {ready && (
        <p className="text-sm text-muted">
          Valide le paiement Mobile Money dans la fenêtre KkiaPay.
        </p>
      )}
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
