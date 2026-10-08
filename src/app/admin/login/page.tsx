import { Suspense } from "react";
import { AuthFallback } from "@/components/ui/auth-card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = {
  title: "Connexion admin",
};

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
