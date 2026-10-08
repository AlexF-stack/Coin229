"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2, MessageCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { SITE, productShareUrl, whatsappLink } from "@/lib/site";

type ProductShare = {
  id: string;
  nom: string;
};

type Props = {
  slug: string;
  boutique: string;
  products: ProductShare[];
};

export function VendorPubLinks({ slug, boutique, products }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const storeUrl = `${SITE.url}/vendeur/${slug}`;

  const whatsappStore = useMemo(() => {
    const msg = `Découvre ma boutique ${boutique} sur Coin229 👉 ${storeUrl}`;
    return whatsappLink(msg);
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
      <Card as="section">
        <CardHeader title="Lien vitrine" description="À mettre dans ta bio Instagram, TikTok ou ton statut WhatsApp" icon={<Link2 />} />
        <p className="break-all rounded-control bg-surface-muted px-3 py-2 text-sm text-fg-secondary">{storeUrl}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => copy(storeUrl, "store")}>
            {copied === "store" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "store" ? "Copié" : "Copier"}
          </Button>
          <a href={whatsappStore} target="_blank" rel="noreferrer" className={buttonClasses({ size: "sm", variant: "outline" })}>
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-fg">Liens produits (pub)</h2>
        {products.length === 0 ? (
          <EmptyState title="Aucun produit" description="Ajoute un produit pour générer des liens de partage." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {products.map((p) => {
              const url = productShareUrl(p.id, slug);
              const wa = whatsappLink(`Regarde ma pièce « ${p.nom} » sur Coin229 👉 ${url}`);
              return (
                <Card as="li" key={p.id} padding="sm" className="space-y-2">
                  <p className="font-medium text-fg">{p.nom}</p>
                  <p className="break-all text-xs text-muted">{url}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => copy(url, p.id)}>
                      {copied === p.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === p.id ? "Copié" : "Copier le lien pub"}
                    </Button>
                    <a href={wa} target="_blank" rel="noreferrer" className={buttonClasses({ size: "sm", variant: "ghost" })}>
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClasses({ size: "sm", variant: "ghost" })}
                    >
                      Facebook
                    </a>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
