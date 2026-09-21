// Todos los correos que manda el sitio, usando Resend. Dos flujos lo llaman:
// - `app/actions/auth.ts` (login desde un dispositivo nuevo) llama a
//   sendDeviceVerificationEmail() con el link a /verificar-dispositivo.
// - `app/actions/invitations.ts` (el admin invita a alguien) llama a
//   sendInvitationEmail() con el código para registrarse.
import "server-only";
import { Resend } from "resend";

// Sin RESEND_API_KEY configurada, no bloqueamos el flujo: dejamos el enlace
// en el log del servidor para poder seguir probando en desarrollo.
export async function sendDeviceVerificationEmail(to: string, verifyUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY no configurada. Enlace de verificación para ${to}: ${verifyUrl}`
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "Mis XV años <onboarding@resend.dev>",
    to,
    subject: "Confirma este dispositivo para iniciar sesión",
    html: `
      <p>Detectamos un inicio de sesión de administrador desde un dispositivo que no reconocemos.</p>
      <p><a href="${verifyUrl}">Confirmar que soy yo e iniciar sesión</a></p>
      <p>Este enlace expira en 15 minutos. Si no fuiste tú, ignora este correo.</p>
    `,
  });
}

// Sin RESEND_API_KEY, o si el envío falla (p. ej. el plan de prueba de
// Resend solo permite mandar a la dirección del propio dueño de la cuenta),
// no bloqueamos la creación de la invitación: el código queda visible en el
// panel de admin para compartirlo a mano.
export async function sendInvitationEmail(
  to: string,
  code: string,
  quinceaneraNombre: string,
  registroUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY no configurada. Código de invitación para ${to}: ${code} (${registroUrl})`
    );
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "Mis XV años <onboarding@resend.dev>",
    to,
    subject: `¡Estás invitado a mis XV años, ${quinceaneraNombre}!`,
    html: `
      <p>¡Felicidades! Fuiste invitado a celebrar los XV años de ${quinceaneraNombre}.</p>
      <p>Tu código de invitación es:</p>
      <p style="font-size:28px; font-weight:bold; letter-spacing:4px;">${code}</p>
      <p>Ingresa a <a href="${registroUrl}">${registroUrl}</a> y usa este código para crear tu cuenta, ver las fotos del evento y subir las tuyas.</p>
    `,
  });
}
