import type { Metadata } from "next";
import { SITE } from "@/lib/site";

type PageSeoInput = {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = SITE.description,
  path = "/",
  images,
  noIndex = false,
}: PageSeoInput = {}): Metadata {
  const url = `${SITE.url}${path === "/" ? "" : path}`;
  const ogImages = (
    images?.length ? images : [`${SITE.url}/opengraph-image`]
  ).map((src) => ({
    url: src,
    width: 1200,
    height: 630,
    alt: title ? `${title} · ${SITE.name}` : SITE.name,
  }));

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title: title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${SITE.name}` : SITE.name,
      description,
      images: ogImages.map((i) => i.url),
    },
  };
}
