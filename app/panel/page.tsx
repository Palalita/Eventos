import Image from "next/image";
import { requireGuest } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import UploadForm from "./UploadForm";

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export default async function PanelPage() {
  const session = await requireGuest();

  const user = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  const misFotos = await db.photoRequest.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Hola, {user.name}</h1>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="card">
        <h2>Mi invitación</h2>
        <div className="invite-qr">
          <Image
            src={`/api/qr/${user.qrToken}`}
            alt="Código QR de tu invitación"
            width={180}
            height={180}
            unoptimized
          />
        </div>
        <p>
          {user.attended
            ? "✓ Ya registraste tu asistencia al evento."
            : "Muestra este código QR en la entrada del evento."}
        </p>
      </section>

      <section className="card">
        <h2>Subir foto del evento</h2>
        <UploadForm />
      </section>

      <section className="card">
        <h2>Mis fotos</h2>
        {misFotos.length === 0 && <p>Aún no has subido ninguna foto.</p>}
        <ul className="photo-list">
          {misFotos.map((foto) => (
            <li key={foto.id} className="photo-list-item">
              <Image
                src={`/api/fotos/${foto.fileName}`}
                alt={foto.description ?? "Foto del evento"}
                width={120}
                height={120}
                unoptimized
              />
              <div>
                <p className={`status-badge status-${foto.status.toLowerCase()}`}>
                  {estadoLabel[foto.status]}
                </p>
                {foto.description && <p>{foto.description}</p>}
                {foto.adminComment && (
                  <p className="admin-comment">Comentario: {foto.adminComment}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
