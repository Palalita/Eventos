import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// proxy.ts limpia la cookie cuando la cuenta ya no existe (ahí sí se pueden
// mutar cookies). Aquí solo podemos redirigir, así que revalidamos la
// existencia de todos modos: cierra el hueco donde una cuenta borrada podría
// seguir ejecutando Server Actions con una sesión firmada que aún no expiró.
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const exists = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });
  if (!exists) {
    redirect("/login");
  }

  return session;
});

export async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
