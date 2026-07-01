"use client";

import { useEffect, useMemo, useState } from "react";
import { getStocks, updateStock, RESTAURANTS } from "@/lib/db";

function statusClass(qte, seuil) {
  if (qte === 0) return "text-dngr";
  if (qte <= seuil) return "text-warn";
  return "text-ok";
}

// Champ de quantité "libre pendant la frappe" : contrairement à un input
// contrôlé classique, effacer le champ ne l'envoie pas immédiatement comme
// zéro — la valeur ne se valide (et ne part vers Supabase) qu'à la sortie
// du champ (clic ailleurs ou touche Entrée). Ça permet de tout effacer et
// retaper un nombre à deux chiffres sans être interrompu à chaque frappe.
function QtyField({ quantite, disabled, onCommit, className }) {
  const [value, setValue] = useState(String(quantite));

  // Si la vraie quantité change depuis l'extérieur (boutons +/-, mise à
  // jour depuis un autre appareil), on resynchronise l'affichage — mais
  // uniquement quand l'utilisateur n'est pas en train de taper dedans.
  useEffect(() => {
    setValue(String(quantite));
  }, [quantite]);

  function commit() {
    const parsed = value.trim() === "" ? 0 : parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(String(quantite)); // saisie invalide : on revient à la vraie valeur
      return;
    }
    if (parsed !== quantite) onCommit(parsed);
    else setValue(String(quantite));
  }

  return (
    <input
      type="number"
      min={0}
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={className}
    />
  );
}

