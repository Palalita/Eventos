// Página pública de alta de un cliente nuevo: crea su propia organización
// (evento) y su cuenta de admin. El formulario real vive en
// ./CreateOrgForm.tsx (componente de cliente).
import CreateOrgForm from "./CreateOrgForm";

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
