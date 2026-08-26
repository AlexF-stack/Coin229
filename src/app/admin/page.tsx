import { getDefaultVendor, getVendorOrders, getVendorProducts } from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { DEMO_VENDOR_ID, DEMO_PRODUCTS } from "@/lib/demo-data";
import Link from "next/link";
import { Package, ShoppingCart, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const metadata = {
  title: "Admin",
};

export const dynamic = "force-dynamic";

async function loadVendorData() {
  let vendorId = DEMO_VENDOR_ID;
  let products = DEMO_PRODUCTS;
  let orders: Awaited<ReturnType<typeof getVendorOrders>> = [];
  let boutique = "Coin229 Boutique";

  try {
    const vendor = await getDefaultVendor();
    if (vendor) {
      vendorId = vendor.id;
      boutique = vendor.nomBoutique;
      products = await getVendorProducts(vendor.id);
      orders = await getVendorOrders(vendor.id);
    }
  } catch {
    // démo silencieuse
  }

  return { vendorId, products, orders, boutique };
}

export default async function AdminDashboardPage() {
  const { products, orders, boutique } = await loadVendorData();
  const enAttente = orders.filter((o) => o.statut === "en_attente").length;
  const stockBas = products.filter((p) => p.stockQuantite > 0 && p.stockQuantite <= 5).length;
  const ca = orders
    .filter((o) => o.statut !== "annulee")
    .reduce((s, o) => s + o.montantTotal, 0);

  return (
    <AdminShell boutique={boutique}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Vue d’ensemble — {boutique}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#161920] p-4">
            <div className="flex items-center gap-2 text-white/45">
              <Package className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Produits</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">
              {products.length}
            </p>
            {stockBas > 0 && (
              <p className="mt-1 text-xs text-amber-400">
                {stockBas} stock bas
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161920] p-4">
            <div className="flex items-center gap-2 text-white/45">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Commandes</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">
              {orders.length}
            </p>
            {enAttente > 0 && (
              <p className="mt-1 text-xs text-emerald-400">
                {enAttente} en attente
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-[#161920] p-4">
            <div className="flex items-center gap-2 text-white/45">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Volume</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatPrice(ca)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/produits"
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#0a0b0f] hover:bg-emerald-400"
          >
            Gérer les produits
          </Link>
          <Link
            href="/admin/commandes"
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Voir les commandes
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
