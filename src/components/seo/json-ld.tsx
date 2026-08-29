import { SITE } from "@/lib/site";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/brand/logo-lockup.png`,
    email: SITE.email,
    telephone: SITE.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cotonou",
      addressCountry: "BJ",
      streetAddress: SITE.address,
    },
    areaServed: SITE.zones.map((z) => ({
      "@type": "Place",
      name: z,
    })),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "service client",
      telephone: SITE.phoneDisplay,
      email: SITE.email,
      availableLanguage: ["French"],
      areaServed: "BJ",
    },
    sameAs: [SITE.social.instagram],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "fr-BJ",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/boutique?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(product: {
  id: string;
  nom: string;
  description: string;
  images: string[];
  prix: number;
  prixPromo: number | null;
  stockQuantite: number;
  statut: string;
  categorie: string;
}) {
  const price =
    product.prixPromo && product.prixPromo < product.prix
      ? product.prixPromo
      : product.prix;
  const inStock =
    product.statut === "actif" && product.stockQuantite > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nom,
    description: product.description,
    image: product.images.length ? product.images : undefined,
    sku: product.id,
    category: product.categorie,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/produit/${product.id}`,
      priceCurrency: SITE.currency,
      price: String(price),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: SITE.name,
      },
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
