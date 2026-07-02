"use client";

import { useEffect, useMemo, useState } from "react";
import { getStocks, updateStock, RESTAURANTS } from "@/lib/db";

// Champ de saisie libre (même logique que sur la page Stock : pas d'envoi
// prématuré pendant la frappe, seulement à la validation).
function CountField({ quantite, onConfirm, confirmed }) {
  const [value, setValue] = useState(String(quantite));

  useEffect(() => {
    setValue(String(quantite));
  }, [quantite]);

  function handleConfirm() {
    const parsed = value.trim() === "" ? 0 : parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      setValue(String(quantite));
      return;
    }
    onConfirm(parsed);
  }

  return (
    <div className="flex gap-1.5">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
        }}
        className="flex-1 rounded-lg border border-bdr bg-surf px-2 py-2 text-center font-mono text-[1.05rem] font-semibold tabular text-txt outline-none focus:border-acc"
      />
      <button
        onClick={handleConfirm}
        className={`w-11 rounded-lg text-lg transition ${
          confirmed
            ? "border border-ok/30 bg-ok/10 text-ok"
            : "border border-bdr bg-surf text-sub hover:border-acc hover:text-acc"
        }`}
      >
        ✓
      </button>
    </div>
  );
}

export default function InventairePage() {
  const restaurant = RESTAURANTS[0];
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [countedSet, setCountedSet] = useState(new Set());
  const [savingKeys, setSavingKeys] = useState(new Set());

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getStocks(restaurant);
      setStocks(data);
      setErrorMsg("");
    } catch {
      setErrorMsg("Impossible de charger le stock.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCount(produit, ancienneQte, nouvelleQte) {
    setSavingKeys((prev) => new Set(prev).add(produit));
    try {
      if (nouvelleQte !== ancienneQte) {
        await updateStock(restaurant, produit, ancienneQte, nouvelleQte);
        setStocks((prev) =>
          prev.map((s) => (s.produit === produit ? { ...s, quantite: nouvelleQte } : s))
        );
      }
      setCountedSet((prev) => new Set(prev).add(produit));
    } catch {
      setErrorMsg(`Échec de l'enregistrement pour "${produit}". Réessaie.`);
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(produit);
        return next;
      });
    }
  }

  function handleNouvelInventaire() {
    setCountedSet(new Set());
  }

  const filtered = useMemo(
    () =>
      search
        ? stocks.filter((s) => s.produit.toLowerCase().includes(search.toLowerCase()))
        : stocks,
    [stocks, search]
  );

  const grouped = useMemo(() => {
    return filtered.reduce((acc, s) => {
      (acc[s.categorie] ||= []).push(s);
      return acc;
    }, {});
  }, [filtered]);

  const total = stocks.length;
  const nComptes = countedSet.size;
  const progressPct = total > 0 ? Math.round((nComptes / total) * 100) : 0;

  if (loading) {
    return <p className="py-10 text-center text-sm text-sub">Chargement…</p>;
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-bdr bg-surf p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-sub">
            Progression de l&apos;inventaire
          </span>
          <span className="font-mono text-[0.8rem] font-semibold tabular text-txt">
            {nComptes}/{total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surf2">
          <div
            className="h-full rounded-full bg-acc transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {nComptes === total && total > 0 && (
          <p className="mt-2 text-xs font-medium text-ok">
            Tous les produits ont été comptés ✓
          </p>
        )}
        {nComptes > 0 && (
          <button
            onClick={handleNouvelInventaire}
            className="mt-2 text-[0.72rem] font-medium text-sub underline underline-offset-2"
          >
            Recommencer un nouvel inventaire
          </button>
        )}
      </div>

      <p className="mb-3 text-xs text-sub">
        Compte chaque produit physiquement, saisis le vrai chiffre et valide avec ✓ —
        même si le chiffre n&apos;a pas changé, ça permet de savoir que tu es bien passé
        dessus.
      </p>

      {errorMsg && (
        <div className="mb-3 rounded-lg border border-dngr/30 bg-dngr/5 px-3 py-2 text-xs text-dngr">
          {errorMsg}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filtrer par nom..."
        className="mb-3 w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm text-txt outline-none focus:border-acc"
      />

      {Object.entries(grouped).map(([cat, items]) => {
        const catComptes = items.filter((s) => countedSet.has(s.produit)).length;
        return (
          <div key={cat}>
            <div className="flex items-center justify-between border-l-2 border-acc py-3.5 pl-2">
              <span className="text-[0.63rem] font-bold uppercase tracking-wide text-sub">
                {cat}
              </span>
              <span className="pr-2 font-mono text-[0.65rem] tabular text-sub">
                {catComptes}/{items.length}
              </span>
            </div>
            {items.map((s) => {
              const isCounted = countedSet.has(s.produit);
              return (
                <div
                  key={s.produit}
                  className={`border-b border-surf2 py-2.5 transition-opacity last:border-0 ${
                    isCounted ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="text-[0.87rem] font-semibold text-txt">
                      {s.produit}
                    </div>
                    {isCounted && <span className="text-xs text-ok">✓</span>}
                  </div>
                  <div className="mb-2 mt-0.5 text-[0.65rem] text-sub">
                    Actuellement enregistré : {s.quantite} {s.unite}
                  </div>
                  <CountField
                    quantite={s.quantite}
                    confirmed={isCounted}
                    onConfirm={(nv) => handleConfirmCount(s.produit, s.quantite, nv)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
