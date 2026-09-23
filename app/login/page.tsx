// Página pública de login. El shell visual (fondo/tarjeta/eyebrow/título)
// vive en ./LoginForm.tsx, no acá — tiene que ser así porque ese shell
// cambia de identidad genérica de la plataforma al tema del evento del
// invitado según lo que LoginForm resuelve del correo que va escribiendo
// (ver getOrgBrandingForEmail en app/actions/auth.ts), y ese estado solo
// existe en un componente de cliente.
import { Suspense } from "react";
import type { Metadata } from "next";
import { COMPANY_NAME } from "@/lib/company";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: `Iniciar sesión · ${COMPANY_NAME}`,
  description: "Inicia sesión para administrar tu evento.",
};

export default function LoginPage() {
  // Next.js exige envolver en <Suspense> a cualquier componente que use
  // useSearchParams() (como LoginForm, para leer ?device=...).
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
