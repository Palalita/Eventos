import { eventConfig } from "@/lib/event-config";
import SignupForm from "./SignupForm";

export default function RegistroPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{eventConfig.lema}</p>
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
