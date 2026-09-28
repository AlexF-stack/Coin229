"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { startOrGetConversation } from "@/lib/messaging";

type Props = {
  vendorId: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  vendorName: string;
  loggedIn: boolean;
  className?: string;
};

export function ContactVendorButton({
  vendorId,
  productId,
  productName,
  orderId,
  vendorName,
  loggedIn,
  className,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    if (!loggedIn) {
      const next = productId
        ? `/produit/${productId}`
        : "/compte/messages";
      router.push(`/compte?next=${encodeURIComponent(next)}`);
      return;
    }
    startTransition(async () => {
      const res = await startOrGetConversation({
        vendorId,
        productId,
        orderId,
        firstMessage: productName
          ? `Bonjour, j’ai une question sur « ${productName} ».`
          : undefined,
      });
      if (!res.success) {
        setError(res.error ?? "Impossible d’ouvrir la discussion");
        return;
      }
      router.push(`/compte/messages/${res.conversationId}`);
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 text-sm font-medium text-amber hover:underline disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4 stroke-[1.5]" />
        )}
        Contacter {vendorName}
      </button>
      {error && <p className="mt-1 text-xs text-coral">{error}</p>}
      {!loggedIn && (
        <p className="mt-1 text-xs text-muted">
          Connexion requise pour discuter avec la marque.
        </p>
      )}
    </div>
  );
}
