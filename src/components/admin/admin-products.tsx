"use client";

import { useState, useTransition } from "react";
import type {
  Categorie,
  Genre,
  Product,
  ProductSource,
  ProductStatus,
} from "@prisma/client";
import { upsertProduct } from "@/lib/actions";
import { CATEGORIE_LABELS, GENRE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Package, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Drawer } from "@/components/ui/overlay";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/feedback";

type Props = {
  products: Product[];
  vendorId: string;
};

const emptyForm = {
  nom: "",
  description: "",
  categorie: "montre" as Categorie,
  genre: "unisexe" as Genre,
  prix: 15000,
  prixPromo: "" as string | number,
  stockQuantite: 10,
  source: "local" as ProductSource,
  images: "",
  statut: "actif" as ProductStatus,
};

export function AdminProducts({ products, vendorId }: Props) {
  const [list] = useState(products);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [form, setForm] = useState(emptyForm);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function startCreate() {
    setEditId(undefined);
    setError(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function startEdit(p: Product) {
    setEditId(p.id);
    setError(null);
    setForm({
      nom: p.nom,
      description: p.description,
      categorie: p.categorie,
      genre: p.genre,
      prix: p.prix,
      prixPromo: p.prixPromo ?? "",
      stockQuantite: p.stockQuantite,
      source: p.source,
      images: p.images.join("\n"),
      statut: p.statut,
    });
    setOpen(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const images = form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await upsertProduct(vendorId, {
        id: editId,
        nom: form.nom,
        description: form.description,
        categorie: form.categorie,
        genre: form.genre,
        prix: Number(form.prix),
        prixPromo: form.prixPromo === "" ? null : Number(form.prixPromo),
        stockQuantite: Number(form.stockQuantite),
        source: form.source,
        images:
          images.length > 0
            ? images
            : [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
              ],
        statut: form.statut,
      });

      if (!res.success) {
        setError(res.error ?? "Enregistrement impossible");
        return;
      }
      setOpen(false);
      window.location.reload();
    });
  }

  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{list.length} produit(s)</p>
        <Button size="sm" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <DataTable
        caption="Produits de la boutique Coin229"
        rows={list}
        rowKey={(p) => p.id}
        empty={
          <EmptyState
            icon={<Package />}
            title="Aucun produit"
            description="Ajoute la première pièce de la boutique Coin229."
            action={
              <Button size="sm" onClick={startCreate}>
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            }
          />
        }
        columns={[
          { key: "nom", header: "Produit", primary: true, cell: (p) => <span className="font-medium">{p.nom}</span> },
          { key: "prix", header: "Prix", align: "right", cell: (p) => formatPrice(p.prixPromo ?? p.prix) },
          { key: "stock", header: "Stock", align: "right", cell: (p) => p.stockQuantite },
          { key: "statut", header: "Statut", cell: (p) => <StatusBadge kind="product" status={p.statut} /> },
          { key: "source", header: "Source", hideOnMobile: true, cell: (p) => (p.source === "chine" ? "Chine" : "Local") },
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            actions: true,
            align: "right",
            cell: (p) => (
              <Button size="sm" variant="outline" onClick={() => startEdit(p)} aria-label={`Modifier ${p.nom}`}>
                <Pencil className="h-4 w-4" />
                <span className="md:sr-only">Modifier</span>
              </Button>
            ),
          },
        ]}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "Modifier le produit" : "Nouveau produit"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" form="admin-product-form" loading={pending}>
              Enregistrer
            </Button>
          </>
        }
      >
        <form id="admin-product-form" onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom" required>
            <Input value={form.nom} onChange={(e) => set({ nom: e.target.value })} />
          </Field>
          <Field label="Description" required>
            <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <Select value={form.categorie} onChange={(e) => set({ categorie: e.target.value as Categorie })}>
                {(Object.keys(CATEGORIE_LABELS) as Categorie[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIE_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Public">
              <Select value={form.genre} onChange={(e) => set({ genre: e.target.value as Genre })}>
                {(Object.keys(GENRE_LABELS) as Genre[]).map((g) => (
                  <option key={g} value={g}>
                    {GENRE_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prix (FCFA)" required>
              <Input type="number" min={0} value={form.prix} onChange={(e) => set({ prix: Number(e.target.value) })} />
            </Field>
            <Field label="Prix promo" hint="Vide = pas de promo">
              <Input type="number" min={0} value={form.prixPromo} onChange={(e) => set({ prixPromo: e.target.value })} />
            </Field>
            <Field label="Stock" required>
              <Input
                type="number"
                min={0}
                value={form.stockQuantite}
                onChange={(e) => set({ stockQuantite: Number(e.target.value) })}
              />
            </Field>
            <Field label="Provenance">
              <Select value={form.source} onChange={(e) => set({ source: e.target.value as ProductSource })}>
                <option value="local">Local</option>
                <option value="chine">Chine</option>
              </Select>
            </Field>
          </div>
          <Field label="Statut">
            <Select value={form.statut} onChange={(e) => set({ statut: e.target.value as ProductStatus })}>
              <option value="actif">En vente</option>
              <option value="rupture">Épuisé</option>
              <option value="archive">Retiré</option>
            </Select>
          </Field>
          <Field label="Images" hint="Une adresse par ligne">
            <Textarea rows={2} value={form.images} onChange={(e) => set({ images: e.target.value })} />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
        </form>
      </Drawer>
    </div>
  );
}
