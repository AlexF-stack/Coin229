import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de confidentialité",
  description: `Politique de confidentialité ${SITE.name} — données personnelles, Code du numérique Bénin, droits des utilisateurs.`,
  path: "/confidentialite",
});

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="27 août 2026">
      <p>
        {SITE.name} respecte la vie privée de ses clients. Cette politique
        décrit quelles données sont collectées, pourquoi, et quels sont vos
        droits, conformément à la{" "}
        <strong>Loi n°2017-20 portant Code du numérique</strong> (République du
        Bénin) et aux principes internationaux (licéité, finalité, minimisation,
        sécurité, durée limitée).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        {SITE.legalName} — {SITE.address} —{" "}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>

      <h2>2. Données collectées</h2>
      <ul>
        <li>Identité et contact : nom, numéro de téléphone, adresse de livraison</li>
        <li>Compte : authentification téléphone / e-mail (OAuth Google ou Facebook le cas échéant)</li>
        <li>Commande : articles, montants, mode de paiement, statut</li>
        <li>Techniques : cookies de session, préférences panier / consentement</li>
      </ul>
      <p>Nous ne vendons pas vos données à des annonceurs tiers.</p>

      <h2>3. Finalités</h2>
      <ul>
        <li>Exécution de la commande et livraison</li>
        <li>Paiement et lutte contre la fraude</li>
        <li>Service client (WhatsApp / e-mail)</li>
        <li>Amélioration du service et sécurité du site</li>
        <li>Obligations légales et comptables</li>
      </ul>

      <h2>4. Bases légales</h2>
      <p>
        Exécution du contrat de vente, intérêt légitime (sécurité, amélioration),
        obligation légale, et consentement lorsque requis (cookies non
        essentiels — actuellement absents hors cookies techniques).
      </p>

      <h2>5. Destinataires</h2>
      <p>
        Personnel habilité du Vendeur, prestataires techniques (hébergement,
        base de données, authentification, paiement Mobile Money) strictement
        pour leurs missions. Transferts hors Bénin possibles via ces
        prestataires ; des garanties contractuelles de sécurité sont exigées.
      </p>

      <h2>6. Durée de conservation</h2>
      <ul>
        <li>Données de commande : durée nécessaire au suivi + obligations légales</li>
        <li>Compte : jusqu&apos;à suppression ou inactivité prolongée</li>
        <li>Cookies techniques : durée de session / préférences locales</li>
      </ul>

      <h2>7. Vos droits</h2>
      <p>
        Vous pouvez demander l&apos;accès, la rectification, l&apos;effacement,
        la limitation ou l&apos;opposition, dans les limites prévues par la loi
        béninoise. Contact : <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        Vous pouvez également saisir l&apos;autorité compétente en matière de
        protection des données au Bénin (APDP) en cas de litige non résolu.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Mesures raisonnables : HTTPS, cookies httpOnly pour sessions sensibles,
        contrôle d&apos;accès admin, minimisation des données exposées.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Voir la <Link href="/cookies">Politique cookies</Link>.
      </p>

      <h2>10. Mineurs</h2>
      <p>
        Le site n&apos;est pas destiné aux enfants de moins de 15 ans. Les
        commandes doivent être passées par une personne capable juridiquement.
      </p>
    </LegalPage>
  );
}
