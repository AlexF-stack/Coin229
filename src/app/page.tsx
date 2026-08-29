import type { Metadata } from "next";
import type { Categorie } from "@prisma/client";
import { HomeHero } from "@/components/home/home-hero";
import { ReassuranceBar } from "@/components/home/reassurance-bar";
import { BenefitChips } from "@/components/home/benefit-chips";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ProductRail } from "@/components/home/product-rail";
import { EditorialBlock } from "@/components/home/editorial-block";
import { WhyCoin229 } from "@/components/home/why-coin229";
import { HomeClosingCta } from "@/components/home/home-closing-cta";
import { StickyShopCta } from "@/components/home/sticky-shop-cta";
import { Reveal } from "@/components/motion/reveal";
import { fetchProducts } from "@/lib/catalog";
import {
  CATEGORIES,
  type ProductCardData,
} from "@/lib/constants";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  path: "/",
});

function toTime(value: Date | string | undefined): number {
  if (!value) return 0;
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

function pickNouveautes(products: ProductCardData[]): ProductCardData[] {
  const hasDates = products.some((p) => toTime(p.dateCreation) > 0);
  if (!hasDates) return products.slice(0, 4);
  return [...products]
    .sort((a, b) => toTime(b.dateCreation) - toTime(a.dateCreation))
    .slice(0, 4);
}

function pickSelection(
  products: ProductCardData[],
  excludeIds: Set<string>
): ProductCardData[] {
  const pool = products.filter((p) => !excludeIds.has(p.id));
  const withPromo = pool.filter(
    (p) => p.prixPromo != null && p.prixPromo < p.prix
  );
  if (withPromo.length >= 4) return withPromo.slice(0, 4);
  const rest = pool.filter((p) => !withPromo.some((x) => x.id === p.id));
  return [...withPromo, ...rest].slice(0, 4);
}

function categoryImages(
  products: ProductCardData[]
): Partial<Record<Categorie, string>> {
  const images: Partial<Record<Categorie, string>> = {};
  for (const categorie of CATEGORIES) {
    const match = products.find(
      (p) => p.categorie === categorie && p.images[0]
    );
    if (match?.images[0]) images[categorie] = match.images[0];
  }
  return images;
}

function heroSlides(products: ProductCardData[]): string[] {
  const seen = new Set<string>();
  const slides: string[] = [];
  for (const p of products) {
    const src = p.images[0];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    slides.push(src);
    if (slides.length >= 3) break;
  }
  return slides;
}

export default async function HomePage() {
  const { products: allProducts } = await fetchProducts();

  const nouveautes = pickNouveautes(allProducts);
  const nouveauteIds = new Set(nouveautes.map((p) => p.id));
  const selection = pickSelection(allProducts, nouveauteIds);
  const images = categoryImages(allProducts);
  const slides = heroSlides(allProducts);

  const editorialImage =
    images.bijou ??
    images.montre ??
    allProducts.find((p) => p.images[0])?.images[0];

  return (
    <div className="space-y-10 pb-4 md:space-y-14">
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <HomeHero images={slides} />
      </div>

      <ReassuranceBar />

      <Reveal>
        <BenefitChips />
      </Reveal>

      <Reveal>
        <CategoryShowcase images={images} />
      </Reveal>

      <Reveal>
        <ProductRail
          id="nouveautes"
          title="Nouveautés"
          subtitle="Les dernières pièces arrivées chez Coin229."
          products={nouveautes}
          ctaHref="/boutique?sort=nouveautes"
          ctaLabel="Voir toutes les nouveautés"
        />
      </Reveal>

      {selection.length > 0 ? (
        <Reveal>
          <ProductRail
            id="selection"
            title="La sélection Coin229"
            subtitle="Les pièces choisies pour compléter votre style au quotidien."
            products={selection}
            ctaHref="/boutique"
            ctaLabel="Voir la boutique"
          />
        </Reveal>
      ) : null}

      <Reveal>
        <EditorialBlock image={editorialImage} />
      </Reveal>

      <Reveal>
        <WhyCoin229 />
      </Reveal>

      <Reveal>
        <HomeClosingCta />
      </Reveal>

      <StickyShopCta />
    </div>
  );
}
