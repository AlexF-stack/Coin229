import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Mentions légales",
  description: `Mentions légales de ${SITE.name} — identité du vendeur, contact et hébergement.`,
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="27 août 2026">
      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>{SITE.name}</strong> est édité par{" "}
        <strong>{SITE.legalName}</strong>, exerçant une activité de commerce
        électronique d&apos;accessoires de mode en République du Bénin.
      </p>
      <ul>
        <li>Adresse : {SITE.address}</li>
        <li>RCCM : {SITE.rccm}</li>
        <li>IFU : {SITE.ifu}</li>
        <li>
          E-mail :{" "}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </li>
        <li>Téléphone / WhatsApp : {SITE.phoneDisplay}</li>
      </ul>
      <p>
        Les informations d&apos;immatriculation (RCCM / IFU) doivent être mises à
        jour via les variables d&apos;environnement dès obtention des numéros
        officiels, conformément aux obligations d&apos;identification du
        commerçant en ligne au Bénin et aux bonnes pratiques OHADA.
      </p>

      <h2>2. Directeur de la publication</h2>
      <p>Le responsable de la publication est le représentant légal de {SITE.legalName}.</p>

      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA
        91723, États-Unis —{" "}
        <a href="https://vercel.com" target="_blank" rel="noreferrer">
          vercel.com
        </a>
        . Les données de commande peuvent être stockées via des services cloud
        (base PostgreSQL / authentification) configurés par l&apos;éditeur.
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        Marques, textes, visuels et structure du site {SITE.name} sont protégés.
        Toute reproduction non autorisée est interdite. Les photos produits
        peuvent provenir de banques d&apos;images sous licence ; les droits
        restent à leurs titulaires.
      </p>

      <h2>5. Contact</h2>
      <p>
        Pour toute question :{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> ou via{" "}
        <Link href="/a-propos">la page À propos</Link>.
      </p>
    </LegalPage>
  );
}
