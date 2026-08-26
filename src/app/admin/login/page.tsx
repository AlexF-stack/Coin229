import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Connexion admin",
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#0a0b0f] text-white/50">
          Chargement…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
