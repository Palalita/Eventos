// Server Action para que el admin borre a un invitado desde
// app/admin/invitados/page.tsx. Borrar el User le impide volver a entrar
// (su sesión ya no resuelve a nada y no puede loguear de nuevo sin una
// invitación nueva) y se lleva en cascada sus PhotoRequest/TrustedDevice/
// DeviceVerification — mismo comportamiento que deleteOrganizationAdmin en
// app/actions/master.ts, pero acá lo dispara el propio admin de la
// organización, no un MASTER. También borra la Invitation que usó para
// registrarse (no hay FK entre ambas tablas — se relacionan solo por
// organizationId+email — así que Prisma no la borra en cascada sola), para
// que no quede un rastro "Usado" en /admin/invitaciones de alguien que el
// admin ya sacó del sitio.
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";

export async function deleteGuest(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  // findFirst (no delete directo) porque filtra por organizationId y role:
  // GUEST antes de borrar nada — sin este chequeo, un admin podría borrar
  // cuentas de otra organización, o a sí mismo/otro admin, con solo
  // adivinar un id. Se necesita además el correo para poder borrar la
  // Invitation correspondiente.
  const guest = await db.user.findFirst({
    where: { id, organizationId: session.organizationId, role: "GUEST" },
    select: { id: true, email: true },
  });
  if (!guest) return;

  await db.user.delete({ where: { id: guest.id } });
  // organizationId+email es único (ver prisma/schema.prisma#Invitation), así
  // que esto borra como mucho una fila: la invitación que este invitado usó.
  await db.invitation.deleteMany({
    where: { organizationId: session.organizationId, email: guest.email },
  });

  revalidatePath("/admin/invitados");
  revalidatePath("/admin/invitaciones");
}
