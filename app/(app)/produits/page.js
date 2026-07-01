"use client";

import { useEffect, useState } from "react";
import {
  getAllProduits,
  getCategories,
  addProduit,
  updateProduit,
  deleteProduit,
  produitExiste,
} from "@/lib/db";

const UNITES = ["kg", "g", "L", "mL", "unité", "pièce", "boîte", "sachet", "carton"];

function ProduitForm({ initial, categories, onCancel, onSubmit, submitLabel }) {
  const [nom, setNom] = useState(initial?.nom || "");
  const [categorieChoice, setCategorieChoice] = useState(
    initial?.categorie && categories.includes(initial.categorie)
      ? initial.categorie
      : categories.length > 0
      ? categories[0]
      : "__new__"
  );
  const [nouvelleCategorie, setNouvelleCategorie] = useState(
    initial?.categorie && !categories.includes(initial.categorie) ? initial.categorie : ""
  );
  const [fournisseur, setFournisseur] = useState(initial?.fournisseur || "");
  const [unite, setUnite] = useState(initial?.unite || UNITES[0]);
  const [seuilAlerte, setSeuilAlerte] = useState(initial?.seuil_alerte ?? 5);
  const [quantiteInitiale, setQuantiteInitiale] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const categorieFinale =
    categorieChoice === "__new__" ? nouvelleCategorie.trim() : categorieChoice;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!nom.trim() || !categorieFinale) {
      setError("Le nom et la catégorie sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        nom: nom.trim(),
        categorie: categorieFinale,
        fournisseur: fournisseur.trim(),
        unite,
        seuilAlerte: Number(seuilAlerte) || 0,
        quantiteInitiale: Number(quantiteInitiale) || 0,
      });
    } catch (err) {
      setError("Une erreur est survenue, réessaie.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-3 rounded-lg border border-bdr bg-surf p-3.5">
      <label className="mb-1 block text-xs font-medium text-sub">Nom du produit</label>
      <input
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Ex : Pain burger brioché"
        className="mb-3 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
      />

      <label className="mb-1 block text-xs font-medium text-sub">Catégorie</label>
      <select
        value={categorieChoice}
        onChange={(e) => setCategorieChoice(e.target.value)}
        className="mb-2 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value="__new__">+ Nouvelle catégorie</option>
      </select>
      {categorieChoice === "__new__" && (
        <input
          value={nouvelleCategorie}
          onChange={(e) => setNouvelleCategorie(e.target.value)}
          placeholder="Ex : Pains & buns"
          className="mb-3 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
        />
      )}

      <label className="mb-1 block text-xs font-medium text-sub">Fournisseur</label>
      <input
        value={fournisseur}
        onChange={(e) => setFournisseur(e.target.value)}
        placeholder="Ex : Metro"
        className="mb-3 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-sub">Unité</label>
          <select
            value={unite}
            onChange={(e) => setUnite(e.target.value)}
            className="w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
          >
            {UNITES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-sub">Seuil d&apos;alerte</label>
          <input
            type="number"
            min={0}
            value={seuilAlerte}
            onChange={(e) => setSeuilAlerte(e.target.value)}
            className="w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
          />
        </div>
      </div>

      {!initial && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-sub">
            Quantité de départ
          </label>
          <input
            type="number"
            min={0}
            value={quantiteInitiale}
            onChange={(e) => setQuantiteInitiale(e.target.value)}
            className="w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
          />
        </div>
      )}

      {error && <p className="mb-3 text-xs text-dngr">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-acc py-2.5 text-sm font-bold text-ink disabled:opacity-60"
        >
          {saving ? "..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-bdr bg-surf py-2.5 text-sm text-sub"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

export default function ProduitsPage() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null); // nom du produit en édition
  const [confirmDelete, setConfirmDelete] = useState(null); // nom du produit

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([getAllProduits(), getCategories()]);
      setProduits(p);
      setCategories(c);
      setErrorMsg("");
    } catch {
      setErrorMsg("Impossible de charger le catalogue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(data) {
    if (await produitExiste(data.nom)) {
      throw new Error("existe déjà");
    }
    await addProduit(data);
    setShowAdd(false);
    await load();
  }

  async function handleEdit(nomOriginal, data) {
    await updateProduit({ nomOriginal, ...data });
    setEditing(null);
    await load();
  }

  async function handleDelete(nom) {
    await deleteProduit(nom);
    setConfirmDelete(null);
    await load();
  }

  if (loading) return <p className="py-10 text-center text-sm text-sub">Chargement…</p>;

  const grouped = produits.reduce((acc, p) => {
    (acc[p.categorie] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[0.63rem] font-bold uppercase tracking-wide text-sub">
          Catalogue
        </span>
        <span className="text-[0.72rem] text-sub">
          {produits.length} produit{produits.length !== 1 ? "s" : ""}
        </span>
      </div>

      {errorMsg && <p className="mb-3 text-xs text-dngr">{errorMsg}</p>}

      <button
        onClick={() => {
          setShowAdd(!showAdd);
          setEditing(null);
        }}
        className="mb-3 w-full rounded-lg bg-acc py-2.5 text-sm font-bold text-ink"
      >
        {showAdd ? "− Annuler" : "+ Nouveau produit"}
      </button>

      {showAdd && (
        <ProduitForm
          categories={categories}
          onCancel={() => setShowAdd(false)}
          onSubmit={handleAdd}
          submitLabel="Enregistrer le produit"
        />
      )}

      {produits.length === 0 && !showAdd && (
        <p className="py-8 text-center text-sm text-sub">
          Aucun produit dans le catalogue pour l&apos;instant
        </p>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <div className="border-l-2 border-acc py-3.5 pl-2 text-[0.63rem] font-bold uppercase tracking-wide text-sub">
            {cat}
          </div>
          {items.map((p) => (
            <div key={p.nom} className="mb-2 rounded-lg border border-bdr bg-surf p-3">
              <div className="text-[0.88rem] font-semibold text-txt">{p.nom}</div>
              <div className="mt-0.5 text-[0.66rem] text-sub">
                {p.fournisseur || "—"} · {p.unite || "—"} · seuil {p.seuil_alerte ?? 0}
              </div>

              {confirmDelete === p.nom ? (
                <div className="mt-2.5">
                  <div className="rounded-lg border border-dngr/30 bg-dngr/5 p-3 text-xs">
                    <strong className="text-txt">Supprimer « {p.nom} » ?</strong>
                    <p className="mt-1 text-sub">
                      Le produit et son historique seront définitivement retirés.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDelete(p.nom)}
                      className="rounded-lg border border-dngr py-2 text-xs font-semibold text-dngr"
                    >
                      Confirmer la suppression
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg border border-bdr py-2 text-xs text-sub"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : editing === p.nom ? (
                <div className="mt-2.5">
                  <ProduitForm
                    initial={p}
                    categories={categories}
                    onCancel={() => setEditing(null)}
                    onSubmit={(data) => handleEdit(p.nom, data)}
                    submitLabel="Enregistrer"
                  />
                </div>
              ) : (
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setEditing(p.nom);
                      setShowAdd(false);
                    }}
                    className="rounded-lg border border-bdr py-2 text-xs text-sub"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => setConfirmDelete(p.nom)}
                    className="rounded-lg border border-bdr py-2 text-xs text-sub"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
