import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ShopShell } from "@/components/layout/shop-shell";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "@/components/seo/json-ld";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { SITE } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
  preload: true,
  adjustFontFallback: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["500", "600", "700"],
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.legalName,
  keywords: [
    "accessoires mode Bénin",
    "montres Cotonou",
    "lunettes soleil Bénin",
    "bijoux Cotonou",
    "sacs mode Porto-Novo",
    "livraison Godomey",
    "Mobile Money",
    "paiement à la livraison",
    "Coin229",
  ],
  category: "shopping",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE.name,
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: SITE.url,
    languages: { "fr-BJ": SITE.url, fr: SITE.url },
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F2D26" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-BJ" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        {/* Hints réseau mobile — images produits */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link
          rel="preconnect"
          href="https://images.unsplash.com"
          crossOrigin="anonymous"
        />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <ShopShell>{children}</ShopShell>
        <CookieBanner />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
