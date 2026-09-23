// Página pública de registro (crear cuenta con el código de invitación). El
// formulario real vive en ./SignupForm.tsx (componente de cliente).
import Link from "next/link";
import { db } from "@/lib/db";
import { getEventSettings } from "@/lib/settings";
import { isValidTheme } from "@/lib/themes";
import { isValidFont } from "@/lib/fonts";
import { COMPANY_NAME } from "@/lib/company";
import SignupForm from "./SignupForm";

export default async function RegistroPage({
  searchParams,
}: PageProps<"/registro">) {
  // Si el invitado llegó desde el link del correo (/registro?code=XXXX), se
  // precarga el código para que no tenga que copiarlo/pegarlo a mano — y,
  // como el código ya identifica a qué organización pertenece, también se
  // usa para pintar la página con el tema/tipografía que eligió ESE
  // administrador (y mostrar el lema real del evento) en vez de la
  // identidad genérica de la plataforma (acá, a diferencia de /login sin
  // JS, sí hay forma de saber la organización antes de iniciar sesión: el
  // código viene en la URL, no depende del dispositivo).
  const { code } = await searchParams;
  const invitation =
    typeof code === "string" && code
      ? await db.invitation.findUnique({ where: { code: code.toUpperCase() } })
      : null;

  let lema: string | null = null;
  let themeClassNames = "";
  if (invitation) {
    const [settings, organization] = await Promise.all([
      getEventSettings(invitation.organizationId),
      db.organization.findUnique({
        where: { id: invitation.organizationId },
        select: { theme: true, font: true },
      }),
    ]);
    lema = settings.lema || null;
    if (organization) {
      const themeClassName = isValidTheme(organization.theme) ? `theme-${organization.theme}` : "";
      const fontClassName = isValidFont(organization.font) ? `font-${organization.font}` : "";
      themeClassNames = `${themeClassName} ${fontClassName}`.trim();
    }
  }

  return (
    <main className={`auth-page ${themeClassNames}`.trim()}>
      <div className="auth-card">
        <div className="auth-back-row">
          <Link href="/" className="auth-back-link">
            ← Volver
          </Link>
        </div>
        {/* Con invitación resuelta se muestra el lema real del evento (marca
            del cliente, por eso la cursiva); sin ella, es genérico de la
            plataforma. */}
        {lema ? (
          <p className="invite-eyebrow">{lema}</p>
        ) : (
          <p className="platform-eyebrow">{COMPANY_NAME}</p>
        )}
        <h1>Crear mi invitación</h1>
        <p className="auth-subtitle">
          Necesitas el código de invitación que te enviamos por correo para
          crear tu cuenta y poder subir fotos del evento.
        </p>
        <SignupForm defaultCode={typeof code === "string" ? code : ""} />
      </div>
    </main>
  );
}
