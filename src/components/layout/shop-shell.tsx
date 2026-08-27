"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FreeShippingBanner } from "@/components/layout/free-shipping-banner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TrustStrip } from "@/components/trust/trust-strip";
import { ShopChatbot } from "@/components/chat/shop-chatbot";
import { PageFade } from "@/components/motion/page-fade";

/** Chrome boutique — allégé sur fiche produit & tunnel (conversion) */
export function ShopShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isProduct = pathname.startsWith("/produit/");
  const isCheckout =
    pathname.startsWith("/commande") && !pathname.includes("confirmation");
  const leanFunnel = isProduct || isCheckout;
  const isCart = pathname.startsWith("/panier");
  const hideChat = leanFunnel || isCart;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {!leanFunnel && <FreeShippingBanner />}
      {!leanFunnel && <TrustStrip />}
      <SiteHeader />
      <main
        className={
          leanFunnel
            ? "page-shell min-h-[70dvh] pb-8"
            : "page-shell min-h-[70dvh] pb-24 md:pb-8"
        }
      >
        <PageFade>{children}</PageFade>
      </main>
      {!leanFunnel && <SiteFooter />}
      {!hideChat && <ShopChatbot />}
      {!leanFunnel && <BottomNav />}
    </>
  );
}
