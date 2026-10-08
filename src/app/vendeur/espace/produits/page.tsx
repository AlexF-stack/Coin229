import { VendorShell } from "@/components/vendeur/vendor-shell";
import { PageHeader } from "@/components/ui/page-header";
import { VendorProducts } from "@/components/vendeur/vendor-products";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorProducts } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";

export const metadata = { title: "Mes produits" };
export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const session = await requireVendorPage();

  const [products, unreadMessages] = await Promise.all([
    getMyVendorProducts(),
    getVendorUnreadTotal(),
  ]);

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        <PageHeader title="Produits" description="Photo, nom, prix, collection — publication en quelques clics." />
        <VendorProducts
          products={products}
          canPublish={session.statut === "actif"}
        />
      </div>
    </VendorShell>
  );
}
