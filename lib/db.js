import { supabase } from "./supabase";

export const RESTAURANTS = ["Maïga Smash"];

// ── Lectures ─────────────────────────────────────────────────────────────────
export async function getStocks(restaurant) {
  let stocksQuery = supabase.from("stocks").select("*");
  if (restaurant) stocksQuery = stocksQuery.eq("restaurant", restaurant);

  const [{ data: stocks, error: e1 }, { data: produits, error: e2 }] =
    await Promise.all([stocksQuery, supabase.from("produits").select("*")]);

  if (e1) throw e1;
  if (e2) throw e2;
  if (!stocks || !produits) return [];

  const produitsByNom = Object.fromEntries(produits.map((p) => [p.nom, p]));

  const merged = stocks
    .filter((s) => produitsByNom[s.produit])
    .map((s) => {
      const p = produitsByNom[s.produit];
      return {
        restaurant: s.restaurant,
        produit: s.produit,
        quantite: s.quantite,
        date_maj: s.date_maj,
        categorie: p.categorie,
        fournisseur: p.fournisseur,
        unite: p.unite,
        seuil_alerte: p.seuil_alerte,
      };
    });

  merged.sort(
    (a, b) =>
      a.categorie.localeCompare(b.categorie) ||
      a.produit.localeCompare(b.produit)
  );
  return merged;
}

export async function getHistorique(limit = 200) {
  const { data, error } = await supabase
    .from("historique")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getProduitByBarcode(codeBarres) {
  const { data, error } = await supabase
    .from("produits")
    .select("nom")
    .eq("code_barres", codeBarres);
  if (error) throw error;
  return data && data.length > 0 ? data[0].nom : null;
}

export async function getAllProduits() {
  const { data, error } = await supabase.from("produits").select("*");
  if (error) throw error;
  const list = data || [];
  list.sort(
    (a, b) =>
      (a.categorie || "").localeCompare(b.categorie || "") ||
      a.nom.localeCompare(b.nom)
  );
  return list;
}

export async function getCategories() {
  const { data, error } = await supabase.from("produits").select("categorie");
  if (error) throw error;
  const set = new Set((data || []).map((r) => r.categorie).filter(Boolean));
  return Array.from(set).sort();
}

export async function produitExiste(nom) {
  const { data, error } = await supabase
    .from("produits")
    .select("nom")
    .eq("nom", nom);
  if (error) throw error;
  return (data || []).length > 0;
}

// ── Écritures ────────────────────────────────────────────────────────────────
function nowStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export async function updateStock(restaurant, produit, ancienneQte, nouvelleQte) {
  const now = nowStr();

  const { error: e1 } = await supabase.from("stocks").upsert(
    { restaurant, produit, quantite: nouvelleQte, date_maj: now },
    { onConflict: "restaurant,produit" }
  );
  if (e1) throw e1;

  const { error: e2 } = await supabase.from("historique").insert({
    date: now,
    restaurant,
    produit,
    ancienne_qte: ancienneQte,
    nouvelle_qte: nouvelleQte,
  });
  if (e2) throw e2;
}

export async function enregistrerCodeBarres(produitNom, codeBarres) {
  const { error } = await supabase
    .from("produits")
    .update({ code_barres: codeBarres })
    .eq("nom", produitNom);
  if (error) throw error;
}

export async function addProduit({
  nom,
  categorie,
  fournisseur,
  unite,
  seuilAlerte,
  quantiteInitiale = 0,
}) {
  const { error: e1 } = await supabase.from("produits").insert({
    nom,
    categorie,
    fournisseur,
    unite,
    seuil_alerte: seuilAlerte,
  });
  if (e1) throw e1;

  const now = nowStr();
  for (const restaurant of RESTAURANTS) {
    const { error: e2 } = await supabase.from("stocks").upsert(
      { restaurant, produit: nom, quantite: quantiteInitiale, date_maj: now },
      { onConflict: "restaurant,produit" }
    );
    if (e2) throw e2;
  }
}

export async function updateProduit({
  nomOriginal,
  nom,
  categorie,
  fournisseur,
  unite,
  seuilAlerte,
}) {
  const { error: e1 } = await supabase
    .from("produits")
    .update({ nom, categorie, fournisseur, unite, seuil_alerte: seuilAlerte })
    .eq("nom", nomOriginal);
  if (e1) throw e1;

  if (nom !== nomOriginal) {
    const { error: e2 } = await supabase
      .from("stocks")
      .update({ produit: nom })
      .eq("produit", nomOriginal);
    if (e2) throw e2;

    const { error: e3 } = await supabase
      .from("historique")
      .update({ produit: nom })
      .eq("produit", nomOriginal);
    if (e3) throw e3;
  }
}

export async function deleteProduit(nom) {
  const { error: e1 } = await supabase.from("stocks").delete().eq("produit", nom);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("produits").delete().eq("nom", nom);
  if (e2) throw e2;
}