export default function StockPage() {
  const restaurant = RESTAURANTS[0];
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("Toutes les catégories");
  const [kpiFilter, setKpiFilter] = useState(null); // "rupture" | "alerte" | null
  const [pendingKeys, setPendingKeys] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getStocks(restaurant);
      setStocks(data);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg("Impossible de charger le stock. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(
    () => ["Toutes les catégories", ...new Set(stocks.map((s) => s.categorie))].sort(
      (a, b) => (a === "Toutes les catégories" ? -1 : a.localeCompare(b))
    ),
    [stocks]
  );

  const nTotal = stocks.length;
  const nRupture = stocks.filter((s) => s.quantite === 0).length;
  const nAlerte = stocks.filter((s) => s.quantite <= s.seuil_alerte).length;

  const filtered = stocks.filter((s) => {
    if (search && !s.produit.toLowerCase().includes(search.toLowerCase())) return false;
    if (categorie !== "Toutes les catégories" && s.categorie !== categorie) return false;
    if (kpiFilter === "rupture" && s.quantite !== 0) return false;
    if (kpiFilter === "alerte" && !(s.quantite > 0 && s.quantite <= s.seuil_alerte))
      return false;
    return true;
  });

  const groupedByCategorie = filtered.reduce((acc, s) => {
    (acc[s.categorie] ||= []).push(s);
    return acc;
  }, {});

  // Mise à jour vraiment instantanée : on change l'état local tout de suite,
  // l'écriture Supabase se fait derrière. En cas d'erreur, on revient en arrière.
  async function handleChangeQte(produit, ancienneQte, nouvelleQte) {
    if (nouvelleQte === ancienneQte || nouvelleQte < 0) return;

    setStocks((prev) =>
      prev.map((s) => (s.produit === produit ? { ...s, quantite: nouvelleQte } : s))
    );
    setPendingKeys((prev) => new Set(prev).add(produit));

    try {
      await updateStock(restaurant, produit, ancienneQte, nouvelleQte);
    } catch (err) {
      // Écriture échouée : on annule le changement affiché
      setStocks((prev) =>
        prev.map((s) => (s.produit === produit ? { ...s, quantite: ancienneQte } : s))
      );
      setErrorMsg(`Échec de la mise à jour de "${produit}". Réessaie.`);
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(produit);
        return next;
      });
    }
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-sub">Chargement du stock…</p>;
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-3 rounded-lg border border-dngr/30 bg-dngr/5 px-3 py-2 text-xs text-dngr">
          {errorMsg}
        </div>
      )}

      {/* KPI */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <button
          onClick={() => setKpiFilter(kpiFilter === "rupture" ? null : "rupture")}
          className={`rounded-lg border bg-surf px-2 py-3.5 text-center transition ${
            kpiFilter === "rupture" ? "border-dngr shadow-[0_0_0_1px_var(--dngr)]" : "border-bdr"
          }`}
        >
          <div className="font-mono text-2xl font-semibold tabular text-dngr">
            {nRupture}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Ruptures
          </div>
        </button>
        <button
          onClick={() => setKpiFilter(kpiFilter === "alerte" ? null : "alerte")}
          className={`rounded-lg border bg-surf px-2 py-3.5 text-center transition ${
            kpiFilter === "alerte" ? "border-warn shadow-[0_0_0_1px_var(--warn)]" : "border-bdr"
          }`}
        >
          <div className="font-mono text-2xl font-semibold tabular text-warn">
            {nAlerte}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Alertes
          </div>
        </button>
        <button
          onClick={() => setKpiFilter(null)}
          className="rounded-lg border border-bdr bg-surf px-2 py-3.5 text-center"
        >
          <div className="font-mono text-2xl font-semibold tabular text-txt">
            {nTotal}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Produits
          </div>
        </button>
      </div>

      {/* Recherche + filtre catégorie */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un produit..."
        className="mb-2 w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm text-txt outline-none focus:border-acc"
      />
      <select
        value={categorie}
        onChange={(e) => setCategorie(e.target.value)}
        className="mb-1 w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm text-txt outline-none focus:border-acc"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {(search || categorie !== "Toutes les catégories" || kpiFilter) && (
        <div className="py-1.5 text-[0.7rem] uppercase tracking-wide text-sub">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-sub">Aucun produit trouvé</p>
      ) : (
        Object.entries(groupedByCategorie).map(([cat, items]) => (
          <div key={cat}>
            <div className="border-l-2 border-acc py-3.5 pl-2 text-[0.63rem] font-bold uppercase tracking-wide text-sub">
              {cat}
            </div>
            {items.map((s) => (
              <div key={s.produit} className="border-b border-surf2 py-2 last:border-0">
                <div className="text-[0.87rem] font-semibold text-txt">{s.produit}</div>
                <div className="mt-0.5 text-[0.65rem] text-sub">
                  {s.fournisseur} · seuil {s.seuil_alerte} {s.unite} ·{" "}
                  <span className={statusClass(s.quantite, s.seuil_alerte)}>
                    {s.quantite} {s.unite}
                  </span>
                </div>

                <div className="mt-2 flex gap-1.5">
                  <QtyField
                    quantite={s.quantite}
                    disabled={pendingKeys.has(s.produit)}
                    onCommit={(nouvelleQte) =>
                      handleChangeQte(s.produit, s.quantite, nouvelleQte)
                    }
                    className="flex-1 rounded-lg border border-bdr bg-surf px-2 py-2 text-center font-mono text-[1.05rem] font-semibold tabular text-txt outline-none focus:border-acc disabled:opacity-50"
                  />
                  <button
                    onClick={() =>
                      s.quantite > 0 && handleChangeQte(s.produit, s.quantite, s.quantite - 1)
                    }
                    disabled={pendingKeys.has(s.produit) || s.quantite === 0}
                    className="w-11 rounded-lg border border-bdr bg-surf text-lg text-sub transition hover:border-sub hover:text-txt disabled:opacity-40"
                  >
                    −
                  </button>
                  <button
                    onClick={() => handleChangeQte(s.produit, s.quantite, s.quantite + 1)}
                    disabled={pendingKeys.has(s.produit)}
                    className="w-11 rounded-lg border border-bdr bg-surf text-lg text-sub transition hover:border-sub hover:text-txt disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
