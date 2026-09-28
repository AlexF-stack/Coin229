import { VendorShell } from "@/components/vendeur/vendor-shell";
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
        <p className="text-sm text-white/60">
          Slug boutique manquant — contacte le support Coin229.
        </p>
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
        <div>
          <h1 className="text-2xl font-semibold text-white">Liens pub</h1>
          <p className="mt-1 text-sm text-white/45">
            Partage WhatsApp, Facebook ou TikTok — le trafic revient sur
            Coin229.
          </p>
        </div>
        <VendorPubLinks
          slug={session.slug}
          boutique={session.nomBoutique}
          products={products.map((p) => ({ id: p.id, nom: p.nom }))}
        />
      </div>
    </VendorShell>
  );
}
