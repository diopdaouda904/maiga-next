"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProduitByBarcode,
  getAllProduits,
  enregistrerCodeBarres,
  updateStock,
  RESTAURANTS,
} from "@/lib/db";

export default function ScannerPage() {
  const restaurant = RESTAURANTS[0];
  const [mode, setMode] = useState("camera"); // "camera" | "manual"
  const [manualCode, setManualCode] = useState("");
  const [scannedCode, setScannedCode] = useState("");
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef(null);
  const readerDivRef = useRef(null);

  const [produitTrouve, setProduitTrouve] = useState(null); // { nom, quantite, unite, seuil_alerte }
  const [qteRetrait, setQteRetrait] = useState(1);
  const [produitsPourAssociation, setProduitsPourAssociation] = useState([]);
  const [choixAssociation, setChoixAssociation] = useState("");
  const [message, setMessage] = useState(null); // { type: "ok"|"error", text }

  // ── Caméra : chargement dynamique de html5-qrcode (même lib que la version Streamlit) ──
  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;

    async function startScanner() {
      if (!window.Html5Qrcode) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        }).catch(() => setCameraError("Impossible de charger le lecteur de caméra."));
      }
      if (cancelled || !window.Html5Qrcode || !readerDivRef.current) return;

      const scanner = new window.Html5Qrcode(readerDivRef.current.id);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 140 } },
          (code) => {
            setScannedCode(code);
            stopScanner();
          }
        );
      } catch (err) {
        if (!cancelled) setCameraError("Caméra inaccessible : " + err);
      }
    }

    // html5-qrcode insère lui-même des éléments (vidéo, canvas) dans le DOM,
    // en dehors du contrôle de React. Si on quitte la page pendant que la
    // caméra tourne encore, React essaie de nettoyer cette zone au même
    // moment que la lib — conflit garanti ("erreur" jusqu'au rechargement).
    // On stoppe donc TOUJOURS proprement la caméra avant de laisser React
    // démonter le composant, en vérifiant l'état réel du scanner avant
    // d'agir (évite d'appeler stop() sur un scanner déjà arrêté).
    function stopScanner() {
      const scanner = scannerRef.current;
      if (!scanner) return Promise.resolve();
      scannerRef.current = null;

      const isScanning =
        window.Html5Qrcode &&
        scanner.getState &&
        scanner.getState() === window.Html5QrcodeScannerState?.SCANNING;

      const stopPromise = isScanning ? scanner.stop() : Promise.resolve();

      return stopPromise
        .catch(() => {})
        .finally(() => {
          try {
            scanner.clear();
          } catch {
            // Rien à faire : le conteneur est déjà propre ou démonté.
          }
        });
    }

    startScanner();
    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [mode]);

  const codeActif = mode === "manual" ? manualCode.trim() : scannedCode;

  useEffect(() => {
    if (codeActif.length > 3) lookupCode(codeActif);
    else {
      setProduitTrouve(null);
      setProduitsPourAssociation([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeActif]);

  async function lookupCode(code) {
    setMessage(null);
    try {
      const nom = await getProduitByBarcode(code);
      if (nom) {
        // On récupère l'état courant du produit dans le stock
        const { getStocks } = await import("@/lib/db");
        const stocks = await getStocks(restaurant);
        const ligne = stocks.find((s) => s.produit === nom);
        if (ligne) {
          setProduitTrouve(ligne);
          setQteRetrait(1);
        }
      } else {
        setProduitTrouve(null);
        const produits = await getAllProduits();
        setProduitsPourAssociation(produits.map((p) => p.nom));
        setChoixAssociation(produits[0]?.nom || "");
      }
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion, réessaie." });
    }
  }

  async function handleConfirmerRetrait() {
    if (!produitTrouve) return;
    const nv = Math.max(0, produitTrouve.quantite - qteRetrait);
    try {
      await updateStock(restaurant, produitTrouve.produit, produitTrouve.quantite, nv);
      setMessage({
        type: "ok",
        text: `${produitTrouve.produit} : ${produitTrouve.quantite} → ${nv} ${produitTrouve.unite}`,
      });
      setProduitTrouve({ ...produitTrouve, quantite: nv });
      if (nv <= produitTrouve.seuil_alerte) {
        setMessage({
          type: "error",
          text: `Stock bas sur ${produitTrouve.produit}`,
        });
      }
    } catch {
      setMessage({ type: "error", text: "Échec de la mise à jour, réessaie." });
    }
  }

  async function handleAssocier() {
    if (!choixAssociation) return;
    try {
      await enregistrerCodeBarres(choixAssociation, codeActif);
      setMessage({ type: "ok", text: `Code ${codeActif} associé à ${choixAssociation}` });
      setProduitsPourAssociation([]);
      lookupCode(codeActif);
    } catch {
      setMessage({ type: "error", text: "Échec de l'association, réessaie." });
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setMode("camera");
            setScannedCode("");
            setManualCode("");
            setProduitTrouve(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            mode === "camera" ? "border-acc text-txt" : "border-bdr text-sub"
          }`}
        >
          Caméra
        </button>
        <button
          onClick={() => {
            setMode("manual");
            setScannedCode("");
            setProduitTrouve(null);
            setMessage(null);
          }}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            mode === "manual" ? "border-acc text-txt" : "border-bdr text-sub"
          }`}
        >
          Saisie manuelle
        </button>
      </div>

      {mode === "camera" ? (
        <div className="mb-3">
          <p className="mb-2 text-xs text-sub">
            Autorise l&apos;accès à la caméra, puis vise le code-barres.
          </p>
          <div
            id="reader"
            ref={readerDivRef}
            className="overflow-hidden rounded-xl border border-bdr"
          />
          {cameraError && (
            <div className="mt-2 rounded-lg border border-dngr/30 bg-dngr/5 p-2.5 text-xs text-dngr">
              {cameraError}
            </div>
          )}
          {scannedCode && (
            <div className="mt-2 rounded-lg border border-ok/30 bg-ok/5 p-2.5 text-xs text-ok">
              Code détecté : {scannedCode}
            </div>
          )}
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ou entre le code manuellement..."
            className="mt-2 w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm outline-none focus:border-acc"
          />
        </div>
      ) : (
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Code-barres..."
          autoFocus
          className="mb-3 w-full rounded-lg border border-bdr bg-surf px-3 py-2.5 text-sm outline-none focus:border-acc"
        />
      )}

      {message && (
        <div
          className={`mb-3 rounded-lg border p-2.5 text-xs ${
            message.type === "ok"
              ? "border-ok/30 bg-ok/5 text-ok"
              : "border-dngr/30 bg-dngr/5 text-dngr"
          }`}
        >
          {message.text}
        </div>
      )}

      {produitTrouve && (
        <div className="rounded-lg border border-bdr bg-surf p-3.5">
          <strong className="text-sm text-txt">{produitTrouve.produit}</strong>
          <p className="mt-1 text-xs text-sub">
            Stock actuel :{" "}
            <span className="font-mono font-semibold tabular text-txt">
              {produitTrouve.quantite} {produitTrouve.unite}
            </span>
          </p>
          <label className="mb-1 mt-3 block text-xs font-medium text-sub">
            Quantité à retirer
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(1, produitTrouve.quantite)}
            value={qteRetrait}
            onChange={(e) => setQteRetrait(Number(e.target.value) || 1)}
            className="mb-3 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
          />
          <button
            onClick={handleConfirmerRetrait}
            className="w-full rounded-lg bg-acc py-2.5 text-sm font-bold text-ink"
          >
            Confirmer le retrait — {qteRetrait} {produitTrouve.unite}
          </button>
        </div>
      )}

      {!produitTrouve && produitsPourAssociation.length > 0 && (
        <div className="rounded-lg border border-bdr bg-surf p-3.5">
          <strong className="text-sm text-txt">Code inconnu : {codeActif}</strong>
          <p className="mt-1 text-xs text-sub">
            Associe ce code à un produit pour les prochains scans
          </p>
          <select
            value={choixAssociation}
            onChange={(e) => setChoixAssociation(e.target.value)}
            className="my-3 w-full rounded-lg border border-bdr bg-bg px-3 py-2 text-sm outline-none focus:border-acc"
          >
            {produitsPourAssociation.map((nom) => (
              <option key={nom} value={nom}>
                {nom}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssocier}
            className="w-full rounded-lg bg-acc py-2.5 text-sm font-bold text-ink"
          >
            Enregistrer l&apos;association
          </button>
        </div>
      )}
    </div>
  );
}
