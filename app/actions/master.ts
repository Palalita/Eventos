// Server Actions de /master: login separado del público (ver
// app/actions/auth.ts#login, que explícitamente RECHAZA a los MASTER) y
// borrar el admin+invitados de una organización desde el panel.
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { requireMaster } from "@/lib/dal";
import { LoginFormSchema, LoginFormState } from "@/lib/definitions";

// Casi idéntico a login() en auth.ts, pero al revés: acá SOLO puede entrar
// un MASTER. Un ADMIN/GUEST con contraseña correcta que pruebe este
// formulario recibe el mismo mensaje genérico que una contraseña
// incorrecta — no hace falta que sepan que esta cuenta no aplica acá.
export async function masterLogin(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Correo o contraseña incorrectos." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch || user.role !== "MASTER") {
    return { message: "Correo o contraseña incorrectos." };
  }

  await createSession({ userId: user.id, role: user.role, organizationId: null });
  redirect("/master/panel");
}

// Borra al admin de una organización y, con él, a todos los invitados que
// entraron con sus códigos (todo GUEST de la misma organización — acá no
// hay más de un admin por organización, así que "invitado por este admin"
// es lo mismo que "invitado de esta organización"). Pensado para cuando
// termina el plazo contratado por un cliente y hay que limpiar sus
// cuentas. No borra la Organization en sí (nombre, tema, configuración
// del evento, invitaciones ya generadas) — solo las cuentas de usuario.
// Ojo: cada User borrado se lleva en cascada (por la FK) sus propias
// PhotoRequest/TrustedDevice/DeviceVerification, así que las fotos que
// esos usuarios subieron sí se pierden.
export async function deleteOrganizationAdmin(formData: FormData) {
  await requireMaster();
  const organizationId = formData.get("organizationId") as string;

  const admin = await db.user.findFirst({
    where: { organizationId, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) return;

  await db.user.deleteMany({ where: { organizationId, role: "GUEST" } });
  await db.user.delete({ where: { id: admin.id } });

  revalidatePath("/master/panel");
}
