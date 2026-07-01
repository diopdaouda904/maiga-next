"use client";

import { useEffect, useState } from "react";
import { getStocks } from "@/lib/db";

function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export default function AdminPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStocks().then(setStocks).finally(() => setLoading(false));
  }, []);

  function handleExport() {
    const csv = toCsv(stocks);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
    a.href = url;
    a.download = `stock_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p className="py-10 text-center text-sm text-sub">Chargement…</p>;

  return (
    <div>
      <button
        onClick={handleExport}
        className="mb-4 w-full rounded-lg bg-acc py-2.5 text-sm font-bold text-ink"
      >
        Exporter CSV
      </button>

      <div className="overflow-x-auto rounded-lg border border-bdr">
        <table className="w-full text-left text-xs">
          <thead className="bg-surf2">
            <tr>
              <th className="px-2 py-2 font-semibold text-sub">Produit</th>
              <th className="px-2 py-2 font-semibold text-sub">Catégorie</th>
              <th className="px-2 py-2 text-right font-semibold text-sub">Qté</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s) => (
              <tr key={`${s.restaurant}-${s.produit}`} className="border-t border-bdr">
                <td className="px-2 py-2 text-txt">{s.produit}</td>
                <td className="px-2 py-2 text-sub">{s.categorie}</td>
                <td className="px-2 py-2 text-right font-mono tabular text-txt">
                  {s.quantite}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
