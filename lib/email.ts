// Todos los correos que manda el sitio, usando Resend. Dos flujos lo llaman:
// - `app/actions/auth.ts` (login desde un dispositivo nuevo) llama a
//   sendDeviceVerificationEmail() con el link a /verificar-dispositivo.
// - `app/actions/invitations.ts` (el admin invita a alguien) llama a
//   sendInvitationEmail() con el código para registrarse.
import "server-only";
import { Resend } from "resend";

// Paleta y tipografías del sitio (ver app/globals.css :root). Los clientes
// de correo no cargan Google Fonts ni @import, así que se usan equivalentes
// "web-safe" (Georgia como serif, system-ui como sans) en vez de las fuentes
// reales — el layout de tabla es a propósito, es lo único que Outlook
// desktop renderiza de forma predecible.
const ROSE = "#d86c7d";
const ROSE_DARK = "#8d2536";
const ROSE_LIGHT = "#f5cbd5";
const GOLD = "#bda672";
const CREAM = "#fff8f5";
const TEXT = "#212529";

// `heading`, `ctaUrl` y `footerNote` son texto plano, no HTML (a diferencia
// de `bodyHtml`/`extraBlockHtml`, que el llamador arma a mano como HTML de
// confianza) — así que acá adentro sí hay que escaparlos. Hoy el único dato
// dinámico que llega es quinceaneraNombre (texto libre que el admin edita
// en /admin/contenido), pero sin este escape cualquier `<`, `>`, `&` o `"`
// que contenga rompería el layout de la tabla o el atributo href.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailLayout({
  heading,
  bodyHtml,
  extraBlockHtml,
  ctaLabel,
  ctaUrl,
  footerNote,
}: {
  heading: string;
  bodyHtml: string;
  // Contenido que necesita su propia fila de tabla (p. ej. el código de
  // invitación): puesto directamente en `bodyHtml` como un <div
  // inline-block> quedaba flotando al lado de la última línea de texto en
  // vez de en su propia línea, y esa mezcla con texto corrido es lo que
  // hacía que Gmail achicara la letra para que "entrara" en el renglón.
  extraBlockHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote: string;
}) {
  const extraBlock = extraBlockHtml
    ? `
        <tr>
          <td align="center" style="padding: 18px 0 4px;">
            ${extraBlockHtml}
          </td>
        </tr>
      `
    : "";

  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : "";
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td align="center" style="padding: 8px 0 4px;">
            <a href="${safeCtaUrl}" style="display:inline-block; background:${ROSE}; color:#ffffff; font-family:Georgia,'Times New Roman',serif; font-size:16px; font-weight:bold; text-decoration:none; padding:12px 32px; border-radius:999px;">
              ${escapeHtml(ctaLabel)}
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 24px 0; font-family: system-ui, -apple-system, sans-serif; font-size:12px; color:${TEXT}; opacity:0.65; word-break:break-all;">
            O copiá y pegá este enlace en tu navegador:<br />
            <a href="${safeCtaUrl}" style="color:${ROSE_DARK};">${safeCtaUrl}</a>
          </td>
        </tr>
      `
      : "";

  return `
    <div style="background:${CREAM}; padding:32px 16px; font-family: system-ui, -apple-system, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; margin:0 auto;">
        <tr>
          <td align="center" style="padding-bottom:20px;">
            <span style="font-family: Georgia, 'Times New Roman', serif; font-style:italic; color:${GOLD}; font-size:15px; letter-spacing:0.5px;">
              Mis XV años
            </span>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff; border:1px solid ${ROSE_LIGHT}; border-radius:20px; padding:32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:18px;">
                  <div style="display:inline-block; width:40px; height:3px; background:${GOLD}; border-radius:999px;"></div>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family: Georgia, 'Times New Roman', serif; color:${ROSE_DARK}; font-size:24px; font-weight:bold; padding-bottom:14px;">
                  ${escapeHtml(heading)}
                </td>
              </tr>
              <tr>
                <td style="font-family: system-ui, -apple-system, sans-serif; color:${TEXT}; font-size:15px; line-height:1.6; text-align:center;">
                  ${bodyHtml}
                </td>
              </tr>
              ${extraBlock}
              ${ctaBlock}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px; font-family: system-ui, -apple-system, sans-serif; font-size:12px; color:${TEXT}; opacity:0.55;">
            ${escapeHtml(footerNote)}
          </td>
        </tr>
      </table>
    </div>
  `;
}

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
  const { error } = await resend.emails.send({
    from: "Mis XV años <onboarding@resend.dev>",
    to,
    subject: "Verificación de dispositivo requerida",
    html: renderEmailLayout({
      heading: "Verificación de dispositivo",
      bodyHtml: `
        Se detectó un inicio de sesión en el panel de administración desde un dispositivo
        no reconocido. Si fue usted, confírmelo a continuación. Si no, ignore este mensaje.
      `,
      ctaLabel: "Confirmar identidad e iniciar sesión",
      ctaUrl: verifyUrl,
      footerNote: "Por motivos de seguridad, este enlace expirará en 15 minutos.",
    }),
  });
  // Resend no lanza excepción si el envío es rechazado (p. ej. el dominio
  // de prueba onboarding@resend.dev solo puede mandar al correo dueño de la
  // cuenta): sin este log, el fallo queda invisible y el admin nunca recibe
  // el enlace ni ve un error.
  if (error) {
    console.error(`[email] Resend rechazó el correo de verificación para ${to}:`, error);
  }
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

  // quinceaneraNombre es texto libre editable por el admin en
  // /admin/contenido: se escapa acá antes de meterlo en bodyHtml porque
  // bodyHtml se trata como HTML de confianza (no pasa por escapeHtml en
  // renderEmailLayout, a diferencia de heading/footerNote/ctaUrl).
  const safeName = escapeHtml(quinceaneraNombre);
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Mis XV años <onboarding@resend.dev>",
    to,
    subject: `¡Estás invitado a mis XV años, ${quinceaneraNombre}!`,
    html: renderEmailLayout({
      heading: `¡Estás invitado${quinceaneraNombre ? `, celebrá con ${quinceaneraNombre}` : ""}!`,
      bodyHtml: `
        Fuiste invitado a celebrar los XV años de ${safeName}. Con tu código
        vas a poder registrarte, ver las fotos del evento y subir las tuyas.
      `,
      // Tabla en vez de un div "inline-block" metido en el párrafo: así el
      // código queda en su propio renglón centrado (no flotando al lado de
      // "subir las tuyas") y el tamaño de letra no varía entre clientes de
      // correo, que es justo lo que pasaba antes.
      //
      // Fuente monoespaciada a propósito (no Georgia): Georgia dibuja los
      // números con altura "old-style" (más chicos y desalineados respecto
      // a las mayúsculas), así que "AB12CD" se veía con números más chicos
      // que las letras. Una monoespaciada garantiza el mismo tamaño para
      // todos los caracteres en cualquier cliente de correo.
      extraBlockHtml: `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto; background:${ROSE_LIGHT}; border:1px solid ${ROSE}; border-radius:12px;">
          <tr>
            <td style="padding:12px 28px; font-family:'Courier New', Courier, monospace; font-size:28px; line-height:28px; font-weight:bold; letter-spacing:6px; color:${ROSE_DARK}; white-space:nowrap; -webkit-text-size-adjust:100%; text-size-adjust:100%; mso-line-height-rule:exactly;">
              ${escapeHtml(code)}
            </td>
          </tr>
        </table>
      `,
      ctaLabel: "Crear mi cuenta",
      ctaUrl: registroUrl,
      footerNote: "Usá el código de arriba al registrarte con este mismo correo.",
    }),
  });
  if (error) {
    console.error(`[email] Resend rechazó la invitación para ${to}:`, error);
  }
}
