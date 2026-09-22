// "Data Access Layer": las dos funciones que usan las páginas para
// protegerse. Son la puerta de entrada — cualquier página que empiece
// llamando a verifySession() o requireAdmin() garantiza que, si el código
// sigue ejecutándose después, hay un usuario real logueado (y admin, en el
// segundo caso). Las usan `app/page.tsx` (verifySession) y todas las páginas
// bajo `app/admin/*` (requireAdmin).
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// proxy.ts limpia la cookie cuando la cuenta ya no existe (ahí sí se pueden
// mutar cookies). Aquí solo podemos redirigir, así que revalidamos la
// existencia de todos modos: cierra el hueco donde una cuenta borrada podría
// seguir ejecutando Server Actions con una sesión firmada que aún no expiró.
//
// `cache()` (de React) memoiza el resultado durante el mismo request: si
// varias partes de una página llaman a verifySession(), la consulta a la
// BD se hace una sola vez.
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

// Igual que verifySession(), pero además exige rol ADMIN; si un GUEST
// intenta entrar a una página de admin, lo manda de vuelta al inicio.
export async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  // Invariante garantizada por el CHECK constraint de la BD (ver migración
  // add_organizations): un ADMIN siempre tiene organizationId. Lo repetimos
  // acá para que TypeScript angoste el tipo a `string` (no `string | null`)
  // y el resto del código de admin no tenga que chequearlo de nuevo.
  return { ...session, organizationId: session.organizationId! };
}

// Para páginas de invitado/admin que necesitan sesión + organización (todo
// menos las rutas de MASTER). Igual que requireAdmin pero sin exigir rol.
export async function requireOrgSession() {
  const session = await verifySession();
  if (!session.organizationId) {
    redirect("/master");
  }
  return { ...session, organizationId: session.organizationId! };
}

// Solo para /master: exige rol MASTER (que nunca tiene organización). Un
// ADMIN/GUEST que intente entrar se manda al dashboard normal, no a
// /master, para no insinuar que esa ruta existe.
// TODO: cuando el dashboard se mude a /panel (paso 3 del plan), actualizar
// este redirect.
export async function requireMaster() {
  const session = await verifySession();
  if (session.role !== "MASTER") {
    redirect("/");
  }
  return session;
}
