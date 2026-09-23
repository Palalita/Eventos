// Server Action de /crear-cuenta: un cliente nuevo da de alta su propio
// evento (Organization) y queda como su admin. La usa
// app/crear-cuenta/CreateOrgForm.tsx vía useActionState.
"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { provisionOrganization } from "@/lib/organizations";
import { isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { isValidFont, DEFAULT_FONT } from "@/lib/fonts";
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
    theme: formData.get("theme"),
    font: formData.get("font"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { eventName, name, email, password } = validatedFields.data;
  // Los pickers mandan radios con name="theme"/"font"; si por algo
  // llegara vacío o con un id que ya no existe (una opción que se sacó
  // del registro), se cae al default en vez de guardar basura en la BD.
  const theme = isValidTheme(validatedFields.data.theme)
    ? validatedFields.data.theme
    : DEFAULT_THEME;
  const font = isValidFont(validatedFields.data.font)
    ? validatedFields.data.font
    : DEFAULT_FONT;

  // No hace falta chequear "ya existe una cuenta con este correo": el
  // correo es único por organización, no en toda la plataforma (ver
  // prisma/schema.prisma#User), y la organización que se crea acá abajo es
  // siempre nueva (id recién generado) — no puede colisionar con ninguna
  // cuenta existente de este correo en OTRO evento, y eso es intencional:
  // la misma persona puede administrar más de un evento con el mismo
  // correo.

  // Independientes entre sí (uno no depende del resultado del otro): se
  // corren en paralelo en vez de uno tras otro.
  const [passwordHash, organization] = await Promise.all([
    bcrypt.hash(password, 10),
    provisionOrganization({ eventName, theme, font }),
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
