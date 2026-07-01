"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("employe");
  const [password, setPassword] = useState("");
  const [rester, setRester] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password, rester }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Mot de passe incorrect");
        setLoading(false);
        return;
      }
      router.push("/stock");
      router.refresh();
    } catch {
      setError("Erreur de connexion, réessaie.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-acc font-mono text-lg font-bold text-ink">
          M
        </div>
        <h1 className="text-xl font-bold tracking-tight text-txt">Maïga Smash</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-sub">
          Gestion des stocks
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-sub">Rôle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm text-txt outline-none focus:border-acc"
          >
            <option value="employe">Employé</option>
            <option value="patron">Patron</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-sub">
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm text-txt outline-none focus:border-acc"
            autoFocus
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-sub">
          <input
            type="checkbox"
            checked={rester}
            onChange={(e) => setRester(e.target.checked)}
            className="h-4 w-4 rounded border-bdr accent-[var(--acc)]"
          />
          Rester connecté pendant 7 jours
        </label>

        {error && <p className="text-sm text-dngr">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-acc py-3 text-sm font-bold text-ink transition hover:bg-acc2 disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
