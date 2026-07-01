"use client";

import { useEffect, useState } from "react";
import { getHistorique } from "@/lib/db";

export default function HistoriquePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getHistorique(200)
      .then(setRows)
      .catch(() => setErrorMsg("Impossible de charger l'historique."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-10 text-center text-sm text-sub">Chargement…</p>;
  }
  if (errorMsg) {
    return <p className="py-10 text-center text-sm text-dngr">{errorMsg}</p>;
  }
  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-sub">Aucun mouvement récent</p>
    );
  }

  const withVariation = rows.map((r) => ({
    ...r,
    variation: r.nouvelle_qte - r.ancienne_qte,
  }));
  const nPlus = withVariation.filter((r) => r.variation > 0).length;
  const nMoins = withVariation.filter((r) => r.variation < 0).length;

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-bdr bg-surf px-2 py-3.5 text-center">
          <div className="font-mono text-2xl font-semibold tabular text-txt">
            {rows.length}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Mouvements
          </div>
        </div>
        <div className="rounded-lg border border-bdr bg-surf px-2 py-3.5 text-center">
          <div className="font-mono text-2xl font-semibold tabular text-dngr">
            {nMoins}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Retraits
          </div>
        </div>
        <div className="rounded-lg border border-bdr bg-surf px-2 py-3.5 text-center">
          <div className="font-mono text-2xl font-semibold tabular text-ok">
            {nPlus}
          </div>
          <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wide text-sub">
            Ajouts
          </div>
        </div>
      </div>

      {withVariation.map((r, i) => (
        <div
          key={i}
          className="flex items-center justify-between border-b border-surf2 py-2.5 text-[0.83rem]"
        >
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-txt">{r.produit}</div>
            <div className="mt-0.5 text-[0.63rem] text-sub">
              {String(r.date).slice(0, 16)} · {r.restaurant}
            </div>
          </div>
          <div className="flex-shrink-0 pl-3 text-right">
            <div
              className={`font-mono text-[0.88rem] font-bold tabular ${
                r.variation > 0 ? "text-ok" : "text-dngr"
              }`}
            >
              {r.variation > 0 ? `+${r.variation}` : r.variation}
            </div>
            <div className="mt-0.5 font-mono text-[0.65rem] tabular text-sub">
              {r.ancienne_qte} → {r.nouvelle_qte}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
