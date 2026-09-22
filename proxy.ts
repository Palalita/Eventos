import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";

const authRoutes = ["/login", "/registro", "/crear-cuenta"];

// "/" es pública (landing de la empresa); "/panel" es el sitio de un
// evento/organización puntual y sí requiere sesión — ver app/page.tsx vs.
// app/panel/page.tsx. "/master" es el login de la empresa (no enlazado
// desde ningún lado); "/master/panel" y el resto de "/master/*" exigen esa
// sesión.
export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPanelRoute = path === "/panel" || path.startsWith("/panel/");
  const isAuthRoute = authRoutes.some((r) => path.startsWith(r));
  const isAdminOnlyRoute = path === "/admin" || path.startsWith("/admin/");
  const isMasterLoginRoute = path === "/master";
  const isMasterOnlyRoute = path.startsWith("/master/");

  const cookie = req.cookies.get("session")?.value;
  let session = await decrypt(cookie);
  const needsSessionCheck =
    isPanelRoute || isAdminOnlyRoute || isAuthRoute || isMasterLoginRoute || isMasterOnlyRoute;

  // Cookies firmadas antes de multi-tenant no tienen organizationId en su
  // payload (la clave ni existe, a diferencia de un MASTER real, que sí la
  // tiene puesta en null a propósito). Sin este chequeo, esa sesión vieja
  // pasaba el resto de los chequeos de acá abajo con organizationId
  // undefined, y requireOrgSession() (lib/dal.ts) la trataba como si fuera
  // un MASTER y la mandaba a /master — una ruta que además no requiere
  // login, resultando en un 404 en vez de pedir volver a loguearse. Solo se
  // chequea en rutas que de verdad necesitan sesión, igual que el chequeo
  // de "la cuenta sigue existiendo" de más abajo.
  if (needsSessionCheck && session && !("organizationId" in session)) {
    session = null;
    const response = NextResponse.redirect(new URL("/login", req.nextUrl));
    response.cookies.delete("session");
    return response;
  }

  // La cuenta pudo haber sido eliminada después de emitirse la cookie de sesión.
  if (needsSessionCheck && session?.userId) {
    try {
      const exists = await db.user.findUnique({
        where: { id: session.userId },
        select: { id: true },
      });
      if (!exists) {
        session = null;
        const response = NextResponse.redirect(new URL("/login", req.nextUrl));
        response.cookies.delete("session");
        return response;
      }
    } catch (error) {
      // Si la BD no responde, no bloqueamos el sitio entero: seguimos con la
      // sesión tal como venía y dejamos que la página maneje el error.
      console.error("proxy: fallo al verificar la sesión contra la BD", error);
    }
  }

  if ((isPanelRoute || isAdminOnlyRoute) && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAdminOnlyRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  // MASTER nunca tiene organización: si de algún modo llega a /panel, no
  // hay nada que mostrarle ahí (ver requireOrgSession en lib/dal.ts).
  if (isPanelRoute && session?.role === "MASTER") {
    return NextResponse.redirect(new URL("/master", req.nextUrl));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  if (isMasterOnlyRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/master", req.nextUrl));
  }

  if (isMasterOnlyRoute && session?.role !== "MASTER") {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  if (isMasterLoginRoute && session?.role === "MASTER") {
    return NextResponse.redirect(new URL("/master/panel", req.nextUrl));
  }

  // Ya logueado pero como ADMIN/GUEST, no MASTER: no tiene sentido
  // mostrarle el formulario de login de la empresa.
  if (isMasterLoginRoute && session?.userId && session.role !== "MASTER") {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
