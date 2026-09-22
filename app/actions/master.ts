// Server Actions de /master: login separado del público (ver
// app/actions/auth.ts#login, que explícitamente RECHAZA a los MASTER) y
// activar/suspender organizaciones desde el panel.
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

// El admin de una organización puede suspenderla (deja de poder loguear
// nadie de esa organización) o reactivarla. No borra nada — es reversible.
export async function toggleOrganizationStatus(formData: FormData) {
  await requireMaster();
  const id = formData.get("id") as string;

  const organization = await db.organization.findUnique({ where: { id } });
  if (!organization) return;

  await db.organization.update({
    where: { id },
    data: { status: organization.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" },
  });

  revalidatePath("/master/panel");
}
