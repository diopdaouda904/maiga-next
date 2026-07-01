"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("Erreur applicative :", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-1 text-sm font-semibold text-txt">
        Un problème est survenu
      </p>
      <p className="mb-5 text-xs text-sub">
        Rien n&apos;est perdu, réessaie simplement.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-acc px-5 py-2.5 text-sm font-bold text-ink"
      >
        Réessayer
      </button>
    </div>
  );
}
