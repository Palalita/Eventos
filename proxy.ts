import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const guestRoutes = ["/panel"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/registro"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isGuestRoute = guestRoutes.some((r) => path.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => path.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => path.startsWith(r));

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if ((isGuestRoute || isAdminRoute) && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isAdminRoute && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/panel", req.nextUrl));
  }

  if (isGuestRoute && session?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(
      new URL(session.role === "ADMIN" ? "/admin" : "/panel", req.nextUrl)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
