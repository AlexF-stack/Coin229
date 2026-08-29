import { redirect } from "next/navigation";

type SearchParams = Promise<{ q?: string }>;

/** Une seule logique de recherche : redirige vers /boutique?q= */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  redirect(query ? `/boutique?q=${encodeURIComponent(query)}` : "/boutique");
}
