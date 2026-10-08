"use client";

import { useState } from "react";
import { Package, Pencil, Plus, Search, ShoppingCart, Trash2, Wallet } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  DataTable,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Pagination,
  Radio,
  Select,
  Skeleton,
  Spinner,
  StatCard,
  StatusBadge,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import { ORDER_STATUS } from "@/lib/status";
import type { OrderStatus } from "@prisma/client";

const SWATCHES: [string, string][] = [
  ["primary", "bg-primary"],
  ["primary-hover", "bg-primary-hover"],
  ["primary-soft", "bg-primary-soft"],
  ["accent", "bg-accent"],
  ["accent-soft", "bg-accent-soft"],
  ["accent-ink", "bg-accent-ink"],
  ["background", "bg-background"],
  ["surface", "bg-surface"],
  ["surface-muted", "bg-surface-muted"],
  ["fg", "bg-fg"],
  ["fg-secondary", "bg-fg-secondary"],
  ["muted", "bg-muted"],
  ["border", "bg-border"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["error", "bg-error"],
  ["info", "bg-info"],
  ["neutral", "bg-neutral"],
];

type Row = { id: string; client: string; total: string; statut: OrderStatus };
const ROWS: Row[] = [
  { id: "#A1F2", client: "Aïcha D.", total: "45 000 FCFA", statut: "en_attente" },
  { id: "#B7C9", client: "Koffi A.", total: "120 000 FCFA", statut: "en_livraison" },
  { id: "#C3D1", client: "Mariam S.", total: "18 500 FCFA", statut: "livree" },
  { id: "#D8E4", client: "Yao K.", total: "9 000 FCFA", statut: "annulee" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card as="section">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

export function DesignSystemDemo() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState("tous");

  return (
    <div className="space-y-6">
      <Section title="Couleurs (tokens)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-control border border-border">
              <div className={`h-12 ${cls}`} />
              <p className="px-2 py-1.5 font-mono text-[11px] text-fg-secondary">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="space-y-2">
          <p className="font-display text-4xl font-semibold tracking-tight">Titre Poppins 36</p>
          <p className="font-display text-2xl font-semibold tracking-tight">Titre de page 24</p>
          <p className="font-display text-base font-semibold">Titre de carte 16</p>
          <p className="text-sm text-fg">Texte Inter 14 — informations produit, tableaux, formulaires.</p>
          <p className="text-sm text-fg-secondary">Texte secondaire</p>
          <p className="text-xs text-muted">Aide et métadonnées 12</p>
          <p className="text-sm font-semibold text-accent-ink">Lien doré lisible (accent-ink)</p>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
          <Button loading>Enregistrement</Button>
          <Button disabled>Désactivé</Button>
          <Button size="sm">
            <Plus className="h-4 w-4" /> Petit
          </Button>
          <Button size="lg">Grand</Button>
        </div>
        <div className="mt-4 rounded-card bg-surface-inverse p-4">
          <p className="mb-3 text-sm text-inverse/80">Sur Deep Green, le Gold sert d’accent :</p>
          <Button variant="accent">Explorer la boutique</Button>
        </div>
      </Section>

      <Section title="Formulaires">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom de la boutique" hint="Visible par les clients" required>
            <Input placeholder="Ma marque" />
          </Field>
          <Field label="Email" error="Adresse email invalide">
            <Input type="email" defaultValue="contact@" />
          </Field>
          <Field label="Code reçu par SMS" success="Code vérifié">
            <Input defaultValue="482913" />
          </Field>
          <Field label="Désactivé">
            <Input disabled defaultValue="Non modifiable" />
          </Field>
          <Field label="Catégorie">
            <Select defaultValue="montre">
              <option value="montre">Montres</option>
              <option value="bijou">Bijoux</option>
            </Select>
          </Field>
          <Field label="Recherche" hideLabel>
            <Input leading={<Search />} placeholder="Rechercher un produit…" />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <Textarea placeholder="Matière, taille, état…" />
          </Field>
          <div className="space-y-3">
            <Checkbox label="J’accepte les conditions" description="Obligatoire pour publier" defaultChecked />
            <Checkbox label="Désactivée" disabled />
          </div>
          <div className="space-y-3" role="radiogroup" aria-label="Paiement">
            <Radio name="pay" label="À la livraison" defaultChecked />
            <Radio name="pay" label="Mobile Money" description="MTN MoMo ou Moov Money" />
          </div>
        </div>
      </Section>

      <Section title="Badges et statuts">
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">Disponible</Badge>
          <Badge tone="warning">Stock bas</Badge>
          <Badge tone="error">Épuisé</Badge>
          <Badge tone="info">Expédié</Badge>
          <Badge tone="neutral">Brouillon</Badge>
          <Badge tone="brand">Nouveau</Badge>
          <Badge tone="accent">Promo</Badge>
          <Badge tone="success" variant="solid">Payé</Badge>
          <Badge tone="error" variant="solid">Annulé</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => (
            <StatusBadge key={s} kind="order" status={s} />
          ))}
          <StatusBadge kind="product" status="rupture" />
          <StatusBadge kind="vendor" status="suspendu" />
          <StatusBadge kind="refund" status="pending" />
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Commandes" value="13" hint="5 en attente" tone="warning" icon={<ShoppingCart />} />
        <StatCard label="Produits en ligne" value="33" icon={<Package />} />
        <StatCard label="Ventes" value="1,2 M FCFA" hint="+12 % ce mois" tone="success" icon={<Wallet />} />
        <StatCard label="À reverser" value="0 FCFA" hint="Rien en attente" icon={<Wallet />} />
      </div>

      <Section title="Tableau (cartes sur mobile)">
        <Tabs
          ariaLabel="Filtrer les commandes"
          value={tab}
          onChange={setTab}
          items={[
            { key: "tous", label: "Toutes" },
            { key: "attente", label: "En attente", badge: <Badge tone="warning">5</Badge> },
            { key: "livrees", label: "Livrées" },
          ]}
          className="mb-4"
        />
        <DataTable
          caption="Dernières commandes"
          rows={ROWS}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Commande", cell: (r) => <span className="font-medium">{r.id}</span>, primary: true },
            { key: "client", header: "Client", cell: (r) => r.client },
            { key: "statut", header: "Statut", cell: (r) => <StatusBadge kind="order" status={r.statut} /> },
            { key: "total", header: "Total", cell: (r) => r.total, align: "right" },
            {
              key: "actions",
              header: <span className="sr-only">Actions</span>,
              actions: true,
              align: "right",
              cell: (r) => (
                <Dropdown
                  items={[
                    { label: "Modifier", icon: <Pencil />, onSelect: () => toast(`Commande ${r.id} ouverte`, "info") },
                    { label: "Annuler la commande", icon: <Trash2 />, danger: true, onSelect: () => setModal(true) },
                  ]}
                />
              ),
            },
          ]}
        />
        <Pagination className="mt-4" page={2} pageCount={6} hrefFor={(p) => `/admin/design-system?page=${p}`} />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Messages">
          <div className="space-y-3">
            <Alert tone="info" title="Information">La commande sera livrée sous 48 h.</Alert>
            <Alert tone="success">Produit enregistré.</Alert>
            <Alert tone="warning" title="Stock bas">3 produits sous le seuil.</Alert>
            <Alert tone="error" title="Paiement refusé" onDismiss={() => undefined}>
              Le client doit réessayer.
            </Alert>
          </div>
        </Section>
        <Section title="Fenêtres, tiroir, notification">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModal(true)}>Ouvrir une fenêtre</Button>
            <Button variant="outline" onClick={() => setDrawer(true)}>Ouvrir un tiroir</Button>
            <Button variant="outline" onClick={() => toast("Produit enregistré")}>Toast succès</Button>
            <Button variant="outline" onClick={() => toast("Échec de l’envoi", "error")}>Toast erreur</Button>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Section title="Chargement">
          <div className="space-y-2">
            <Spinner />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Section>
        <EmptyState
          icon={<Package />}
          title="Aucun produit"
          description="Ajoute ta première pièce pour l’afficher dans la boutique."
          action={<Button size="sm"><Plus className="h-4 w-4" /> Ajouter</Button>}
        />
        <ErrorState description="Vérifie ta connexion puis réessaie." action={<Button variant="outline" size="sm">Réessayer</Button>} />
      </div>

      <Card>
        <CardHeader title="Carte avec en-tête" description="Surface, bordure, rayon et ombre communs" icon={<Package />} actions={<Button size="sm" variant="outline">Action</Button>} />
        <p className="text-sm text-fg-secondary">Contenu de la carte.</p>
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Annuler cette commande ?"
        description="Le stock sera remis en vente."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Garder</Button>
            <Button variant="destructive" onClick={() => { setModal(false); toast("Commande annulée"); }}>Annuler la commande</Button>
          </>
        }
      >
        <p className="text-sm text-fg-secondary">Contenu libre de la fenêtre.</p>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filtres" description="Affine la liste" footer={<Button onClick={() => setDrawer(false)}>Voir 12 résultats</Button>}>
        <div className="space-y-4">
          <Field label="Statut">
            <Select>
              <option>Tous</option>
            </Select>
          </Field>
          <Checkbox label="En stock seulement" />
        </div>
      </Drawer>
    </div>
  );
}
