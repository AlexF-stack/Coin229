import { VendorShell } from "@/components/vendeur/vendor-shell";
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
        <div>
          <h1 className="text-2xl font-semibold text-white">Produits</h1>
          <p className="mt-1 text-sm text-white/45">
            Photo, nom, prix, niche — publication en quelques clics.
          </p>
        </div>
        <VendorProducts
          products={products}
          canPublish={session.statut === "actif"}
        />
      </div>
    </VendorShell>
  );
}
