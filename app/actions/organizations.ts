// Server Action de /crear-cuenta: un cliente nuevo da de alta su propio
// evento (Organization) y queda como su admin. La usa
// app/crear-cuenta/CreateOrgForm.tsx vía useActionState.
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { provisionOrganization } from "@/lib/organizations";
import {
  CreateOrganizationFormSchema,
  CreateOrganizationFormState,
} from "@/lib/definitions";

export async function createOrganization(
  _state: CreateOrganizationFormState,
  formData: FormData
): Promise<CreateOrganizationFormState> {
  const validatedFields = CreateOrganizationFormSchema.safeParse({
    eventName: formData.get("eventName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { eventName, name, email, password } = validatedFields.data;

  // User.email sigue siendo único a nivel de toda la plataforma (una
  // persona = una identidad, aunque después administre o sea invitada a
  // varios eventos distintos — ver prisma/schema.prisma).
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "Ya existe una cuenta con ese correo." };
  }

  // Independientes entre sí (uno no depende del resultado del otro): se
  // corren en paralelo en vez de uno tras otro.
  const [passwordHash, organization] = await Promise.all([
    bcrypt.hash(password, 10),
    provisionOrganization({ eventName }),
  ]);

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  // A diferencia del login normal, acá no se pide verificación de
  // dispositivo: es la primera vez que existe esta cuenta, no tiene sentido
  // "confirmar un dispositivo confiable" antes de haber iniciado sesión ni
  // una vez.
  await createSession({ userId: user.id, role: user.role, organizationId: user.organizationId });
  redirect("/panel");
}
