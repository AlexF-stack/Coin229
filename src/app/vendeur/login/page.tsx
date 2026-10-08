import { Suspense } from "react";
import { AuthFallback } from "@/components/ui/auth-card";
import { VendorLoginForm } from "@/components/vendeur/vendor-login-form";

export const metadata = {
  title: "Connexion vendeur",
};

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <VendorLoginForm />
    </Suspense>
  );
}
