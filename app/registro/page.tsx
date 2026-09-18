import { getEventSettings } from "@/lib/settings";
import SignupForm from "./SignupForm";

export default async function RegistroPage() {
  const settings = await getEventSettings();

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{settings.lema}</p>
        <h1>Crear mi invitación</h1>
        <p className="auth-subtitle">
          Regístrate para recibir tu invitación con código QR y poder subir
          fotos del evento.
        </p>
        <SignupForm />
      </div>
    </main>
  );
}
