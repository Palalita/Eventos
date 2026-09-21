// Server Actions para que el admin invite gente por correo. Las usa
// `app/admin/invitaciones/InvitationsForm.tsx` (sendInvitations) y los
// botones de `app/admin/invitaciones/page.tsx` (resendInvitation,
// revokeInvitation). El código que se genera acá es el que el invitado
// después escribe en app/registro/SignupForm.tsx, y signup() (en
// app/actions/auth.ts) lo valida contra la tabla Invitation.
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getEventSettings } from "@/lib/settings";
import { generateInvitationCode } from "@/lib/invitation-code";
import { sendInvitationEmail } from "@/lib/email";

// Lo que InvitationsForm.tsx recibe de vuelta para mostrar un resumen:
// cuántas se crearon, cuáles ya existían y a cuáles no se les pudo mandar
// el correo (pero sí quedaron creadas, con el código visible en la tabla).
export type SendInvitationsState =
  | {
      created: number;
      skipped: string[];
      failedToSend: string[];
    }
  | undefined;

// El admin pega una lista de correos separados por coma, `;` o salto de
// línea; esto la limpia, quita espacios/mayúsculas, descarta lo que no
// parece un correo, y elimina duplicados (con Set).
function parseEmails(raw: string) {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ),
  ];
}

export async function sendInvitations(
  _state: SendInvitationsState,
  formData: FormData
): Promise<SendInvitationsState> {
  await requireAdmin(); // corta acá si no sos admin logueado

  const emails = parseEmails((formData.get("emails") as string | null) ?? "");
  if (emails.length === 0) {
    return { created: 0, skipped: [], failedToSend: [] };
  }

  const settings = await getEventSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const skipped: string[] = [];
  const failedToSend: string[] = [];
  let created = 0;

  // Uno por uno (no en paralelo) para no pisarse entre sí al chequear
  // "existing" antes de crear — con pocos correos por tanda el costo es
  // insignificante.
  for (const email of emails) {
    const existing = await db.invitation.findUnique({ where: { email } });
    if (existing) {
      skipped.push(email);
      continue;
    }

    const code = generateInvitationCode();
    await db.invitation.create({ data: { email, code } });
    created++;

    try {
      await sendInvitationEmail(
        email,
        code,
        settings.quinceaneraNombre,
        `${baseUrl}/registro?code=${code}`
      );
    } catch {
      // La invitación queda creada igual aunque falle el envío del correo
      // (p. ej. límites de la cuenta de prueba de Resend); el admin puede
      // copiar el código a mano desde la tabla.
      failedToSend.push(email);
    }
  }

  // Le dice a Next que la página /admin/invitaciones tiene que volver a
  // buscar datos frescos en el próximo render (si no, mostraría la lista
  // vieja cacheada).
  revalidatePath("/admin/invitaciones");
  return { created, skipped, failedToSend };
}

export async function resendInvitation(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  const invitation = await db.invitation.findUnique({ where: { id } });
  if (!invitation || invitation.status !== "PENDING") return;

  const settings = await getEventSettings();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  await sendInvitationEmail(
    invitation.email,
    invitation.code,
    settings.quinceaneraNombre,
    `${baseUrl}/registro?code=${invitation.code}`
  );

  revalidatePath("/admin/invitaciones");
}

export async function revokeInvitation(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;

  // deleteMany (no delete) porque además filtra por status: PENDING, así
  // nunca se puede borrar una invitación que ya se usó para crear una cuenta.
  await db.invitation.deleteMany({ where: { id, status: "PENDING" } });
  revalidatePath("/admin/invitaciones");
}
