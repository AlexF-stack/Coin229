import { getDefaultVendor, getVendorProducts } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminProducts } from "@/components/admin/admin-products";
import { DEMO_VENDOR_ID, DEMO_PRODUCTS } from "@/lib/demo-data";

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

  return (
    <AdminShell boutique={boutique}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Produits</h1>
          <p className="mt-1 text-sm text-white/45">
            Catalogue, stock et tarifs
          </p>
        </div>
        <AdminProducts products={products} vendorId={vendorId} />
      </div>
    </AdminShell>
  );
}
