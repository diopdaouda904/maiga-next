import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!url || !key) {
  // Erreur volontairement explicite : plus simple à diagnostiquer qu'un
  // crash Supabase générique si les variables d'environnement manquent.
  console.warn(
    "⚠️  NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_KEY manquant(e). " +
      "Vérifie ton fichier .env.local (en local) ou les variables d'environnement Vercel (en prod)."
  );
}

export const supabase = createClient(url, key);
