import { VendorShell } from "@/components/vendeur/vendor-shell";
import { VendorProfileForm } from "@/components/vendeur/vendor-profile-form";
import { requireVendorPage } from "@/lib/require-vendor-page";
import { getMyVendorProfile } from "@/lib/vendor-actions";
import { getVendorUnreadTotal } from "@/lib/messaging";

export const metadata = { title: "Mon profil vendeur" };
export const dynamic = "force-dynamic";

export default async function VendorProfilePage() {
  const session = await requireVendorPage();
  const [vendor, unreadMessages] = await Promise.all([
    getMyVendorProfile(),
    getVendorUnreadTotal(),
  ]);

  if (!vendor) {
    return null;
  }

  return (
    <VendorShell
      boutique={session.nomBoutique}
      slug={session.slug}
      statut={session.statut}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Profil marque</h1>
          <p className="mt-1 text-sm text-white/45">
            Infos publiques, fiscalité et reversements.
          </p>
        </div>
        <VendorProfileForm vendor={vendor} />
      </div>
    </VendorShell>
  );
}
