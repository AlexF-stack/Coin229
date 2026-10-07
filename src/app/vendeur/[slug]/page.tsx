import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/catalog/product-grid";
import { prisma } from "@/lib/prisma";
import { buildPageMetadata } from "@/lib/seo";
import { sortForCatalog } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getStore(slug: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: {
      products: {
        where: { statut: { in: ["actif", "rupture"] } },
        orderBy: { dateCreation: "desc" },
      },
    },
  });
  if (!vendor || vendor.statut !== "actif") return null;
  return vendor;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const vendor = await getStore(slug);
    if (!vendor) {
      return { title: "Boutique introuvable", robots: { index: false } };
    }
    return buildPageMetadata({
      title: vendor.nomBoutique,
      description:
        vendor.description?.slice(0, 160) ||
        `Boutique ${vendor.nomBoutique} sur Coin229.`,
      path: `/vendeur/${slug}`,
    });
  } catch {
    return { title: "Boutique" };
  }
}

export const dynamic = "force-dynamic";

export default async function VendorStorefrontPage({ params }: Props) {
  const { slug } = await params;
  // Erreur base → page d'erreur temporaire (500) ; boutique absente → 404
  const vendor = await getStore(slug);
  if (!vendor) notFound();

  const products = sortForCatalog(vendor.products);

  return (
    <div className="space-y-8 py-6 md:py-10">
      <header className="border-b border-border px-4 pb-8 md:px-0">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {vendor.logoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-white">
              <Image
                src={vendor.logoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-lg font-semibold text-white">
              {vendor.nomBoutique.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber">
              Marque sur Coin229
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-navy md:text-3xl">
              {vendor.nomBoutique}
            </h1>
            {vendor.description && (
              <p className="mt-2 max-w-xl text-sm text-muted">
                {vendor.description}
              </p>
            )}
          </div>
        </div>
      </header>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="px-4 py-12 text-center md:px-0">
          <p className="font-display text-lg font-semibold text-navy">
            Aucun produit publié pour le moment.
          </p>
          <Link href="/boutique" className="btn btn-primary mt-6 inline-flex">
            Voir la boutique Coin229
          </Link>
        </div>
      )}
    </div>
  );
}
