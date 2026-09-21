// Página pública de registro (crear cuenta con el código de invitación). El
// formulario real vive en ./SignupForm.tsx (componente de cliente).
import { getEventSettings } from "@/lib/settings";
import SignupForm from "./SignupForm";

export default async function RegistroPage({
  searchParams,
}: PageProps<"/registro">) {
  const settings = await getEventSettings();
  // Si el invitado llegó desde el link del correo (/registro?code=XXXX), se
  // precarga el código para que no tenga que copiarlo/pegarlo a mano.
  const { code } = await searchParams;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{settings.lema}</p>
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
