// Página pública de alta de un cliente nuevo: crea su propia organización
// (evento) y su cuenta de admin. El formulario real vive en
// ./CreateOrgForm.tsx (componente de cliente).
import type { Metadata } from "next";
import CreateOrgForm from "./CreateOrgForm";

export const metadata: Metadata = {
  title: "Creá tu evento · Eventos",
  description: "Dá de alta el sitio de tu evento: invitaciones, galería de fotos y más.",
};

export default function CrearCuentaPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <p className="invite-eyebrow">Eventos</p>
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
