import Link from "next/link";
import { Instagram, Mail, Phone } from "lucide-react";
import { SITE, whatsappHref } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-navy text-white">
      <div className="page-shell grid gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-2xl font-bold">
            Coin<span className="text-amber">229</span>
          </p>
          <p className="mt-3 max-w-md text-sm text-white/65">
            Accessoires mode pour le Bénin — montres, bijoux, sacs et lunettes.
            Livraison {SITE.zones.join(", ")}. Prix en FCFA. Paiement à la
            livraison ou Mobile Money.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>{SITE.legalName}</li>
            <li>{SITE.address}</li>
            <li>RCCM : {SITE.rccm}</li>
            <li>IFU : {SITE.ifu}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-1.5 text-white/80 transition hover:text-amber"
            >
              <Mail className="h-4 w-4 stroke-[1.5]" />
              {SITE.email}
            </a>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-white/80 transition hover:text-amber"
            >
              <Phone className="h-4 w-4 stroke-[1.5]" />
              {SITE.phoneDisplay}
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Boutique</p>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            <li>
              <Link href="/?categorie=montre" className="transition hover:text-amber">
                Montres
              </Link>
            </li>
            <li>
              <Link href="/?categorie=bijou" className="transition hover:text-amber">
                Bijoux
              </Link>
            </li>
            <li>
              <Link href="/?categorie=sac" className="transition hover:text-amber">
                Sacs
              </Link>
            </li>
            <li>
              <Link href="/?categorie=lunette" className="transition hover:text-amber">
                Lunettes
              </Link>
            </li>
            <li>
              <Link href="/livraison" className="transition hover:text-amber">
                Livraison
              </Link>
            </li>
            <li>
              <Link href="/retours" className="transition hover:text-amber">
                Retours
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Informations légales</p>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            <li>
              <Link href="/mentions-legales" className="transition hover:text-amber">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="transition hover:text-amber">
                CGV
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="transition hover:text-amber">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="transition hover:text-amber">
                Cookies
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="transition hover:text-amber">
                À propos
              </Link>
            </li>
            <li>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 transition hover:text-amber"
              >
                <Instagram className="h-4 w-4 stroke-[1.5]" />
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/45 md:px-6">
        © {new Date().getFullYear()} {SITE.name} · Prix en FCFA (XOF) · Droit
        béninois
      </div>
    </footer>
  );
}
