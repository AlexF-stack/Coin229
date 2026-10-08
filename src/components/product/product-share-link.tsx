"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { productShareUrl } from "@/lib/site";

type Props = {
  productId: string;
  productName: string;
  campaignSlug: string;
};

export function ProductShareLink({
  productId,
  productName,
  campaignSlug,
}: Props) {
  const [copied, setCopied] = useState(false);
  const url = productShareUrl(productId, campaignSlug);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
      title={productName}
    >
      {copied ? (
        <Check className="h-4 w-4 stroke-[1.5]" />
      ) : (
        <Link2 className="h-4 w-4 stroke-[1.5]" />
      )}
      {copied ? "Lien copié" : "Copier le lien pub"}
    </button>
  );
}
