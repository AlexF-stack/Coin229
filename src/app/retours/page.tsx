import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE, whatsappHref } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Retours & échanges",
  description: `Politique de retours ${SITE.name} — 48h, produit non porté, zones Cotonou Porto-Novo Godomey.`,
  path: "/retours",
});

export default function RetoursPage() {
  return (
    <LegalPage title="Retours & échanges" updated="27 août 2026">
      {/* TODO: validate return policy legally */}
      <p>
        Nous voulons que tu sois satisfait·e. Voici les règles claires
        applicables aux commandes {SITE.name} livrées au Bénin.
      </p>

      <h2>1. Délai</h2>
      <p>
        Tu disposes de <strong>48 heures</strong> après réception pour signaler
        un problème (défaut, erreur de référence, taille/modèle incorrect).
      </p>

      <h2>2. Conditions d&apos;acceptation</h2>
      <ul>
        <li>Produit non porté / non utilisé</li>
        <li>Étiquettes et emballage d&apos;origine conservés</li>
        <li>Photos du défaut ou de l&apos;erreur jointes au message</li>
        <li>Numéro de commande communiqué</li>
      </ul>

      <h2>3. Cas exclus</h2>
      <ul>
        <li>Produit endommagé par une mauvaise utilisation</li>
        <li>Changement d&apos;avis sans motif après le délai</li>
        <li>Articles soldés marqués « vente finale » (si indiqué sur la fiche)</li>
      </ul>

      <h2>4. Processus</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          Écris-nous sur{" "}
          <a href={whatsappHref("Bonjour, je souhaite un retour / échange")}>
            WhatsApp
          </a>{" "}
          ou par e-mail ({SITE.email}).
        </li>
        <li>Nous confirmons l&apos;éligibilité sous 24–48 h ouvrées.</li>
        <li>
          Échange, avoir ou remboursement selon stock et mode de paiement
          initial.
        </li>
      </ol>

      <h2>5. Frais</h2>
      <p>
        Erreur ou défaut imputable à {SITE.name} : reprise organisée sans frais
        pour toi. Autres cas : frais de renvoi éventuels à ta charge, communiqués
        avant validation.
      </p>

      <h2>6. Lien utile</h2>
      <p>
        <Link href="/cgv">Conditions générales de vente</Link> ·{" "}
        <Link href="/livraison">Livraison & frais</Link>
      </p>
    </LegalPage>
  );
}
