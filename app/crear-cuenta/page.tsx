// Página pública de alta de un cliente nuevo: crea su propia organización
// (evento) y su cuenta de admin. El formulario real vive en
// ./CreateOrgForm.tsx (componente de cliente).
import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/company";
import CreateOrgForm from "./CreateOrgForm";

export const metadata: Metadata = {
  title: `Creá tu evento · ${COMPANY_NAME}`,
  description: "Dá de alta el sitio de tu evento: invitaciones, galería de fotos y más.",
};

export default function CrearCuentaPage() {
  return (
    <main className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-back-row">
          <Link href="/" className="auth-back-link">
            ← Volver
          </Link>
        </div>
        <p className="platform-eyebrow">{COMPANY_NAME}</p>
        <h1>Creá tu evento</h1>
        <p className="auth-subtitle">
          Tu propio sitio para invitaciones, galería de fotos y más — listo en
          un par de minutos.
        </p>
        <CreateOrgForm />
      </div>
    </main>
  );
}
