import { getDefaultVendor, getMarketplaceProducts, getVendorProducts } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProducts } from "@/components/admin/admin-products";
import { AdminMarketplaceProducts } from "@/components/admin/admin-marketplace-products";
import { DEMO_VENDOR_ID, DEMO_PRODUCTS } from "@/lib/demo-data";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = {
  title: "Produits · Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let vendorId = DEMO_VENDOR_ID;
  let products = DEMO_PRODUCTS;
  let boutique = "Coin229 Boutique";

  try {
    const vendor = await getDefaultVendor();
    if (vendor) {
      vendorId = vendor.id;
      boutique = vendor.nomBoutique;
      products = await getVendorProducts(vendor.id);
    }
  } catch {
    // démo
  }
  const marketplaceProducts = await getMarketplaceProducts(vendorId);

  return (
    <AdminShell boutique={boutique}>
      <PageHeader title="Produits" description="Catalogue, stock et tarifs de la boutique Coin229" />
      <AdminProducts products={products} vendorId={vendorId} />

      <section className="mt-10 space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="font-display text-lg font-semibold text-fg">Produits des vendeurs</h2>
          <p className="mt-1 text-sm text-muted">
            Modération : retirer de la vente un produit non conforme, ou le remettre en vente.
          </p>
        </div>
        <AdminMarketplaceProducts products={marketplaceProducts} />
      </section>
    </AdminShell>
  );
}
