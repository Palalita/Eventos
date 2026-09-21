// Página pública de login. El formulario real vive en ./LoginForm.tsx (tiene
// que ser un componente de cliente aparte porque usa hooks de React, algo
// que un Server Component como este no puede hacer).
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
        {/* Next.js exige envolver en <Suspense> a cualquier componente que
            use useSearchParams() (como LoginForm, para leer ?device=...) */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
