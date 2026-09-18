import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { getEventSettings, getSectionFlags } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import { reviewPhoto } from "@/app/actions/photos";
import Countdown from "./Countdown";
import UploadForm from "./UploadForm";
import ModalButton from "./ModalButton";
import MediaPreview from "./MediaPreview";

type EventSettings = Awaited<ReturnType<typeof getEventSettings>>;
type SectionFlags = Awaited<ReturnType<typeof getSectionFlags>>;
type Phase = "PRE_EVENT" | "EVENT";

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export default async function Home() {
  const session = await verifySession();
  const [user, settings, flags] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId } }),
    getEventSettings(),
    getSectionFlags(),
  ]);

  const fechaFormateada = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(settings.fechaEvento);

  return (
    <main style={user.role === "GUEST" ? { paddingBottom: "5rem" } : undefined}>
      <header className="dashboard-header" style={{ padding: "1.5rem 1.5rem 0" }}>
        <div>
          <p className="hero-eyebrow" style={{ fontSize: "1.2rem", margin: 0 }}>
            {settings.lema}
          </p>
          <h1 style={{ margin: 0 }}>{settings.quinceaneraNombre}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          {user.role === "ADMIN" && (
            <>
              <Link href="/admin/invitados" className="btn btn-secondary">
                Invitados
              </Link>
              <Link href="/admin/paginas" className="btn btn-secondary">
                Páginas
              </Link>
              <Link href="/admin/contenido" className="btn btn-secondary">
                Contenido
              </Link>
              <Link href="/admin/dispositivos" className="btn btn-secondary">
                Dispositivos
              </Link>
            </>
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
          {fechaFormateada} · {settings.lugar}
        </p>
        <Countdown target={settings.fechaEvento.toISOString()} />
      </section>

      {user.role === "ADMIN" ? (
        <>
          <AdminHome />
          <MediaGallery phase="PRE_EVENT" title="Fotos y videos preevento" />
          <MediaGallery phase="EVENT" title="Fotos y videos del evento" />
        </>
      ) : (
        <GuestHome settings={settings} flags={flags} qrToken={user.qrToken} attended={user.attended} userId={user.id} />
      )}
    </main>
  );
}

async function AdminHome() {
  const [pendientesPre, pendientesEvento, totalAprobadas, totalInvitados, totalAsistieron] =
    await Promise.all([
      db.photoRequest.findMany({
        where: { status: "PENDING", phase: "PRE_EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.findMany({
        where: { status: "PENDING", phase: "EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.count({ where: { status: "APPROVED" } }),
      db.user.count({ where: { role: "GUEST" } }),
      db.user.count({ where: { role: "GUEST", attended: true } }),
    ]);

  return (
    <div className="dashboard" style={{ paddingTop: 0 }}>
      <section className="stats-row">
        <div className="stat">
          <strong>{pendientesPre.length + pendientesEvento.length}</strong>
          <span>Solicitudes pendientes</span>
        </div>
        <div className="stat">
          <strong>{totalAprobadas}</strong>
          <span>Aprobadas</span>
        </div>
        <div className="stat">
          <strong>
            {totalAsistieron}/{totalInvitados}
          </strong>
          <span>Invitados asistieron</span>
        </div>
      </section>

      <PendingList title="Solicitudes preevento" items={pendientesPre} />
      <PendingList title="Solicitudes del evento" items={pendientesEvento} />
    </div>
  );
}

function PendingList({
  title,
  items,
}: {
  title: string;
  items: {
    id: string;
    mediaType: "PHOTO" | "VIDEO";
    description: string | null;
    user: { name: string; email: string };
  }[];
}) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p>No hay solicitudes pendientes.</p>}
      <ul className="review-list">
        {items.map((foto) => (
          <li key={foto.id} className="review-item">
            <MediaPreview
              src={`/api/fotos/${foto.id}`}
              mediaType={foto.mediaType}
              alt={foto.description ?? "Foto del evento"}
              className="thumb-media thumb-media--lg"
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
  );
}

function GuestHome({
  settings,
  flags,
  qrToken,
  attended,
  userId,
}: {
  settings: EventSettings;
  flags: SectionFlags;
  qrToken: string;
  attended: boolean;
  userId: string;
}) {
  return (
    <>
      {flags.invitacion && <InvitacionSection settings={settings} />}
      {flags.save_the_date && <SaveTheDateSection settings={settings} />}
      {flags.preevento_ver && (
        <MediaGallery phase="PRE_EVENT" title="Fotos y videos preevento" />
      )}
      {flags.evento_ver && (
        <MediaGallery phase="EVENT" title="Fotos y videos del evento" />
      )}

      <div className="floating-bar">
        <div className="floating-bar-inner">
          <ModalButton label="Ver mi código QR" icon="🎟️">
            <h2>Mi invitación</h2>
            <div className="invite-qr">
              <Image
                src={`/api/qr/${qrToken}`}
                alt="Código QR de tu invitación"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <p>
              {attended
                ? "✓ Ya registraste tu asistencia al evento."
                : "Muestra este código QR en la entrada del evento."}
            </p>
          </ModalButton>

          {flags.preevento_subir && (
            <ModalButton label="Subir preevento" icon="📷">
              <h2>Subir foto o video preevento</h2>
              <UploadForm phase="PRE_EVENT" />
              <MisEnvios phase="PRE_EVENT" userId={userId} />
            </ModalButton>
          )}

          {flags.evento_subir && (
            <ModalButton label="Subir del evento" icon="🎥">
              <h2>Subir foto o video del evento</h2>
              <UploadForm phase="EVENT" />
              <MisEnvios phase="EVENT" userId={userId} />
            </ModalButton>
          )}
        </div>
      </div>
    </>
  );
}

function InvitacionSection({ settings }: { settings: EventSettings }) {
  return (
    <section className="content-section">
      <h2>Invitación e Indicaciones</h2>
      <p>{settings.lugar}</p>
      {settings.indicaciones && <p>{settings.indicaciones}</p>}
    </section>
  );
}

function SaveTheDateSection({ settings }: { settings: EventSettings }) {
  if (!settings.saveTheDateMensaje) return null;
  return (
    <section className="content-section">
      <h2>Save the Date</h2>
      <p>{settings.saveTheDateMensaje}</p>
    </section>
  );
}

async function MediaGallery({ phase, title }: { phase: Phase; title: string }) {
  const items = await db.photoRequest.findMany({
    where: { status: "APPROVED", phase },
    orderBy: { reviewedAt: "desc" },
    take: 40,
  });

  return (
    <section className="gallery-section">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="gallery-empty">
          Aquí aparecerán las fotos y videos aprobados.
        </p>
      ) : (
        <div className="collage">
          {items.map((item, index) => (
            <MediaPreview
              key={item.id}
              src={item.fileUrl}
              mediaType={item.mediaType}
              alt={item.description ?? "Foto del evento"}
              loading={index < 6 ? "eager" : "lazy"}
              autoPlay={item.mediaType === "VIDEO"}
            />
          ))}
        </div>
      )}
    </section>
  );
}

async function MisEnvios({ phase, userId }: { phase: Phase; userId: string }) {
  const items = await db.photoRequest.findMany({
    where: { userId, phase, status: { not: "APPROVED" } },
    orderBy: { createdAt: "desc" },
  });

  if (items.length === 0) return null;

  return (
    <>
      <h3 style={{ marginTop: "1.5rem" }}>Mis envíos en trámite</h3>
      <ul className="photo-list">
        {items.map((foto) => (
          <li key={foto.id} className="photo-list-item">
            <MediaPreview
              src={`/api/fotos/${foto.id}`}
              mediaType={foto.mediaType}
              alt={foto.description ?? "Foto del evento"}
              className="thumb-media thumb-media--sm"
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
  );
}
