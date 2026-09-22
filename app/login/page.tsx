// Página pública de login. El formulario real vive en ./LoginForm.tsx (tiene
// que ser un componente de cliente aparte porque usa hooks de React, algo
// que un Server Component como este no puede hacer).
//
// A diferencia de /registro, acá no hay forma de saber a qué organización
// pertenece quien todavía no inició sesión (no hay código de invitación en
// la URL), así que el texto es genérico de la plataforma, no el lema de un
// evento puntual.
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">Mis XV años</p>
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
