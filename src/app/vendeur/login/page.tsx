import { Suspense } from "react";
import { VendorLoginForm } from "@/components/vendeur/vendor-login-form";

export const metadata = {
  title: "Connexion vendeur",
};

export default function VendorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#0c0d12] text-white/50">
          Chargement…
        </div>
      }
    >
      <VendorLoginForm />
    </Suspense>
  );
}
