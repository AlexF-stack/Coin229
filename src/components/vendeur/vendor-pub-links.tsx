"use client";

import { useMemo, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/site";

type ProductShare = {
  id: string;
  nom: string;
};

type Props = {
  slug: string;
  boutique: string;
  products: ProductShare[];
};

function shareUrl(productId: string, slug: string) {
  return `${SITE.url}/produit/${productId}?utm_source=vendor&utm_medium=share&utm_campaign=${encodeURIComponent(slug)}`;
}

export function VendorPubLinks({ slug, boutique, products }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const storeUrl = `${SITE.url}/vendeur/${slug}`;

  const whatsappStore = useMemo(() => {
    const msg = `Découvre ma boutique ${boutique} sur Coin229 👉 ${storeUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }, [boutique, storeUrl]);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-[#1a1c24] p-4 space-y-3">
        <h2 className="font-semibold text-white">Lien vitrine</h2>
        <p className="break-all text-sm text-white/60">{storeUrl}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy(storeUrl, "store")}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-[#0c0d12]"
          >
            {copied === "store" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copier
          </button>
          <a
            href={whatsappStore}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-white">Liens produits (pub)</h2>
        {products.length === 0 ? (
          <p className="text-sm text-white/45">
            Ajoute un produit pour générer des liens de partage.
          </p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => {
              const url = shareUrl(p.id, slug);
              const wa = `https://wa.me/?text=${encodeURIComponent(
                `Regarde ma pièce « ${p.nom} » sur Coin229 👉 ${url}`
              )}`;
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/10 bg-[#1a1c24] p-3"
                >
                  <p className="font-medium text-white">{p.nom}</p>
                  <p className="mt-1 break-all text-xs text-white/40">{url}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copy(url, p.id)}
                      className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/5"
                    >
                      {copied === p.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      Copier le lien pub
                    </button>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/5"
                    >
                      Facebook
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
