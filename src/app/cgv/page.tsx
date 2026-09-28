import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions générales de vente",
  description: `CGV ${SITE.name} — marketplace multi-vendeurs, commande, livraison, paiement FCFA au Bénin.`,
  path: "/cgv",
});

export default function CgvPage() {
  return (
    <LegalPage title="Conditions générales de vente (CGV)" updated="23 septembre 2026">
      <p>
        Les présentes CGV régissent l&apos;utilisation de la place de marché{" "}
        {SITE.url} exploitée par {SITE.legalName} (« la Plateforme ») et les
        ventes conclues entre un client consommateur (« l&apos;Acheteur ») et
        soit la Plateforme, soit une boutique tierce référencée (« le Vendeur
        marque »), situés principalement en République du Bénin.
      </p>

      <h2>1. Objet &amp; modèle marketplace</h2>
      <p>
        {SITE.name} est une place de marché : plusieurs boutiques y proposent
        des accessoires de mode (montres, bijoux, sacs, lunettes, chaussures).
        Chaque fiche produit indique la marque / boutique concernée. Une
        commande porte sur les articles d&apos;une seule boutique à la fois.
      </p>
      <ul>
        <li>
          <strong>Plateforme</strong> : héberge le catalogue, le paiement, la
          logistique de livraison coordonnée, et le service client de premier
          niveau.
        </li>
        <li>
          <strong>Vendeur marque</strong> : décrit et met à jour ses produits,
          honore les commandes qui lui sont attribuées, et reste responsable de
          la conformité des articles qu&apos;il propose.
        </li>
      </ul>

      <h2>2. Acceptation</h2>
      <p>
        La validation de la commande implique l&apos;acceptation pleine et
        entière des présentes CGV. Un lien vers les CGV est présenté avant le
        paiement / confirmation.
      </p>

      <h2>3. Prix</h2>
      <ul>
        <li>Les prix sont indiqués en <strong>francs CFA (FCFA / XOF)</strong>.</li>
        <li>
          Ils s&apos;entendent toutes taxes comprises selon le régime applicable
          à la boutique concernée.
        </li>
        <li>
          Les frais de livraison sont calculés selon la zone et affichés avant
          validation (voir <Link href="/livraison">Livraison</Link>).
        </li>
        <li>Une promotion affichée prime sur le prix barré pendant sa validité.</li>
      </ul>

      <h2>4. Commande</h2>
      <p>
        L&apos;Acheteur sélectionne des produits d&apos;une même boutique,
        renseigne ses coordonnées (nom, téléphone béninois, adresse de
        livraison) et choisit un mode de paiement. La Plateforme ou le Vendeur
        marque peut refuser une commande en cas de stock insuffisant,
        d&apos;adresse hors zone, de boutique suspendue, ou de suspicion de
        fraude.
      </p>

      <h2>5. Paiement &amp; redistribution</h2>
      <ul>
        <li>
          <strong>Paiement à la livraison (COD)</strong> : règlement en espèces
          ou Mobile Money au livreur, selon disponibilité.
        </li>
        <li>
          <strong>Mobile Money en ligne</strong> : via prestataires (ex.
          Fedapay, KkiaPay) pour MTN MoMo / Moov Money lorsque activés. Les
          fonds sont encaissés par la Plateforme.
        </li>
      </ul>
      <p>
        La commande n&apos;est définitivement confirmée qu&apos;après validation
        du paiement ou acceptation COD. Les sommes dues aux Vendeurs marques
        sont redistribuées selon les conditions commerciales convenues avec
        Coin229 (commission plateforme, délais de reverse). Le détail
        contractuel vendeur est communiqué à l&apos;activation du compte
        boutique.
      </p>

      <h2>6. Livraison</h2>
      <p>
        Zones desservies : {SITE.zones.join(", ")}. Les délais indiqués sont
        estimatifs et peuvent varier selon l&apos;accessibilité et le volume.
        Le risque est transféré à la réception par l&apos;Acheteur ou un
        destinataire désigné. La coordination livraison peut être assurée par
        la Plateforme ou le Vendeur marque selon l&apos;offre.
      </p>

      <h2>7. Droit de rétractation / retours</h2>
      <p>
        Conformément à la politique détaillée sur{" "}
        <Link href="/retours">Retours & échanges</Link> : retour possible sous
        48 heures après réception si le produit est non porté, non endommagé,
        dans son emballage d&apos;origine, sauf exceptions (hygiène /
        personnalisation). Les frais de renvoi peuvent rester à la charge de
        l&apos;Acheteur sauf erreur de la boutique ou produit défectueux.
        Contactez d&apos;abord {SITE.name} ; la Plateforme oriente vers la
        boutique concernée.
      </p>

      <h2>8. Garantie légale</h2>
      <p>
        Les produits bénéficient de la conformité au contrat. Tout défaut
        apparent doit être signalé sous 48 h avec photos. Échange, avoir ou
        remboursement selon le cas, en lien avec la boutique vendeuse.
      </p>

      <h2>9. Comptes vendeurs</h2>
      <p>
        L&apos;inscription boutique est soumise à validation par Coin229
        (statut en attente puis actif). Coin229 peut suspendre une boutique en
        cas de manquement (fraude, contrefaçon présumée, non-respect des
        commandes, contenus illicites). Les vendeurs s&apos;engagent à fournir
        des informations exactes (contact, description) et des photos fidèles.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <Link href="/confidentialite">Politique de confidentialité</Link>, en
        cohérence avec la Loi n°2017-20 portant Code du numérique en République
        du Bénin. Les données nécessaires à l&apos;exécution d&apos;une
        commande peuvent être partagées avec la boutique concernée.
      </p>

      <h2>11. Responsabilité</h2>
      <p>
        La Plateforme n&apos;est pas responsable des retards dus à un cas de
        force majeure, à une adresse inexacte, ou à l&apos;indisponibilité
        temporaire d&apos;un réseau de paiement. La responsabilité des
        caractéristiques du produit incombe au Vendeur marque qui l&apos;a mis
        en ligne, sous réserve des obligations légales de la Plateforme.
      </p>

      <h2>12. Droit applicable &amp; litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit béninois. En cas de litige, une
        solution amiable sera recherchée (WhatsApp / e-mail). À défaut,
        compétence des juridictions de Cotonou, sauf disposition d&apos;ordre
        public contraire.
      </p>

      <h2>13. Contact</h2>
      <p>
        {SITE.email} · {SITE.phoneDisplay} · {SITE.address}
      </p>
    </LegalPage>
  );
}
