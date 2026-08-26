import Link from "next/link";
import { Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-bg-elevated">
      <div className="page-shell grid gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold">
            Coin<span className="text-amber">229</span>
          </p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Accessoires mode pour le Bénin. Livraison Cotonou, Porto-Novo et
            Godomey / Abomey-Calavi.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Boutique</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/?categorie=montre" className="hover:text-amber">
                Montres
              </Link>
            </li>
            <li>
              <Link href="/?categorie=bijou" className="hover:text-amber">
                Bijoux
              </Link>
            </li>
            <li>
              <Link href="/?categorie=sac" className="hover:text-amber">
                Sacs
              </Link>
            </li>
            <li>
              <Link href="/favoris" className="hover:text-amber">
                Favoris
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Infos</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/livraison" className="hover:text-amber">
                Livraison & frais
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:text-amber">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/compte" className="hover:text-amber">
                Mon compte
              </Link>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-amber"
              >
                <Instagram className="h-4 w-4 stroke-[1.5]" />
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted md:px-6">
        © {new Date().getFullYear()} Coin229
      </div>
    </footer>
  );
}
