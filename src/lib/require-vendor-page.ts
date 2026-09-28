import { redirect } from "next/navigation";
import { assertVendor } from "@/lib/assert-vendor";

/** Garde d’accès espace vendeur — session valide + non suspendu. */
export async function requireVendorPage() {
  const session = await assertVendor();
  if (session.ok) return session;

  if (session.reason === "suspended") {
    redirect("/vendeur/login?error=suspended");
  }
  redirect("/vendeur/login");
}
