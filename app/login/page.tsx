import { eventConfig } from "@/lib/event-config";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{eventConfig.lema}</p>
        <h1>Iniciar sesión</h1>
        <LoginForm />
      </div>
    </main>
  );
}
