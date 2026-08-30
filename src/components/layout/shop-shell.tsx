"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FreeShippingBanner } from "@/components/layout/free-shipping-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageFade } from "@/components/motion/page-fade";
import { OfflineBanner } from "@/components/pwa/offline-banner";

const ShopChatbot = dynamic(
  () =>
    import("@/components/chat/shop-chatbot").then((m) => m.ShopChatbot),
  { ssr: false }
);

/** Chrome boutique — allégé sur fiche produit & tunnel (conversion) */
export function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isProduct = pathname.startsWith("/produit/");
  const isCheckout =
    pathname.startsWith("/commande") && !pathname.includes("confirmation");
  const leanFunnel = isProduct || isCheckout;
  const isOffline = pathname.startsWith("/offline");
  const hideChat = isOffline;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <OfflineBanner />
      {!leanFunnel && !isOffline && <FreeShippingBanner />}
      {!isOffline && <SiteHeader />}
      <main
        className={
          leanFunnel || isOffline
            ? "page-shell min-h-[70dvh] pb-8"
            : "page-shell min-h-[70dvh] pb-24 md:pb-8"
        }
      >
        <PageFade>{children}</PageFade>
      </main>
      {!leanFunnel && !isOffline && <SiteFooter />}
      {!hideChat && <ShopChatbot />}
      {!leanFunnel && !isOffline && <BottomNav />}
    </>
  );
}
