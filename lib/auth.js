// Web Crypto (crypto.subtle) plutôt que le module Node "crypto" : ça marche
// aussi bien dans les Route Handlers (Node) que dans le middleware (Edge),
// sans dépendance supplémentaire.

const encoder = new TextEncoder();

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return bufToHex(buf);
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bufToHex(sig);
}

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const COOKIE_SECRET = process.env.COOKIE_SECRET || "dev-secret-a-remplacer-en-prod";
const EMPLOYE_PASSWORD = process.env.EMPLOYE_PASSWORD || "smash2024";
const PATRON_PASSWORD = process.env.PATRON_PASSWORD || "patron2024";

export const COOKIE_NAME = "maiga_session";
export const COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 jours en secondes

export async function verifierMdp(mdpSaisi, role) {
  if (role === "employe") return mdpSaisi === EMPLOYE_PASSWORD;
  if (role === "patron") return mdpSaisi === PATRON_PASSWORD;
  return false;
}

export async function makeToken(role) {
  const exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const payload = `${role}|${exp}`;
  const sig = await hmacHex(COOKIE_SECRET, payload);
  return `${payload}|${sig}`;
}

export async function readToken(token) {
  if (!token) return null;
  const parts = token.split("|");
  if (parts.length !== 3) return null;
  const [role, expStr, sig] = parts;

  const expected = await hmacHex(COOKIE_SECRET, `${role}|${expStr}`);
  if (!timingSafeEqualHex(sig, expected)) return null;

  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  if (role !== "employe" && role !== "patron") return null;

  return role;
}
