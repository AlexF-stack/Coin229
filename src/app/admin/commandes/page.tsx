import Link from "next/link";
import {
  getAdminOrders,
  getDefaultVendor,
  listMarketplaceVendors,
} from "@/lib/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminOrders } from "@/components/admin/admin-orders";

export const metadata = {
  title: "Commandes · Admin",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ vendeur?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { vendeur } = await searchParams;
  let boutique = "Coin229 Boutique";
  try {
    const v = await getDefaultVendor();
    if (v) boutique = v.nomBoutique;
  } catch {
    // ignore
  }

  // Toute la marketplace, filtrable par vendeur
  const [vendors, orders] = await Promise.all([
    listMarketplaceVendors(),
    getAdminOrders({ vendorId: vendeur || undefined }),
  ]);
  const chip = (active: boolean) =>
    active
      ? "rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-[#0a0b0f]"
      : "rounded-full border border-white/15 px-3 py-1 text-xs text-white/70 hover:bg-white/5";

  return (
    <AdminShell boutique={boutique}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Commandes</h1>
          <p className="mt-1 text-sm text-white/45">
            Toutes les boutiques de la marketplace — suivi et changement de statut
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Filtrer par boutique">
          <Link href="/admin/commandes" className={chip(!vendeur)}>
            Toutes
          </Link>
          {vendors
            .filter((v) => v._count.orders > 0)
            .map((v) => (
              <Link
                key={v.id}
                href={`/admin/commandes?vendeur=${encodeURIComponent(v.id)}`}
                className={chip(vendeur === v.id)}
              >
                {v.nomBoutique} ({v._count.orders})
              </Link>
            ))}
        </nav>
        <AdminOrders orders={orders} />
      </div>
    </AdminShell>
  );
}
