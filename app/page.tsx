import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { eventConfig } from "@/lib/event-config";
import { logout } from "@/app/actions/auth";
import { reviewPhoto } from "@/app/actions/photos";
import Countdown from "./Countdown";
import UploadForm from "./UploadForm";
import Disclosure from "./Disclosure";

const fechaFormateada = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "full",
  timeStyle: "short",
}).format(eventConfig.fechaEvento);

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export default async function Home() {
  const session = await verifySession();
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const galeria = await db.photoRequest.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    take: 40,
  });

  return (
    <main>
      <header className="dashboard-header" style={{ padding: "1.5rem 1.5rem 0" }}>
        <div>
          <p className="hero-eyebrow" style={{ fontSize: "1.2rem", margin: 0 }}>
            {eventConfig.lema}
          </p>
          <h1 style={{ margin: 0 }}>{eventConfig.quinceaneraNombre}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          {user.role === "ADMIN" && (
            <Link href="/admin/invitados" className="btn btn-secondary">
              Invitados y asistencia
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <section className="hero" style={{ minHeight: "auto", padding: "1.5rem" }}>
        <p className="hero-date">
          {fechaFormateada} · {eventConfig.lugar}
        </p>
        <Countdown target={eventConfig.fechaEvento.toISOString()} />
      </section>

      {user.role === "ADMIN" ? (
        <>
          <AdminSection />
          <CollageGallery galeria={galeria} />
        </>
      ) : (
        <>
          <CollageGallery galeria={galeria} />
          <GuestToolbar qrToken={user.qrToken} attended={user.attended} userId={user.id} />
        </>
      )}
    </main>
  );
}

function CollageGallery({
  galeria,
}: {
  galeria: { id: string; fileName: string; description: string | null }[];
}) {
  return (
    <section className="gallery-section">
      <h2>Galería del evento</h2>
      {galeria.length === 0 ? (
        <p className="gallery-empty">
          Aquí aparecerán las fotos aprobadas del evento.
        </p>
      ) : (
        <div className="collage">
          {galeria.map((foto, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={foto.id}
              src={`/api/fotos/${foto.fileName}`}
              alt={foto.description ?? "Foto del evento"}
              loading={index < 6 ? "eager" : "lazy"}
            />
          ))}
        </div>
      )}
    </section>
  );
}

async function AdminSection() {
  const pendientes = await db.photoRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const totalAprobadas = await db.photoRequest.count({ where: { status: "APPROVED" } });
  const totalInvitados = await db.user.count({ where: { role: "GUEST" } });
  const totalAsistieron = await db.user.count({ where: { role: "GUEST", attended: true } });

  return (
    <div className="dashboard" style={{ paddingTop: 0 }}>
      <section className="stats-row">
        <div className="stat">
          <strong>{pendientes.length}</strong>
          <span>Solicitudes pendientes</span>
        </div>
        <div className="stat">
          <strong>{totalAprobadas}</strong>
          <span>Fotos aprobadas</span>
        </div>
        <div className="stat">
          <strong>
            {totalAsistieron}/{totalInvitados}
          </strong>
          <span>Invitados asistieron</span>
        </div>
      </section>

      <section className="card">
        <h2>Solicitudes de fotos pendientes</h2>
        {pendientes.length === 0 && <p>No hay solicitudes pendientes.</p>}
        <ul className="review-list">
          {pendientes.map((foto) => (
            <li key={foto.id} className="review-item">
              <Image
                src={`/api/fotos/${foto.fileName}`}
                alt={foto.description ?? "Foto del evento"}
                width={220}
                height={220}
                unoptimized
              />
              <div className="review-details">
                <p>
                  <strong>{foto.user.name}</strong> ({foto.user.email})
                </p>
                {foto.description && <p>{foto.description}</p>}
                <form action={reviewPhoto} className="review-actions">
                  <input type="hidden" name="id" value={foto.id} />
                  <input type="text" name="comentario" placeholder="Comentario (opcional)" />
                  <div className="review-buttons">
                    <button type="submit" name="decision" value="APPROVED" className="btn btn-primary">
                      Aprobar
                    </button>
                    <button type="submit" name="decision" value="REJECTED" className="btn btn-danger">
                      Rechazar
                    </button>
                  </div>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function GuestToolbar({
  qrToken,
  attended,
  userId,
}: {
  qrToken: string;
  attended: boolean;
  userId: string;
}) {
  const misFotos = await db.photoRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="guest-toolbar">
      <Disclosure label="Ver mi código QR" openLabel="Ocultar código QR">
        <div className="invite-qr">
          <Image
            src={`/api/qr/${qrToken}`}
            alt="Código QR de tu invitación"
            width={180}
            height={180}
            unoptimized
          />
        </div>
        <p>
          {attended
            ? "✓ Ya registraste tu asistencia al evento."
            : "Muestra este código QR en la entrada del evento."}
        </p>
      </Disclosure>

      <Disclosure label="Solicitar subir foto" openLabel="Cerrar formulario">
        <UploadForm />

        {misFotos.length > 0 && (
          <>
            <h3 style={{ marginTop: "1.5rem" }}>Mis fotos</h3>
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
          </>
        )}
      </Disclosure>
    </div>
  );
}
