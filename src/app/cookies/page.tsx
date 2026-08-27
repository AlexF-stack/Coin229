import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique cookies",
  description: `Cookies utilisés par ${SITE.name} — cookies techniques, pas de publicité tierce.`,
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Politique cookies" updated="27 août 2026">
      <p>
        {SITE.name} utilise uniquement des cookies et stockages locaux{" "}
        <strong>nécessaires</strong> au fonctionnement du service.
      </p>

      <h2>1. Cookies / stockages techniques</h2>
      <ul>
        <li>Session compte (téléphone ou OAuth)</li>
        <li>Session administrateur (espace privé)</li>
        <li>Panier et préférences de commande (localStorage)</li>
        <li>Mémorisation du consentement cookies</li>
      </ul>

      <h2>2. Cookies publicitaires / analytics tiers</h2>
      <p>
        Aucun cookie publicitaire tiers n&apos;est déployé par défaut. Si un
        outil d&apos;audience est ajouté plus tard, un consentement explicite
        sera demandé.
      </p>

      <h2>3. Gestion</h2>
      <p>
        Vous pouvez supprimer les cookies via les paramètres de votre
        navigateur. La désactivation des cookies techniques peut empêcher la
        connexion ou le suivi de commande.
      </p>

      <h2>4. Plus d&apos;infos</h2>
      <p>
        <Link href="/confidentialite">Politique de confidentialité</Link> ·{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
    </LegalPage>
  );
}
