import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0F2D26",
    theme_color: "#0F2D26",
    lang: "fr-BJ",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/c2/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/c2/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/c2/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Boutique",
        short_name: "Boutique",
        url: "/boutique",
        icons: [{ src: "/icons/c2/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Panier",
        short_name: "Panier",
        url: "/panier",
        icons: [{ src: "/icons/c2/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Compte",
        short_name: "Compte",
        url: "/compte",
        icons: [{ src: "/icons/c2/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
