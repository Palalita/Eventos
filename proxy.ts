import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { db } from "@/lib/db";

const authRoutes = ["/login", "/registro"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isHome = path === "/";
  const isAuthRoute = authRoutes.some((r) => path.startsWith(r));
  const isAdminOnlyRoute = path === "/admin" || path.startsWith("/admin/");

  const cookie = req.cookies.get("session")?.value;
  let session = await decrypt(cookie);
  const needsSessionCheck = isHome || isAdminOnlyRoute || isAuthRoute;

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

  if ((isHome || isAdminOnlyRoute) && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAdminOnlyRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
