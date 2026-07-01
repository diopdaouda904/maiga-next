import { NextResponse } from "next/server";
import { COOKIE_NAME, readToken } from "@/lib/auth";

// Routes accessibles sans être connecté
const PUBLIC_PATHS = ["/login", "/api/login"];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const role = await readToken(token);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Protège /admin et /produits : réservés au rôle patron
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/produits")) &&
    role !== "patron"
  ) {
    return NextResponse.redirect(new URL("/stock", request.url));
  }

  // Rend le rôle disponible aux pages (Server Components) via un header de
  // requête — c'est le seul moyen fiable de faire passer une info du
  // middleware jusqu'à `headers()` côté serveur.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-role", role);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    /*
     * Applique le middleware à tout sauf :
     * - fichiers statiques Next (_next/static, _next/image)
     * - favicon
     * - dossier /public (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
