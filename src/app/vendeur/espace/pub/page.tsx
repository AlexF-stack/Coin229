import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { VendorPubLinks } from "@/components/vendeur/vendor-pub-links";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorProducts } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";

export const metadata = { title: "Liens pub" };
export const dynamic = "force-dynamic";

export default async function VendorPubPage() {
  const session = await requireVendorPage();
  const unreadMessages = await getVendorUnreadTotal();

  if (!session.slug) {
    return (
      <VendorShell
        boutique={session.nomBoutique}
        slug={null}
        statut={session.statut}
        unreadMessages={unreadMessages}
      >
        <Alert tone="warning" title="Adresse de boutique manquante">
          Contacte le support Coin229 pour activer tes liens de partage.
        </Alert>
      </VendorShell>
    );
  }

  const products = await getMyVendorProducts();

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        <PageHeader title="Liens pub" description="Partage WhatsApp, Facebook ou TikTok — le trafic revient sur Coin229." />
        <VendorPubLinks
          slug={session.slug}
          boutique={session.nomBoutique}
          products={products.map((p) => ({ id: p.id, nom: p.nom }))}
        />
      </div>
    </VendorShell>
  );
}
