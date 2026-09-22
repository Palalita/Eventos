// Página pública de registro (crear cuenta con el código de invitación). El
// formulario real vive en ./SignupForm.tsx (componente de cliente).
import { db } from "@/lib/db";
import { getEventSettings } from "@/lib/settings";
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
  const lema = invitation
    ? (await getEventSettings(invitation.organizationId)).lema
    : "Mis XV años";

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{lema}</p>
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
