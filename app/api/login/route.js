import { NextResponse } from "next/server";
import { verifierMdp, makeToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

export async function POST(request) {
  const { role, password, rester } = await request.json();

  if (role !== "employe" && role !== "patron") {
    return NextResponse.json({ ok: false, error: "Rôle invalide" }, { status: 400 });
  }

  const valide = await verifierMdp(password || "", role);
  if (!valide) {
    return NextResponse.json(
      { ok: false, error: "Mot de passe incorrect" },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, role });
  const token = await makeToken(role);

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Si "rester connecté" n'est pas coché, on pose un cookie de session
    // (pas de maxAge -> supprimé à la fermeture du navigateur).
    ...(rester ? { maxAge: COOKIE_MAX_AGE } : {}),
  });

  return response;
}
