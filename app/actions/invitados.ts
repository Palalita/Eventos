// Server Action para que el admin borre a un invitado desde
// app/admin/invitados/page.tsx. Borrar el User le impide volver a entrar
// (su sesión ya no resuelve a nada y no puede loguear de nuevo sin una
// invitación nueva) y se lleva en cascada sus PhotoRequest/TrustedDevice/
// DeviceVerification — mismo comportamiento que deleteOrganizationAdmin en
// app/actions/master.ts, pero acá lo dispara el propio admin de la
// organización, no un MASTER.
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";

export async function deleteGuest(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  // deleteMany (no delete) porque filtra por organizationId y role: GUEST —
  // sin esto, un admin podría borrar cuentas de otra organización, o a sí
  // mismo/otro admin, con solo adivinar un id.
  await db.user.deleteMany({
    where: { id, organizationId: session.organizationId, role: "GUEST" },
  });

  revalidatePath("/admin/invitados");
}
