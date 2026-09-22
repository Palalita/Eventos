// Página pública de registro (crear cuenta con el código de invitación). El
// formulario real vive en ./SignupForm.tsx (componente de cliente).
import Link from "next/link";
import { db } from "@/lib/db";
import { getEventSettings } from "@/lib/settings";
import { COMPANY_NAME } from "@/lib/company";
import SignupForm from "./SignupForm";

export default async function RegistroPage({
  searchParams,
}: PageProps<"/registro">) {
  // Si el invitado llegó desde el link del correo (/registro?code=XXXX), se
  // precarga el código para que no tenga que copiarlo/pegarlo a mano — y,
  // como el código ya identifica a qué organización pertenece, también se
  // usa para mostrar el lema de ESE evento en vez de un texto genérico
  // (acá, a diferencia de /login, si hay forma de saber la organización
  // antes de iniciar sesión).
  const { code } = await searchParams;
  const invitation =
    typeof code === "string" && code
      ? await db.invitation.findUnique({ where: { code: code.toUpperCase() } })
      : null;
  const lema = invitation ? (await getEventSettings(invitation.organizationId)).lema : null;

  return (
    <main className="auth-page">
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
