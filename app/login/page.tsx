import { Suspense } from "react";
import { getEventSettings } from "@/lib/settings";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const settings = await getEventSettings();

  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">{settings.lema}</p>
        <h1>Iniciar sesión</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
