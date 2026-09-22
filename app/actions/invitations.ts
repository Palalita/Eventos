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
  const session = await requireAdmin(); // corta acá si no sos admin logueado

  const emails = parseEmails((formData.get("emails") as string | null) ?? "");
  if (emails.length === 0) {
    return { created: 0, skipped: [], failedToSend: [] };
  }

  const settings = await getEventSettings(session.organizationId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const skipped: string[] = [];
  const failedToSend: string[] = [];
  let created = 0;

  // Uno por uno (no en paralelo) para no pisarse entre sí al chequear
  // "existing" antes de crear — con pocos correos por tanda el costo es
  // insignificante.
  for (const email of emails) {
    // El correo ya no es único a nivel de toda la plataforma (otro cliente
    // puede haber invitado a la misma persona), solo dentro de esta
    // organización.
    const existing = await db.invitation.findUnique({
      where: { organizationId_email: { organizationId: session.organizationId, email } },
    });
    if (existing) {
      skipped.push(email);
      continue;
    }

    const code = generateInvitationCode();
    await db.invitation.create({
      data: { email, code, organizationId: session.organizationId },
    });
    created++;

    try {
      await sendInvitationEmail(
        email,
        code,
        settings.tituloEvento,
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
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  // findFirst con organizationId: sin este filtro, un admin podría reenviar
  // (y por lo tanto ver el correo/código de) una invitación de OTRA
  // organización con solo adivinar/probar un id.
  const invitation = await db.invitation.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!invitation || invitation.status !== "PENDING") return;

  const settings = await getEventSettings(session.organizationId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  await sendInvitationEmail(
    invitation.email,
    invitation.code,
    settings.tituloEvento,
    `${baseUrl}/registro?code=${invitation.code}`
  );

  revalidatePath("/admin/invitaciones");
}

export async function revokeInvitation(formData: FormData) {
  const session = await requireAdmin();
  const id = formData.get("id") as string;

  // deleteMany (no delete) porque además filtra por status: PENDING (nunca
  // se puede borrar una invitación ya usada) y por organizationId (un admin
  // no puede revocar invitaciones de otra organización).
  await db.invitation.deleteMany({
    where: { id, status: "PENDING", organizationId: session.organizationId },
  });
  revalidatePath("/admin/invitaciones");
}
