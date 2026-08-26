import type { Metadata, Viewport } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";
import { ShopShell } from "@/components/layout/shop-shell";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Coin229 — Accessoires mode",
    template: "%s · Coin229",
  },
  description:
    "Montres, bijoux et sacs. Livraison Cotonou, Porto-Novo et Godomey.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(max-width: 767px)", color: "#0c0c0c" },
    { media: "(min-width: 768px)", color: "#f7f4ef" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${syne.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        <ShopShell>{children}</ShopShell>
      </body>
    </html>
  );
}
