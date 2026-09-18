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
