import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions générales de vente",
  description: `CGV ${SITE.name} — commande, prix en FCFA, livraison, paiement, retours au Bénin.`,
  path: "/cgv",
});

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales de vente (CGV)" updated="27 août 2026">
      <p>
        Les présentes CGV régissent les ventes conclues sur {SITE.url} entre{" "}
        {SITE.legalName} (« le Vendeur ») et tout client consommateur
        (« l&apos;Acheteur ») situés principalement en République du Bénin.
        Elles s&apos;inspirent des principes de protection du consommateur, du
        Code du numérique béninois et des bonnes pratiques du commerce
        électronique international.
      </p>

      <h2>1. Objet</h2>
      <p>
        {SITE.name} commercialise des accessoires de mode neufs (montres,
        bijoux, sacs, lunettes) destinés à un usage personnel.
      </p>

      <h2>2. Acceptation</h2>
      <p>
        La validation de la commande implique l&apos;acceptation pleine et
        entière des présentes CGV. Un lien vers les CGV est présenté avant le
        paiement / confirmation.
      </p>

      <h2>3. Prix</h2>
      <ul>
        <li>Les prix sont indiqués en <strong>francs CFA (FCFA / XOF)</strong>.</li>
        <li>Ils s&apos;entendent toutes taxes comprises selon le régime applicable au Vendeur.</li>
        <li>
          Les frais de livraison sont calculés selon la zone et affichés avant
          validation (voir <Link href="/livraison">Livraison</Link>).
        </li>
        <li>Une promotion affichée prime sur le prix barré pendant sa validité.</li>
      </ul>

      <h2>4. Commande</h2>
      <p>
        L&apos;Acheteur sélectionne des produits, renseigne ses coordonnées
        (nom, téléphone béninois, adresse de livraison) et choisit un mode de
        paiement. Le Vendeur peut refuser une commande en cas de stock
        insuffisant, d&apos;adresse hors zone, ou de suspicion de fraude.
      </p>

      <h2>5. Paiement</h2>
      <ul>
        <li>
          <strong>Paiement à la livraison (COD)</strong> : règlement en espèces
          ou Mobile Money au livreur, selon disponibilité.
        </li>
        <li>
          <strong>Mobile Money en ligne</strong> : via prestataires (ex.
          Fedapay, KkiaPay) pour MTN MoMo / Moov Money lorsque activés.
        </li>
      </ul>
      <p>La commande n&apos;est définitivement confirmée qu&apos;après validation du paiement ou acceptation COD.</p>

      <h2>6. Livraison</h2>
      <p>
        Zones desservies : {SITE.zones.join(", ")}. Les délais indiqués sont
        estimatifs et peuvent varier selon l&apos;accessibilité et le volume.
        Le risque est transféré à la réception par l&apos;Acheteur ou un
        destinataire désigné.
      </p>

      <h2>7. Droit de rétractation / retours</h2>
      <p>
        Conformément à la politique détaillée sur{" "}
        <Link href="/retours">Retours & échanges</Link> : retour possible sous
        48 heures après réception si le produit est non porté, non endommagé,
        dans son emballage d&apos;origine, sauf exceptions (hygiène /
        personnalisation). Les frais de renvoi peuvent rester à la charge de
        l&apos;Acheteur sauf erreur du Vendeur ou produit défectueux.
      </p>

      <h2>8. Garantie légale</h2>
      <p>
        Les produits bénéficient de la conformité au contrat. Tout défaut
        apparent doit être signalé sous 48 h avec photos. Le Vendeur propose
        échange, avoir ou remboursement selon le cas.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <Link href="/confidentialite">Politique de confidentialité</Link>, en
        cohérence avec la Loi n°2017-20 portant Code du numérique en République
        du Bénin et les principes internationaux de minimisation et de sécurité.
      </p>

      <h2>10. Responsabilité</h2>
      <p>
        Le Vendeur ne saurait être tenu responsable des retards dus à un cas de
        force majeure, à une adresse inexacte fournie par l&apos;Acheteur, ou à
        l&apos;indisponibilité temporaire d&apos;un réseau de paiement.
      </p>

      <h2>11. Droit applicable & litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit béninois. En cas de litige, une
        solution amiable sera recherchée (WhatsApp / e-mail). À défaut,
        compétence des juridictions de Cotonou, sauf disposition d&apos;ordre
        public contraire.
      </p>

      <h2>12. Contact</h2>
      <p>
        {SITE.email} · {SITE.phoneDisplay} · {SITE.address}
      </p>
    </LegalPage>
  );
}
