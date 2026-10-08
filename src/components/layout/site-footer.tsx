import Link from "next/link";
import { Instagram, Mail, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { CATEGORIES, CATEGORIE_LABELS } from "@/lib/constants";
import { SITE, whatsappHref } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary text-white">
      <div className="page-shell grid gap-10 px-4 py-14 md:grid-cols-12 md:gap-8 md:px-6">
        <div className="md:col-span-4">
          <div className="flex items-center gap-2.5">
            <BrandLogo variant="mark" height={40} />
            <BrandLogo variant="wordmark" height={40} onDark />
          </div>
          <p className="mt-2 text-sm text-accent">{SITE.tagline}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            Montres, bijoux, sacs, lunettes et chaussures sélectionnés pour
            votre style — livrés à {SITE.zones.join(", ")}.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Explorer
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/boutique" className="hover:text-white">
                Boutique
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:text-white">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/livraison" className="hover:text-white">
                Livraison
              </Link>
            </li>
            <li>
              <Link href="/retours" className="hover:text-white">
                Retours
              </Link>
            </li>
            <li>
              <Link href="/vendeur/inscription" className="hover:text-white">
                Devenir vendeur
              </Link>
            </li>
            <li>
              <Link href="/vendeur/login" className="hover:text-white">
                Espace vendeur
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Catégories
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {CATEGORIES.map((categorie) => (
              <li key={categorie}>
                <Link
                  href={`/boutique?categorie=${categorie}`}
                  className="hover:text-white"
                >
                  {CATEGORIE_LABELS[categorie]}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <Instagram className="h-3.5 w-3.5" />
                Instagram
              </a>
            </li>
            <li>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <Mail className="h-3.5 w-3.5" />
                {SITE.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE.phoneDisplay.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                <Phone className="h-3.5 w-3.5" />
                {SITE.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-3 px-4 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {new Date().getFullYear()} Coin229</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
            <Link href="/cgv" className="hover:text-white">
              CGV
            </Link>
          </div>
        </div>
        <div className="page-shell px-4 pb-8 text-[11px] text-white/35 md:px-6">
          {SITE.legalName} · RCCM {SITE.rccm} · IFU {SITE.ifu} · {SITE.address}
        </div>
      </div>
    </footer>
  );
}
